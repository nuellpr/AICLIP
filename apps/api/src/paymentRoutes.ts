import { FastifyInstance } from 'fastify';
import { prisma } from '@clipforge/database';
import { createMayarInvoice, parseMayarWebhook } from './services/mayar';
import { createIpaymuRedirectInvoice, parseIpaymuCallback, verifyIpaymuCallbackSignature } from './services/ipaymu';
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

async function settleAndCredit(orderId: string, paymentType: string, server: FastifyInstance) {
  const transaction = await (prisma as any).transaction.findUnique({ where: { orderId } });
  if (!transaction) return { ok: false, code: 404 as const, error: 'Transaksi tidak ditemukan' };
  if (transaction.status === 'SETTLEMENT') return { ok: true, transaction, already: true as const };
  await (prisma as any).transaction.update({ where: { orderId }, data: { status: 'SETTLEMENT', paymentType } });
  let subscription = await prisma.subscription.findFirst({ where: { userId: transaction.userId } });
  if (!subscription) {
    subscription = await prisma.subscription.create({
      data: { userId: transaction.userId, plan: transaction.plan.startsWith('TOPUP') ? 'FREE' : transaction.plan, status: 'ACTIVE', credits: transaction.creditsAdded },
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
  server.log.info(`Added ${transaction.creditsAdded} credits to user ${transaction.userId} via ${paymentType}`);
  return { ok: true, transaction, already: false as const };
}

export default async function paymentRoutes(server: FastifyInstance) {
  // iPaymu callback sends x-www-form-urlencoded by default — need parser
  server.addContentTypeParser('application/x-www-form-urlencoded', { parseAs: 'string' }, (req, body, done) => {
    try {
      const params = new URLSearchParams(body as string);
      const obj: Record<string, string> = {};
      for (const [k, v] of params.entries()) obj[k] = v;
      done(null, obj);
    } catch (e) { done(e as Error, undefined); }
  });

  // 1. Create Checkout Session (iPaymu or Mayar)
  server.post('/checkout', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const body = request.body as { planId?: string; provider?: string };
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
      const wantIpaymu = (body?.provider || process.env.PAYMENT_PROVIDER || '').toLowerCase();
      const ipaymuConfigured = !!(process.env.IPAYMU_VA && process.env.IPAYMU_API_KEY);
      const useIpaymu = wantIpaymu === 'ipaymu' || (wantIpaymu !== 'mayar' && ipaymuConfigured);

      let payLink: string;
      let payId: string;
      let paymentProvider: string;

      if (useIpaymu) {
        const ipaymuResult = await createIpaymuRedirectInvoice({
          referenceId: orderId,
          productName: selectedPlan.name,
          price: selectedPlan.price,
          qty: 1,
          buyerName: user.name || 'Pelanggan ClipForge',
          buyerEmail: user.email,
          buyerPhone: user.phone || '081234567890',
        });
        payLink = ipaymuResult.link;
        payId = ipaymuResult.id;
        paymentProvider = 'ipaymu';
      } else {
        const mayarResult = await createMayarInvoice({
          invoiceId: orderId,
          customer: {
            name: user.name || 'Pelanggan ClipForge',
            email: user.email,
            mobile: user.phone || '081234567890',
          },
          items: [{ quantity: 1, rate: selectedPlan.price, description: selectedPlan.name }],
        });
        payLink = mayarResult.link;
        payId = mayarResult.id;
        paymentProvider = 'mayar';
      }

      const transaction = await (prisma as any).transaction.create({
        data: {
          orderId,
          userId: user.id,
          plan: selectedPlan.id,
          amount: selectedPlan.price,
          creditsAdded: selectedPlan.credits,
          status: 'PENDING',
          snapToken: payId,
          snapUrl: payLink,
          paymentType: paymentProvider,
        },
      });

      return reply.send({
        status: 'success',
        orderId: transaction.orderId,
        paymentUrl: payLink,
        provider: paymentProvider,
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
      if (!paid || !orderId) return reply.send({ status: 'ignored' });
      const transaction = await (prisma as any).transaction.findUnique({ where: { orderId } });
      if (!transaction) return reply.status(404).send({ error: 'Transaksi tidak ditemukan' });
      if (amount !== null && amount !== transaction.amount) {
        server.log.warn(`Amount mismatch for order ${orderId}: expected ${transaction.amount}, got ${amount}`);
        return reply.status(400).send({ error: 'Amount tidak cocok' });
      }
      const res = await settleAndCredit(orderId, 'mayar', server);
      if (!res.ok) return reply.status((res as any).code).send({ error: (res as any).error });
      return reply.send({ status: 'ok', orderId, newStatus: 'SETTLEMENT' });
    } catch (err: any) {
      server.log.error('Webhook error:', err);
      return reply.status(500).send({ error: err.message || 'Gagal memproses webhook' });
    }
  });

  // 2b. iPaymu Callback (notifyUrl) — supports json & x-www-form-urlencoded, X-Signature validation
  async function handleIpaymuCallback(request: any, reply: any) {
    try {
      const payload = request.body as any;
      if (!payload || typeof payload !== 'object') return reply.status(400).send({ error: 'Payload kosong' });
      const sig = (request.headers['x-signature'] || request.headers['signature'] || request.headers['x_signature']) as string | undefined;
      const sigOk = verifyIpaymuCallbackSignature(payload, sig);
      if (!sigOk) {
        server.log.warn(`iPaymu callback invalid signature for ref=${payload.reference_id || payload.referenceId}, sig=${sig}`);
        // tetap balas 200 agar tidak retry terus, tapi jangan proses jika VA diset
        if (process.env.IPAYMU_VA) return reply.status(400).send({ error: 'Invalid signature' });
      }
      const { orderId, paid, amount } = parseIpaymuCallback(payload);
      server.log.info(`Received iPaymu callback reference_id=${orderId}, paid=${paid}, status=${payload.status}, status_code=${payload.status_code}`);
      if (!orderId) return reply.send({ status: 'ignored', reason: 'no reference_id' });
      if (!paid) {
        // pending / expired — update status if expired
        if (String(payload.status).toLowerCase() === 'expired' || String(payload.status_code) === '-2') {
          await (prisma as any).transaction.updateMany({ where: { orderId, status: 'PENDING' }, data: { status: 'EXPIRED' } });
        }
        return reply.send({ status: 'ignored', reason: 'not paid' });
      }
      const transaction = await (prisma as any).transaction.findUnique({ where: { orderId } });
      if (!transaction) {
        server.log.warn(`iPaymu: transaction ${orderId} not found`);
        return reply.status(404).send({ error: 'Transaksi tidak ditemukan' });
      }
      if (amount !== null && amount !== transaction.amount) {
        server.log.warn(`iPaymu amount mismatch for ${orderId}: expected ${transaction.amount}, got ${amount}`);
        return reply.status(400).send({ error: 'Amount tidak cocok' });
      }
      const res = await settleAndCredit(orderId, 'ipaymu', server);
      if (!res.ok) return reply.status((res as any).code).send({ error: (res as any).error });
      return reply.send({ status: 'ok', orderId, newStatus: 'SETTLEMENT' });
    } catch (err: any) {
      server.log.error('iPaymu callback error:', err);
      return reply.status(500).send({ error: err.message || 'Gagal memproses callback' });
    }
  }
  server.post('/ipaymu-callback', handleIpaymuCallback);
  server.post('/ipaymu/notify', handleIpaymuCallback); // alias for legacy notifyUrl
  server.post('/callback/ipaymu', handleIpaymuCallback);

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
    if (process.env.NODE_ENV === 'production') return reply.code(404).send({error:'Not found'});
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
