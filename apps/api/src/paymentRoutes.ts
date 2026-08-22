import { FastifyInstance } from 'fastify';
import { prisma } from '@clipforge/database';
import { createSnapTransaction, verifyMidtransSignature } from './services/midtrans';
import { authenticate, getUserId } from './guards';

export interface PlanConfig {
  id: string;
  name: string;
  price: number;
  credits: number; // In minutes
  type: 'SUBSCRIPTION' | 'TOPUP';
}

export const PLANS: Record<string, PlanConfig> = {
  CREATOR: {
    id: 'CREATOR',
    name: 'Paket Creator (100 Menit)',
    price: 99000,
    credits: 100,
    type: 'SUBSCRIPTION',
  },
  PRO: {
    id: 'PRO',
    name: 'Paket Pro (300 Menit)',
    price: 249000,
    credits: 300,
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
  // 1. Create Checkout Session
  server.post('/checkout', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const body = request.body as { planId?: string; email?: string; name?: string };
      const planId = body?.planId || 'CREATOR';
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

      const snapResult = await createSnapTransaction({
        orderId,
        amount: selectedPlan.price,
        items: [
          {
            id: selectedPlan.id,
            name: selectedPlan.name,
            price: selectedPlan.price,
            quantity: 1,
          },
        ],
        customer: {
          first_name: user.name || 'Pelanggan ClipForge',
          email: user.email,
        },
      });

      const transaction = await (prisma as any).transaction.create({
        data: {
          orderId,
          userId: user.id,
          plan: selectedPlan.id,
          amount: selectedPlan.price,
          creditsAdded: selectedPlan.credits,
          status: 'PENDING',
          snapToken: snapResult.token,
          snapUrl: snapResult.redirect_url,
        },
      });

      return reply.send({
        status: 'success',
        orderId: transaction.orderId,
        snapToken: snapResult.token,
        snapUrl: snapResult.redirect_url,
      });
    } catch (err: any) {
      server.log.error('Checkout error:', err);
      return reply.status(500).send({ error: err.message || 'Gagal membuat sesi pembayaran' });
    }
  });

  // 2. Midtrans Notification Webhook
  server.post('/webhook', async (request, reply) => {
    try {
      const payload = request.body as any;
      const {
        order_id,
        status_code,
        gross_amount,
        signature_key,
        transaction_status,
        payment_type,
        fraud_status,
      } = payload;

      server.log.info(`Received Midtrans notification for Order ${order_id}, Status: ${transaction_status}`);

      if (!order_id || !status_code || !gross_amount || !signature_key) {
        return reply.status(400).send({ error: 'Invalid payload' });
      }

      // Verify SHA512 signature key
      const isValidSignature = verifyMidtransSignature(order_id, status_code, gross_amount, signature_key);
      if (!isValidSignature) {
        server.log.warn(`Invalid signature for order ${order_id}`);
        return reply.status(403).send({ error: 'Signature key tidak valid' });
      }

      const transaction = await (prisma as any).transaction.findUnique({
        where: { orderId: order_id },
      });

      if (!transaction) {
        server.log.warn(`Transaction order ${order_id} not found in database`);
        return reply.status(404).send({ error: 'Transaksi tidak ditemukan' });
      }

      let newStatus = transaction.status;

      if (transaction_status === 'capture') {
        if (fraud_status === 'accept') {
          newStatus = 'SETTLEMENT';
        }
      } else if (transaction_status === 'settlement') {
        newStatus = 'SETTLEMENT';
      } else if (transaction_status === 'cancel' || transaction_status === 'deny') {
        newStatus = 'CANCELLED';
      } else if (transaction_status === 'expire') {
        newStatus = 'EXPIRED';
      } else if (transaction_status === 'pending') {
        newStatus = 'PENDING';
      }

      // Update Transaction in DB
      await (prisma as any).transaction.update({
        where: { orderId: order_id },
        data: {
          status: newStatus,
          paymentType: payment_type || transaction.paymentType,
        },
      });

      // If SETTLEMENT, top-up user subscription credits!
      if (newStatus === 'SETTLEMENT' && transaction.status !== 'SETTLEMENT') {
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
      }

      return reply.send({ status: 'ok', orderId: order_id, newStatus });
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
