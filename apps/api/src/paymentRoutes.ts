import { FastifyInstance } from 'fastify';
import { prisma } from '@clipforge/database';
import { createMayarInvoice, parseMayarWebhook, verifyMayarInvoicePaid } from './services/mayar';
import { createIpaymuRedirectInvoice, parseIpaymuCallback, verifyIpaymuCallbackSignature } from './services/ipaymu';
import { authenticate, getUserId } from './guards';

export interface PlanConfig {
  id: string;
  name: string;
  price: number;
  credits: number; // 1 kredit = 1 proyek (1 URL = 3 klip)
  type: 'SUBSCRIPTION' | 'TOPUP';
}

// Satu sumber kebenaran harga — disamakan dengan landing page (/home).
export const PLANS: Record<string, PlanConfig> = {  STANDAR: {
    id: 'STANDAR',
    name: 'Paket Standar (30 Kredit)',
    price: 30000,
    credits: 30,
    type: 'SUBSCRIPTION',
  },
  PRO: {
    id: 'PRO',
    name: 'Paket Pro (100 Kredit)',
    price: 50000,
    credits: 100,
    type: 'SUBSCRIPTION',
  },
  TOPUP_30: {
    id: 'TOPUP_30',
    name: 'Top-Up 30 Kredit',
    price: 29000,
    credits: 30,
    type: 'TOPUP',
  },
  TOPUP_100: {
    id: 'TOPUP_100',
    name: 'Top-Up 100 Kredit',
    price: 79000,
    credits: 100,
    type: 'TOPUP',
  },
};

// Kode promo: { KODE: { discount, emails?, expiresAt? } }. emails = whitelist
// email pemakai; expiresAt = ISO date, lewat itu kode dianggap kadaluarsa.
export const PROMO_CODES: Record<string, { discount: number; emails?: string[]; expiresAt?: string }> = {
  FORGE1: {
    discount: 0.99,
    emails: ['nuellpr@gmail.com'],
  },
};

function promoError(promo: { emails?: string[]; expiresAt?: string } | undefined, email?: string): string | null {
  if (!promo) return 'Kode tidak ditemukan atau sudah kadaluarsa';
  if (promo.expiresAt && new Date(promo.expiresAt) < new Date()) return 'Kode sudah kadaluarsa';
  if (promo.emails && !promo.emails.some((e) => e.toLowerCase() === (email || '').toLowerCase())) {
    return 'Kode tidak berlaku untuk akun ini';
  }
  return null;
}

async function settleAndCredit(orderId: string, paymentType: string, server: FastifyInstance) {
  // Atomic: CAS PENDING→SETTLEMENT dan penambahan kredit dalam satu
  // transaksi DB, agar tidak ada settlement yang kehilangan kredit dan
  // settlement paralel untuk order berbeda tidak saling menimpa kredit
  // (increment, bukan read-then-write).
  const result = await prisma.$transaction(async (tx) => {
    const txAny = tx as any;
    const transaction = await txAny.transaction.findUnique({ where: { orderId } });
    if (!transaction) return { ok: false as const, code: 404 as const, error: 'Transaksi tidak ditemukan' };
    // Atomic CAS: hanya proses transaksi berstatus PENDING sekali; webhook/callback/simulate
    // yang datang paralel tidak akan double-credit.
    const settled = await txAny.transaction.updateMany({
      where: { orderId, status: 'PENDING' },
      data: { status: 'SETTLEMENT', paymentType }
    });
    if (settled.count === 0) return { ok: true as const, transaction, already: true as const };
    let subscription = await txAny.subscription.findFirst({ where: { userId: transaction.userId } });
    if (!subscription) {
      subscription = await txAny.subscription.create({
        data: { userId: transaction.userId, plan: transaction.plan.startsWith('TOPUP') ? 'FREE' : transaction.plan, status: 'ACTIVE', credits: transaction.creditsAdded },
      });
    } else {
      await txAny.subscription.update({
        where: { id: subscription.id },
        data: {
          credits: { increment: transaction.creditsAdded },
          plan: transaction.plan.startsWith('TOPUP') ? subscription.plan : transaction.plan,
          status: 'ACTIVE',
        },
      });
    }
    return { ok: true as const, transaction, already: false as const };
  });
  if (result.ok && !result.already) {
    server.log.info(`Added ${result.transaction.creditsAdded} credits to user ${result.transaction.userId} via ${paymentType}`);
  }
  return result;
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
      const body = request.body as { planId?: string; provider?: string; promoCode?: string };
      const planId = body?.planId || 'STANDAR';
      const selectedPlan = PLANS[planId];

      if (!selectedPlan) {
        return reply.status(400).send({ error: 'Paket tidak valid' });
      }

      // Kode promo: lihat PROMO_CODES di module scope.
      const promoCode = (body?.promoCode || '').trim().toUpperCase();
      let discount = 0;
      if (promoCode) {
        const email = (
          await prisma.user.findUnique({ where: { id: getUserId(request) }, select: { email: true } })
        )?.email;
        const invalid = promoError(PROMO_CODES[promoCode], email);
        if (invalid) {
          return reply.status(400).send({ error: invalid === 'Kode tidak ditemukan atau sudah kadaluarsa' ? 'Kode referal tidak valid atau sudah kadaluarsa' : invalid });
        }
        discount = PROMO_CODES[promoCode].discount;
        const used = await (prisma as any).transaction.findFirst({
          where: { userId: getUserId(request), promoCode, status: 'SETTLEMENT' },
        });
        if (used) {
          return reply.status(400).send({ error: 'Kode referal hanya bisa dipakai satu kali' });
        }
      }
      // Mayar menolak tagihan < Rp 1.000 ('Tagihan dibawah Rp 1.000 tidak dapat dibayar')
      const finalPrice = Math.max(1000, Math.round(selectedPlan.price * (1 - discount)));

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
          price: finalPrice,
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
          items: [{ quantity: 1, rate: finalPrice, description: selectedPlan.name }],
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
          amount: finalPrice,
          creditsAdded: selectedPlan.credits,
          status: 'PENDING',
          snapToken: payId,
          snapUrl: payLink,
          paymentType: paymentProvider,
          promoCode: promoCode || null,
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
      // Pull verification: webhook Mayar tidak signed — konfirmasi status
      // invoice langsung ke API Mayar (pakai id invoice yang kita simpan)
      // sebelum memberi kredit.
      const verification = await verifyMayarInvoicePaid(transaction.snapToken || '');
      if (verification.outcome === 'error') {
        return reply.status(503).send({ error: 'Gagal verifikasi invoice, webhook akan di-retry' });
      }
      if (verification.outcome === 'unpaid') {
        server.log.warn(`Mayar webhook ignored: invoice ${orderId} is not paid yet`);
        return reply.status(400).send({ error: 'Invoice belum lunas' });
      }
      if (verification.outcome === 'paid' && verification.amount != null && verification.amount !== transaction.amount) {
        server.log.warn(`Mayar verified amount mismatch for order ${orderId}: expected ${transaction.amount}, got ${verification.amount}`);
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
        // Tolak jika VA diset; di production tanpa VA pun tolak (tidak ada cara verifikasi).
        if (process.env.IPAYMU_VA || process.env.NODE_ENV === 'production') {
          return reply.status(400).send({ error: 'Invalid signature' });
        }
        // dev/testing tanpa VA (mock mode): lanjut proses
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

  // 3. Cek kode promo (dipakai UI billing): aktif / kadaluarsa / tidak berlaku / sudah dipakai.
  server.get('/promo/:code', { preHandler: [authenticate] }, async (request, reply) => {
    try {
      const code = ((request.params as { code: string }).code || '').trim().toUpperCase();
      const userId = getUserId(request);
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });
      const invalid = promoError(PROMO_CODES[code], user?.email);
      if (invalid) {
        return reply.send({ valid: false, reason: invalid });
      }
      const used = await (prisma as any).transaction.findFirst({
        where: { userId, promoCode: code, status: 'SETTLEMENT' },
      });
      if (used) {
        return reply.send({ valid: false, reason: 'Kode sudah pernah kamu pakai (satu kali per akun)' });
      }
      return reply.send({ valid: true, discount: PROMO_CODES[code].discount });
    } catch (err: any) {
      return reply.status(500).send({ error: err.message || 'Gagal memeriksa kode' });
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
  server.get('/subscription', { preHandler: [authenticate] }, async (request, reply) => {    try {
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

      const result = await settleAndCredit(orderId, 'qris_simulated', server);
      if (!result.ok) return reply.code(result.code).send({ error: result.error });

      const transaction = result.transaction;
      if (transaction.userId !== userId) return reply.status(403).send({ error: 'Akses ditolak' });

      const subscription = await prisma.subscription.findFirst({ where: { userId } });

      if (result.already) {
        return reply.send({
          status: 'already',
          message: 'Transaksi ini sudah diselesaikan sebelumnya.',
          newCredits: subscription?.credits ?? 0,
        });
      }

      server.log.info(`Simulated payment success for order ${orderId}, added ${transaction.creditsAdded} credits to user ${transaction.userId}`);

      return reply.send({
        status: 'success',
        message: `Simulasi pembayaran berhasil! ${transaction.creditsAdded} kredit telah ditambahkan ke akun.`,
        newCredits: subscription?.credits ?? 0,
      });
    } catch (e: any) {
      return reply.status(500).send({ error: e.message });
    }
  });
}
