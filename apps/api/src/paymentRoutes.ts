import { FastifyInstance } from 'fastify';
import { prisma } from '@clipforge/database';
import { createMayarInvoice, parseMayarWebhook } from './services/mayar';
import { authenticate, getUserId } from './guards';

export interface PlanConfig {
  id: string;
  name: string;
  price: number;
  credits: number; // In minutes
  type: 'SUBSCRIPTION' | 'TOPUP';
}

// Satu sumber kebenaran harga — disamakan dengan landing page (/home).
export const PLANS: Record<string, PlanConfig> = {
  STANDAR: {
    id: 'STANDAR',
    name: 'Paket Standar (30 Menit)',
    price: 30000,
    credits: 30,
    type: 'SUBSCRIPTION',
  },
  PRO: {
    id: 'PRO',
    name: 'Paket Pro (100 Menit)',
    price: 50000,
    credits: 100,
    type: 'SUBSCRIPTION',
  },
  TOPUP_30: {
    id: 'TOPUP_30',
    name: 'Top-Up 30 Menit',
    price: 29000,
    credits: 30,
    type: 'TOPUP',
  },
  TOPUP_100: {
    id: 'TOPUP_100',
    name: 'Top-Up 100 Menit',
    price: 79000,
    credits: 100,
    type: 'TOPUP',
  },
};

export default async function paymentRoutes(server: FastifyInstance) {
  // 1. Create Checkout Session (Mayar invoice)
  server.post('/checkout', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const body = request.body as { planId?: string };
      const planId = body?.planId || 'STANDAR';
      const selectedPlan = PLANS[planId];

      if (!selectedPlan) {
        return reply.status(400).send({ error: 'Paket tidak valid' });
      }

      const userId = getUserId(request);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return reply.status(404).send({ error: 'User tidak ditemukan' });
      }

      const orderId = `TRX-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const mayarResult = await createMayarInvoice({
        invoiceId: orderId,
        customer: {
          name: user.name || 'Pelanggan ClipForge',
          email: user.email,
          mobile: user.phone || '081234567890',
        },
        items: [
          {
            quantity: 1,
            rate: selectedPlan.price,
            description: selectedPlan.name,
          },
        ],
      });

      const transaction = await (prisma as any).transaction.create({
        data: {
          orderId,
          userId: user.id,
          plan: selectedPlan.id,
          amount: selectedPlan.price,
          creditsAdded: selectedPlan.credits,
          status: 'PENDING',
          snapToken: mayarResult.id,
          snapUrl: mayarResult.link,
        },
      });

      return reply.send({
        status: 'success',
        orderId: transaction.orderId,
        paymentUrl: mayarResult.link,
      });
    } catch (err: any) {
      server.log.error('Checkout error:', err);
      return reply.status(500).send({ error: err.message || 'Gagal membuat sesi pembayaran' });
    }
  });

  // 2. Mayar Webhook (payment.received)
  server.post('/webhook', async (request, reply) => {
    try {
      const payload = request.body as any;
      const { orderId, paid, amount } = parseMayarWebhook(payload);

      server.log.info(`Received Mayar webhook. event=${payload?.event?.received || payload?.eventType}, orderId=${orderId}, paid=${paid}`);

      if (!paid || !orderId) {
        return reply.send({ status: 'ignored' });
      }

      const transaction = await (prisma as any).transaction.findUnique({
        where: { orderId },
      });

      if (!transaction) {
        server.log.warn(`Transaction order ${orderId} not found in database`);
        return reply.status(404).send({ error: 'Transaksi tidak ditemukan' });
      }

      if (amount !== null && amount !== transaction.amount) {
        server.log.warn(`Amount mismatch for order ${orderId}: expected ${transaction.amount}, got ${amount}`);
        return reply.status(400).send({ error: 'Amount tidak cocok' });
      }

      // If already settled, idempotent — no double credit.
      if (transaction.status === 'SETTLEMENT') {
        return reply.send({ status: 'ok', orderId, newStatus: 'SETTLEMENT' });
      }

      await (prisma as any).transaction.update({
        where: { orderId },
        data: { status: 'SETTLEMENT', paymentType: 'mayar' },
      });

      let subscription = await prisma.subscription.findFirst({
        where: { userId: transaction.userId },
      });

      if (!subscription) {
        subscription = await prisma.subscription.create({
          data: {
            userId: transaction.userId,
            plan: transaction.plan.startsWith('TOPUP') ? 'FREE' : transaction.plan,
            status: 'ACTIVE',
            credits: transaction.creditsAdded,
          },
        });
      } else {
        await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            credits: subscription.credits + transaction.creditsAdded,
            plan: transaction.plan.startsWith('TOPUP') ? subscription.plan : transaction.plan,
            status: 'ACTIVE',
          },
        });
      }
      server.log.info(`Successfully added ${transaction.creditsAdded} credits to user ${transaction.userId}`);

      return reply.send({ status: 'ok', orderId, newStatus: 'SETTLEMENT' });
    } catch (err: any) {
      server.log.error('Webhook error:', err);
      return reply.status(500).send({ error: err.message || 'Gagal memproses webhook' });
    }
  });

  // 3. Transaction History
  server.get('/history', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);

      const transactions = await (prisma as any).transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return reply.send({ transactions });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message || 'Gagal mengambil riwayat transaksi' });
    }
  });

  // 4. Current Subscription Info
  server.get('/subscription', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);

      const subscription = await prisma.subscription.findFirst({
        where: { userId },
      });

      return reply.send({ subscription });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message || 'Gagal mengambil status langganan' });
    }
  });

  // 5. Simulate Payment Success (Sandbox/Testing Helper)
  server.post('/simulate-success', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const userId = getUserId(request);
      const { orderId } = request.body as { orderId: string };
      if (!orderId) return reply.status(400).send({ error: 'orderId wajib diisi' });

      const transaction = await (prisma as any).transaction.findUnique({
        where: { orderId },
      });

      if (!transaction) return reply.status(404).send({ error: 'Transaksi tidak ditemukan' });
      if (transaction.userId !== userId) return reply.status(403).send({ error: 'Akses ditolak' });

      await (prisma as any).transaction.update({
        where: { orderId },
        data: { status: 'SETTLEMENT', paymentType: 'qris_simulated' },
      });

      let subscription = await prisma.subscription.findFirst({
        where: { userId: transaction.userId },
      });

      if (!subscription) {
        subscription = await prisma.subscription.create({
          data: {
            userId: transaction.userId,
            plan: transaction.plan.startsWith('TOPUP') ? 'FREE' : transaction.plan,
            status: 'ACTIVE',
            credits: transaction.creditsAdded,
          },
        });
      } else {
        subscription = await prisma.subscription.update({
          where: { id: subscription.id },
          data: {
            credits: subscription.credits + transaction.creditsAdded,
            plan: transaction.plan.startsWith('TOPUP') ? subscription.plan : transaction.plan,
            status: 'ACTIVE',
          },
        });
      }

      server.log.info(`Simulated payment success for order ${orderId}, added ${transaction.creditsAdded} credits to user ${transaction.userId}`);

      return reply.send({
        status: 'success',
        message: `Simulasi pembayaran berhasil! ${transaction.creditsAdded} menit kredit telah ditambahkan ke akun.`,
        newCredits: subscription.credits,
      });
    } catch (e: any) {
      return reply.status(500).send({ error: e.message });
    }
  });
}
