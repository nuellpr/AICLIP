'use client';

import React, { useState, useEffect, useRef } from 'react';
import { CreditCard, Check, Zap, Sparkles, Clock, ArrowRight, ShieldCheck, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '@/lib/api';

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
  const [promoCode, setPromoCode] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (silent: boolean = false): Promise<Transaction[] | null> => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const [subRes, txRes] = await Promise.all([
        apiFetch('/api/payment/subscription'),
        apiFetch('/api/payment/history'),
      ]);

      if (subRes.ok) {
        const subData = await subRes.json();
        setSubscription(subData.subscription);
      }

      if (txRes.ok) {
        const txData = await txRes.json();
        setTransactions(txData.transactions || []);
        return txData.transactions as Transaction[];
      }
      return null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error fetching billing data:', err);
      setError('Gagal memuat data billing');
      return null;
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Polling status pembayaran: cek tiap 5s maksimal 3 menit sampai ada settlement
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPaymentPolling = (orderId: string) => {
    if (pollRef.current) clearInterval(pollRef.current);
    let ticks = 0;
    pollRef.current = setInterval(async () => {
      ticks++;
      const txs = await fetchData(true);
      // Stop hanya jika transaksi YANG DIBELI sekarang sudah settlement
      if (txs?.some(t => t.orderId === orderId && t.status === 'SETTLEMENT') || ticks >= 36) {
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, 5000);
  };

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  const handleBuyPlan = async (planId: string) => {
    setCheckoutLoading(planId);
    setError(null);
    // Buka tab sebelum await agar tidak kena popup blocker (user activation hangus setelah await)
    const payWindow = typeof window !== 'undefined' ? window.open('', '_blank') : null;
    try {
      const res = await apiFetch('/api/payment/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, promoCode: promoCode.trim() || undefined }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat sesi pembayaran');
      }

      // Open iPaymu/Mayar payment page (QRIS, VA, e-wallet, Alfamart, dll)
      if (data.paymentUrl) {
        if (payWindow) {
          payWindow.location.href = data.paymentUrl;
        } else {
          window.open(data.paymentUrl, '_blank');
        }
        startPaymentPolling(data.orderId);
      } else {
        payWindow?.close();
        throw new Error('Metode pembayaran tidak tersedia');
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Checkout error:', err);
      payWindow?.close();
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
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#DBF3E8] text-[#14532D] px-2.5 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" /> Berhasil
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#FDF3D8] text-[#854D0E] px-2.5 py-1 rounded-full">
            <Clock className="w-3.5 h-3.5" /> Menunggu Pembayaran
          </span>
        );
      case 'EXPIRED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[#FDE3E1] text-[#B42318] px-2.5 py-1 rounded-full">
            <AlertCircle className="w-3.5 h-3.5" /> Kadaluarsa
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-[var(--db-cream)] text-[var(--db-gray)] px-2.5 py-1 rounded-full">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[var(--db-line)] pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-[var(--ink)] flex items-center gap-3">
            <CreditCard className="h-8 w-8 text-[#EA4C89]" />
            <span>Langganan & Pembelian Kredit</span>
          </h1>
          <p className="text-sm text-[var(--db-gray)] mt-1">
            Pilih paket langganan atau top-up kredit AI instan menggunakan QRIS, GoPay, Transfer Bank, atau Kartu Kredit.
          </p>
        </div>

        <button
          onClick={() => fetchData()}
          disabled={loading}
          className="self-start md:self-auto flex items-center gap-2 bg-[var(--db-panel)] hover:bg-[var(--db-cream)] text-[var(--ink)] px-4 py-2 rounded-xl text-xs font-semibold transition-all border border-[var(--db-line)] disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Data</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-[#FDE3E1] border border-[#FDE3E1] text-[#B42318] text-sm flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Credit Summary Card */}
      <div className="relative rounded-3xl glass-card p-6 md:p-8 overflow-hidden border border-[var(--db-line)] bg-[var(--db-panel)] shadow-[0_12px_32px_-16px_rgba(13,12,34,0.12)]">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#EA4C89]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#C32361] bg-[#FDE3E1] px-3 py-1 rounded-full">
                Status Paket Anda
              </span>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${(subscription?.plan || 'FREE').toUpperCase() === 'PRO' ? 'bg-[#EA4C89] text-white' : 'bg-[var(--db-cream)] text-[var(--db-gray)]'}`}>
                {subscription?.plan || 'FREE'}
              </span>
            </div>
            <p className="text-4xl sm:text-5xl font-black text-[var(--ink)] mt-2">
              {subscription?.credits ?? 5} <span className="text-lg font-bold text-[var(--db-gray)]">Kredit AI Tersisa</span>
            </p>
            <p className="text-xs text-[var(--db-gray)] mt-2">
              1 Kredit = 1 Proyek (1 URL YouTube menghasilkan 3 klip viral).
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[var(--db-cream)] p-4 rounded-2xl border border-[var(--db-line)]">
            <ShieldCheck className="w-8 h-8 text-[#EA4C89] flex-shrink-0" />
            <div className="text-xs">
              <p className="font-bold text-[var(--ink)]">Pembayaran Aman 100%</p>
              <p className="text-[var(--db-gray)]">Didukung oleh iPaymu • QRIS, VA, e-Wallet</p>
            </div>
          </div>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-[var(--ink)] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#7C3AED]" />
              <span>Paket Berlangganan Hemat</span>
            </h2>
            <p className="text-xs text-[var(--db-gray)]">Dapatkan alokasi kredit AI lebih besar dengan harga lebih terjangkau.</p>
          </div>
          <div>
            <label htmlFor="promo-code" className="block text-[10px] font-bold uppercase tracking-wider text-[var(--db-gray)] mb-1.5">
              Kode Referal (opsional)
            </label>
            <input
              id="promo-code"
              type="text"
              value={promoCode}
              onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
              placeholder="Mis. FORGE1"
              maxLength={20}
              className="w-full sm:w-48 bg-[var(--db-panel)] border border-[var(--db-line)] focus:border-[#EA4C89] outline-none rounded-xl px-3 py-2 text-sm font-bold tracking-wider text-[var(--ink)] placeholder:font-normal placeholder:tracking-normal placeholder:text-[var(--db-gray)]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Standar Plan */}
          <div className={`relative rounded-3xl glass-panel p-6 sm:p-8 flex flex-col justify-between transition-all group ${(subscription?.plan || '').toUpperCase() === 'STANDAR' ? 'border-2 border-[#EA4C89] shadow-[0_16px_40px_-16px_rgba(234,76,137,0.3)]' : 'border border-[var(--db-line)] hover:border-[#EA4C89]/40 shadow-[0_8px_24px_-16px_rgba(13,12,34,0.12)]'}`}>
            <div className="absolute top-4 right-4 bg-[#EA4C89] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
              Paling Populer
            </div>

            <div>
              <p className="text-lg font-bold text-[#EA4C89]">Paket Standar</p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl sm:text-4xl font-black text-[var(--ink)]">{formatRupiah(30000)}</span>
                <span className="text-xs text-[var(--db-gray)]">/ bulan</span>
              </div>
              <p className="text-xs text-[var(--db-gray)] mt-2">Cocok untuk kreator konten harian TikTok & Shorts.</p>

              <div className="my-6 border-t border-[var(--db-line)] pt-6 space-y-3">
                <div className="flex items-center gap-3 text-xs text-[var(--ink)]">
                  <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#EA4C89] text-white"><Check className="w-3 h-3" /></span>
                  <span><strong>30 Kredit</strong> AI Video</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--ink)]">
                  <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#EA4C89] text-white"><Check className="w-3 h-3" /></span>
                  <span>Akses Semua Model AI (DeepSeek, Gemini, GPT-4o)</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--ink)]">
                  <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#EA4C89] text-white"><Check className="w-3 h-3" /></span>
                  <span>Export Video 1080p HD Tanpa Watermark</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--ink)]">
                  <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#EA4C89] text-white"><Check className="w-3 h-3" /></span>
                  <span>Auto Subtitle Bahasa Gaul & Animasi</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleBuyPlan('STANDAR')}
              disabled={checkoutLoading === 'STANDAR'}
              className={`w-full font-extrabold py-3.5 rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${(subscription?.plan || '').toUpperCase() === 'STANDAR' ? 'bg-[#EA4C89] hover:bg-[#C32361] text-white shadow-[0_8px_24px_-8px_rgba(234,76,137,0.5)]' : 'bg-[#0D0C22] hover:bg-[#EA4C89] text-white'}`}
            >
              {checkoutLoading === 'STANDAR' ? (
                <span>Memproses...</span>
              ) : (
                <>
                  <span>Beli Paket Standar</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Pro Plan */}
          <div className={`relative rounded-3xl glass-panel p-6 sm:p-8 flex flex-col justify-between transition-all group ${(subscription?.plan || '').toUpperCase() === 'PRO' ? 'border-2 border-[#EA4C89] shadow-[0_16px_40px_-16px_rgba(234,76,137,0.3)]' : 'border border-[var(--db-line)] hover:border-[#EA4C89]/40 shadow-[0_8px_24px_-16px_rgba(13,12,34,0.12)]'}`}>
            <div>
              <p className="text-lg font-bold text-[#7C3AED]">Paket Pro</p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className="text-3xl sm:text-4xl font-black text-[var(--ink)]">{formatRupiah(50000)}</span>
                <span className="text-xs text-[var(--db-gray)]">/ bulan</span>
              </div>
              <p className="text-xs text-[var(--db-gray)] mt-2">Untuk kreator konten yang lebih produktif & agensi kecil.</p>

              <div className="my-6 border-t border-[var(--db-line)] pt-6 space-y-3">
                <div className="flex items-center gap-3 text-xs text-[var(--ink)]">
                  <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#EA4C89] text-white"><Check className="w-3 h-3" /></span>
                  <span><strong>100 Kredit</strong> AI Video</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--ink)]">
                  <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#EA4C89] text-white"><Check className="w-3 h-3" /></span>
                  <span>Prioritas Render Antrean Cepat</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--ink)]">
                  <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#EA4C89] text-white"><Check className="w-3 h-3" /></span>
                  <span>Akses Semua Fitur Re-framing 9:16</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-[var(--ink)]">
                  <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#EA4C89] text-white"><Check className="w-3 h-3" /></span>
                  <span>Dukungan Pelanggan VIP</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => handleBuyPlan('PRO')}
              disabled={checkoutLoading === 'PRO'}
              className={`w-full font-bold py-3.5 rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${(subscription?.plan || '').toUpperCase() === 'PRO' ? 'bg-[#EA4C89] hover:bg-[#C32361] text-white shadow-[0_8px_24px_-8px_rgba(234,76,137,0.5)]' : 'bg-[#0D0C22] hover:bg-[#EA4C89] text-white'}`}
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
      <div className="space-y-4 pt-4 border-t border-[var(--db-line)]">
        <div>
          <h2 className="text-xl font-bold text-[var(--ink)] flex items-center gap-2">
            <Zap className="w-5 h-5 text-[#F59E0B]" />
            <span>Top-Up Kredit Instan (Tanpa Langganan)</span>
          </h2>
          <p className="text-xs text-[var(--db-gray)]">Butuh kredit tambahan tanpa berlangganan bulanan? Isi ulang kapan saja.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-card p-5 rounded-2xl border border-[var(--db-line)] bg-[var(--db-panel)] flex items-center justify-between hover:border-[#EA4C89] transition-all">
            <div>
              <p className="text-sm font-bold text-[var(--ink)]">Top-Up 30 Kredit</p>
              <p className="text-xs text-[var(--db-gray)] mt-0.5">Berlaku selamanya tanpa kadaluarsa</p>
              <p className="text-lg font-black text-[#F59E0B] mt-2">{formatRupiah(29000)}</p>
            </div>
            <button
              onClick={() => handleBuyPlan('TOPUP_30')}
              disabled={checkoutLoading === 'TOPUP_30'}
              className="bg-[#EA4C89] hover:bg-[#C32361] text-white font-bold px-4 py-2.5 rounded-full text-xs transition-all disabled:opacity-50"
            >
              {checkoutLoading === 'TOPUP_30' ? '...' : 'Beli Top-Up'}
            </button>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-[var(--db-line)] bg-[var(--db-panel)] flex items-center justify-between hover:border-[#EA4C89] transition-all">
            <div>
              <p className="text-sm font-bold text-[var(--ink)]">Top-Up 100 Kredit</p>
              <p className="text-xs text-[var(--db-gray)] mt-0.5">Hemat 20% dibanding eceran</p>
              <p className="text-lg font-black text-[#F59E0B] mt-2">{formatRupiah(79000)}</p>
            </div>
            <button
              onClick={() => handleBuyPlan('TOPUP_100')}
              disabled={checkoutLoading === 'TOPUP_100'}
              className="bg-[#EA4C89] hover:bg-[#C32361] text-white font-bold px-4 py-2.5 rounded-full text-xs transition-all disabled:opacity-50"
            >
              {checkoutLoading === 'TOPUP_100' ? '...' : 'Beli Top-Up'}
            </button>
          </div>
        </div>
      </div>

      {/* Transaction History Table */}
      <div className="space-y-4 pt-6 border-t border-[var(--db-line)]">
        <h2 className="text-lg font-bold text-[var(--ink)]">Riwayat Transaksi</h2>

        {transactions.length === 0 ? (
          <div className="text-center py-10 rounded-2xl glass-card border border-[var(--db-line)] text-[var(--db-gray)] text-xs">
            Belum ada riwayat transaksi.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--db-line)] glass-card bg-[var(--db-panel)]">
            <table className="w-full text-left text-xs text-[var(--ink)]">
              <thead className="bg-[var(--db-cream)] text-[var(--db-gray)] uppercase text-[10px] tracking-wider border-b border-[var(--db-line)]">
                <tr>
                  <th className="p-4">Order ID</th>
                  <th className="p-4">Paket</th>
                  <th className="p-4">Jumlah</th>
                  <th className="p-4">Kredit</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Tanggal</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--db-line)]">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-[var(--db-cream)] transition-colors">
                    <td className="p-4 font-mono font-bold text-[var(--ink)]">{tx.orderId}</td>
                    <td className="p-4 font-semibold text-[var(--ink)]">{tx.plan}</td>
                    <td className="p-4 font-bold text-[#EA4C89]">{formatRupiah(tx.amount)}</td>
                    <td className="p-4">+{tx.creditsAdded} Kredit</td>
                    <td className="p-4">{getStatusBadge(tx.status)}</td>
                    <td className="p-4 text-[var(--db-gray)]">{new Date(tx.createdAt).toLocaleDateString('id-ID')}</td>
                    <td className="p-4 text-right">
                      {tx.status === 'PENDING' && (
                        <div className="flex items-center justify-end gap-2">
                          {tx.snapUrl && (
                            <a
                              href={tx.snapUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 bg-[#EA4C89] hover:bg-[#C32361] text-white rounded-lg text-[11px] font-bold transition-all"
                            >
                              Bayar Sekarang
                            </a>
                          )}
                        </div>
                      )}
                    </td>
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
