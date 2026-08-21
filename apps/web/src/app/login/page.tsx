'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { setAuthSession } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const executeGoogleAuthWithToken = async (idToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal masuk dengan Akun Google');
      }

      setAuthSession(data.token, data.user);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal masuk dengan Google';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    // Load Google Identity Services SDK
    if (typeof window !== 'undefined' && !document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        try {
          const w = window as unknown as { google?: { accounts?: { id?: { initialize: (opts: unknown) => void } } } };
          if (w.google?.accounts?.id) {
            w.google.accounts.id.initialize({
              client_id: GOOGLE_CLIENT_ID,
              callback: (response: unknown) => {
                const cred = (response as { credential?: string })?.credential;
                if (cred) {
                  executeGoogleAuthWithToken(cred);
                }
              },
            } as unknown);
          }
        } catch (_e) { /* ignore */ }
      };
      document.body.appendChild(script);
    }
  }, [GOOGLE_CLIENT_ID, executeGoogleAuthWithToken]);



  const handleGoogleButtonClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google/url');
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
      }
    } catch (_e) { /* ignore */ }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError('Google Client ID belum dikonfigurasi. Hubungi admin.');
      setLoading(false);
      return;
    }
    const redirectUri = `${window.location.origin}/api/auth/callback/google`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&prompt=select_account`;

    window.location.href = googleAuthUrl;
  };

  return (
    <div className="min-h-screen bg-[#060609] text-white flex flex-col justify-between selection:bg-cyan-500 selection:text-black">
      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-20">
        <Link href="/home" className="flex items-center gap-3 group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="ClipForge AI" className="h-10 object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.4)] group-hover:scale-105 transition-transform" />
          <span className="font-extrabold text-xl tracking-tight text-white">KlipAja<span className="text-cyan-400">.id</span></span>
        </Link>
        <Link href="/home" className="text-xs font-semibold text-gray-400 hover:text-white transition-colors">
          ← Kembali ke Beranda
        </Link>
      </header>

      {/* Main Container */}
      <main className="w-full max-w-6xl mx-auto px-6 py-8 flex-1 flex items-center">
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Hero Branding */}
          <div className="lg:col-span-7 space-y-8 pr-0 lg:pr-6">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
              <span>AI Video Clipper No.1 di Indonesia</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-[1.15]">
              Masuk dan <br />
              <span className="bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-500 bg-clip-text text-transparent underline decoration-yellow-500/40">
                mulai bikin klip viral.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-gray-300 leading-relaxed font-medium">
              Daftar dengan Google sekali, terus tempel link YouTube. Klip pertama jadi dalam 5 menit, tanpa skill editing.
            </p>

            {/* Feature Bullet Points */}
            <div className="space-y-4 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white">Tempel link YouTube, AI urus sisanya</p>
                  <p className="text-xs text-gray-400">AI memilih 3 momen terbaik, crop 9:16, tambah subtitle karaoke bahasa Indonesia, lock face tracking. Rata-rata 5 menit per video.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white">Pembayaran lokal, tanpa subscription</p>
                  <p className="text-xs text-gray-400">QRIS, transfer bank (BCA/Mandiri/BRI/BNI), GoPay, OVO, DANA, ShopeePay. Beli kredit sekali, pakai kapan saja.</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-white">Tanpa langganan bulanan</p>
                  <p className="text-xs text-gray-400">Kredit prabayar dalam Rupiah. Beli sekali, pakai kapan saja. Tidak ada auto-debit.</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Google Auth Card */}
          <div className="lg:col-span-5">
            <div className="bg-[#12121a]/90 backdrop-blur-xl border border-white/10 rounded-3xl p-6 sm:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] space-y-6 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500"></div>

              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <h2 className="text-xl font-black text-white">Lanjutkan dengan Google</h2>
                <p className="text-xs text-gray-400">
                  Masuk cepat dengan Google. Klip pertama gratis (1 kredit), gak perlu setor duit di depan.
                </p>
              </div>

              {/* Big Google Button */}
              <button
                type="button"
                onClick={handleGoogleButtonClick}
                disabled={loading}
                className="w-full bg-white hover:bg-gray-100 text-black font-extrabold py-3.5 px-4 rounded-2xl text-sm transition-all flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-[0.98] border border-gray-200 disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>Lanjutkan dengan Google</span>
              </button>

              {/* What Will Happen Checklist */}
              <div className="pt-4 border-t border-white/10 space-y-3">
                <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">YANG AKAN TERJADI</p>

                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">1</span>
                    <p className="text-xs text-gray-300 leading-snug">Buat akun (atau masuk) dengan Google, tanpa password.</p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">2</span>
                    <p className="text-xs text-gray-300 leading-snug">Tempel link YouTube di dashboard, AI memilih 3 momen viral.</p>
                  </div>

                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 rounded-full bg-amber-400/20 text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">3</span>
                    <p className="text-xs text-gray-300 leading-snug">Download klip 9:16 + subtitle karaoke, langsung upload ke TikTok / Reels / Shorts.</p>
                  </div>
                </div>
              </div>

              {/* Terms disclaimer */}
              <p className="text-[10px] text-gray-500 text-center leading-normal pt-2">
                Dengan masuk, kamu setuju dengan <Link href="#" className="underline text-gray-400">Syarat Layanan</Link> dan <Link href="#" className="underline text-gray-400">Kebijakan Privasi</Link>.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-4 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-500">
        <p>© 2026 KlipAja.id — All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="#" className="hover:text-gray-400">Privasi</Link>
          <Link href="#" className="hover:text-gray-400">Syarat</Link>
          <Link href="#" className="hover:text-gray-400">Kontak</Link>
        </div>
      </footer>
    </div>
  );
}
