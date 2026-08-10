'use client';

import React, { useState, useEffect } from 'react';
import { CreditCard, Check, Zap, Sparkles, Clock, ArrowRight, ShieldCheck, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

interface Transaction {
  id: string;
  orderId: string;
  plan: string;
  amount: number;
  creditsAdded: number;
  status: string;
  paymentType: string | null;
  snapUrl: string | null;
  createdAt: string;
}

interface Subscription {
  id: string;
  plan: string;
  status: string;
  credits: number;
}

export default function BillingPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
    loadMidtransScript();
  }, []);

  const loadMidtransScript = () => {
    const isProduction = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';
    const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || 'SB-Mid-client-DUMMY';
    const scriptUrl = isProduction
      ? 'https://app.midtrans.com/snap/snap.js'
      : 'https://app.sandbox.midtrans.com/snap/snap.js';

    if (!document.querySelector(`script[src="${scriptUrl}"]`)) {
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.setAttribute('data-client-key', clientKey);
      script.async = true;
      document.body.appendChild(script);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [subRes, txRes] = await Promise.all([
        fetch('/api/payment/subscription'),
        fetch('/api/payment/history'),
      ]);

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData.subscription);
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
      }
    } catch (err: any) {
      console.error('Error fetching billing data:', err);
      setError('Gagal memuat data billing');
    } finally {
      setLoading(false);
    }
  };

  const handleBuyPlan = async (planId: string) => {
    setCheckoutLoading(planId);
    setError(null);
    try {
      const res = await fetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat sesi pembayaran');
      }

      // Check if Midtrans Snap popup is available
      if ((window as any).snap && data.snapToken) {
        (window as any).snap.pay(data.snapToken, {
          onSuccess: function (result: any) {
            console.log('Payment success:', result);
            fetchData();
          },
          onPending: function (result: any) {
            console.log('Payment pending:', result);
            fetchData();
          },
          onError: function (result: any) {
            console.error('Payment error:', result);
            setError('Pembayaran gagal atau dibatalkan');
            fetchData();
          },
          onClose: function () {
            console.log('Customer closed the snap popup');
            fetchData();
          },
        });
      } else if (data.snapUrl) {
        // Fallback: Redirect directly to Midtrans Payment Page
        window.open(data.snapUrl, '_blank');
      } else {
        throw new Error('Metode pembayaran tidak tersedia');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Terjadi kesalahan saat memproses checkout');
    } finally {
      setCheckoutLoading(null);
    }
  };

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(number);
  };

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SETTLEMENT':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full border border-green-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Berhasil
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-full border border-yellow-500/30">
            <Clock className="w-3.5 h-3.5" /> Menunggu Pembayaran
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-red-500/20 text-red-400 px-2.5 py-1 rounded-full border border-red-500/30">
            <AlertCircle className="w-3.5 h-3.5" /> Kadaluarsa
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-gray-500/20 text-gray-400 px-2.5 py-1 rounded-full border border-gray-500/30">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-cyan-400" />
            <span>Langganan & Pembelian Kredit</span>
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Pilih paket langganan atau top-up menit AI instan menggunakan QRIS, GoPay, Transfer Bank, atau Kartu Kredit.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 bg-white/10 hover:bg-white/20 text-gray-300 px-4 py-2 rounded-xl text-xs font-semibold transition-all border border-white/10 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Credit Summary Card */}
      <div className="relative rounded-3xl glass-card p-6 md:p-8 overflow-hidden border border-cyan-500/30 bg-gradient-to-r from-cyan-950/40 via-purple-950/20 to-black shadow-[0_0_50px_rgba(34,211,238,0.1)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-3 py-1 rounded-full border border-cyan-500/20">
                Status Paket Anda
              </span>
              <span className="text-xs font-bold text-green-400 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
                {subscription?.plan || 'FREE'}
              </span>
            </div>
            <p className="text-4xl sm:text-5xl font-black text-white mt-2">
              {subscription?.credits ?? 25} <span className="text-lg font-bold text-gray-400">Menit AI Tersisa</span>
            </p>
            <p className="text-xs text-gray-400 mt-2">
              1 Menit Kredit = 1 Menit pemrosesan AI video YouTube / Upload.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10">
            <ShieldCheck className="w-8 h-8 text-cyan-400 flex-shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-white">Pembayaran Aman 100%</p>
              <p className="text-gray-400">Didukung oleh Midtrans Official Gateway</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <span>Paket Berlangganan Hemat</span>
          </h2>
          <p className="text-xs text-gray-400">Dapatkan alokasi menit AI lebih besar dengan harga lebih terjangkau.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Creator Plan */}
          <div className="relative rounded-3xl glass-panel p-6 sm:p-8 border border-cyan-500/40 bg-gradient-to-b from-cyan-950/30 to-black flex flex-col justify-between hover:border-cyan-400 transition-all shadow-[0_0_30px_rgba(6,182,212,0.15)] group">
            <div className="absolute top-4 right-4 bg-gradient-to-r from-cyan-400 to-purple-500 text-black text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
              Paling Populer
            </div>

            <div>
              <p className="text-lg font-bold text-cyan-400">Paket Creator</p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl sm:text-4xl font-black text-white">{formatRupiah(99000)}</span>
                <span className="text-xs text-gray-400">/ bulan</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Cocok untuk kreator konten harian TikTok & Shorts.</p>

              <div className="my-6 border-t border-white/10 pt-6 space-y-3">
                <div className="flex items-center gap-3 text-xs text-gray-200">
                  <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span><strong>100 Menit</strong> Kredit AI Video</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-200">
                  <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Akses Semua Model AI (DeepSeek, Gemini, GPT-4o)</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-200">
                  <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Export Video 1080p HD Tanpa Watermark</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-200">
                  <Check className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <span>Auto Subtitle Bahasa Gaul & Animasi</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleBuyPlan('CREATOR')}
              disabled={checkoutLoading === 'CREATOR'}
              className="w-full bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-300 hover:to-purple-400 text-black font-extrabold py-3.5 rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.4)] disabled:opacity-50"
            >
              {checkoutLoading === 'CREATOR' ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <span>Beli Paket Creator</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Pro Plan */}
          <div className="relative rounded-3xl glass-panel p-6 sm:p-8 border border-white/10 bg-gradient-to-b from-purple-950/20 to-black flex flex-col justify-between hover:border-purple-500/50 transition-all group">
            <div>
              <p className="text-lg font-bold text-purple-400">Paket Pro Agensi</p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl sm:text-4xl font-black text-white">{formatRupiah(249000)}</span>
                <span className="text-xs text-gray-400">/ bulan</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Untuk agensi media sosial & podcaster profesional.</p>

              <div className="my-6 border-t border-white/10 pt-6 space-y-3">
                <div className="flex items-center gap-3 text-xs text-gray-200">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span><strong>300 Menit</strong> Kredit AI Video</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-200">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Prioritas Render Antrean Cepat</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-200">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Akses Semua Fitur Re-framing 9:16</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-200">
                  <Check className="w-4 h-4 text-purple-400 flex-shrink-0" />
                  <span>Dukungan Pelanggan VIP</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleBuyPlan('PRO')}
              disabled={checkoutLoading === 'PRO'}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-bold py-3.5 rounded-2xl text-xs sm:text-sm transition-all border border-white/20 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {checkoutLoading === 'PRO' ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <span>Beli Paket Pro</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Instant Top-Up Credit Packs */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            <span>Top-Up Kredit Instan (Tanpa Langganan)</span>
          </h2>
          <p className="text-xs text-gray-400">Butuh menit tambahan tanpa berlangganan bulanan? Isi ulang kapan saja.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between hover:border-yellow-500/30 transition-all">
            <div>
              <p className="text-sm font-bold text-white">Top-Up 30 Menit</p>
              <p className="text-xs text-gray-400 mt-0.5">Berlaku selamanya tanpa kadaluarsa</p>
              <p className="text-lg font-black text-yellow-400 mt-2">{formatRupiah(29000)}</p>
            </div>
            <button
              onClick={() => handleBuyPlan('TOPUP_30')}
              disabled={checkoutLoading === 'TOPUP_30'}
              className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-bold px-4 py-2.5 rounded-xl text-xs border border-yellow-500/30 transition-all disabled:opacity-50"
            >
              {checkoutLoading === 'TOPUP_30' ? '...' : 'Beli Top-Up'}
            </button>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-white/10 flex items-center justify-between hover:border-yellow-500/30 transition-all">
            <div>
              <p className="text-sm font-bold text-white">Top-Up 100 Menit</p>
              <p className="text-xs text-gray-400 mt-0.5">Hemat 20% dibanding eceran</p>
              <p className="text-lg font-black text-yellow-400 mt-2">{formatRupiah(79000)}</p>
            </div>
            <button
              onClick={() => handleBuyPlan('TOPUP_100')}
              disabled={checkoutLoading === 'TOPUP_100'}
              className="bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 font-bold px-4 py-2.5 rounded-xl text-xs border border-yellow-500/30 transition-all disabled:opacity-50"
            >
              {checkoutLoading === 'TOPUP_100' ? '...' : 'Beli Top-Up'}
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="space-y-4 pt-6 border-t border-white/10">
        <h2 className="text-lg font-bold text-white">Riwayat Transaksi</h2>

        {transactions.length === 0 ? (
          <div className="text-center py-10 rounded-2xl glass-card border border-white/10 text-gray-400 text-xs">
            Belum ada riwayat transaksi.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-white/10 glass-card">
            <table className="w-full text-left text-xs text-gray-300">
              <thead className="bg-white/5 text-gray-400 uppercase text-[10px] tracking-wider border-b border-white/10">
                <tr>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Paket</th>
                  <th className="p-4">Jumlah</th>
                  <th className="p-4">Kredit</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono font-bold text-white">{tx.orderId}</td>
                    <td className="p-4 font-semibold text-gray-200">{tx.plan}</td>
                    <td className="p-4 font-bold text-cyan-400">{formatRupiah(tx.amount)}</td>
                    <td className="p-4">+{tx.creditsAdded} Menit</td>
                    <td className="p-4">{getStatusBadge(tx.status)}</td>
                    <td className="p-4 text-gray-400">{new Date(tx.createdAt).toLocaleDateString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
