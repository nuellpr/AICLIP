'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, Loader2 } from 'lucide-react';
import { motion, useMotionValue, useSpring, type MotionValue } from 'framer-motion';
import { setAuthSession } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';
import { ClipForgeLogo } from '@/components/clipforge/Logo';

const displayFont = { fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif' } as React.CSSProperties;

function MascotEye({ x, y, blinkDelay }: { x: MotionValue<number>; y: MotionValue<number>; blinkDelay: number }) {
  return (
    <motion.div
      className="relative h-11 w-11 overflow-hidden rounded-full bg-[var(--db-panel)] sm:h-14 sm:w-14"
      animate={{ scaleY: [1, 0.1, 1] }}
      transition={{ duration: 0.15, repeat: Infinity, repeatDelay: 3.5, delay: blinkDelay, ease: 'easeInOut' }}
    >
      <motion.div
        className="absolute left-1/2 top-1/2 -ml-2 -mt-2 h-4 w-4 rounded-full bg-[#0D0C22] sm:-ml-2.5 sm:-mt-2.5 sm:h-5 sm:w-5"
        style={{ x, y }}
      />
    </motion.div>
  );
}

function Mascot({ x, y }: { x: MotionValue<number>; y: MotionValue<number> }) {
  return (
    <motion.div
      className="relative flex flex-col items-center"
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
    >
      {/* antena */}
      <div className="flex flex-col items-center">
        <motion.span
          className="h-3.5 w-3.5 rounded-full bg-[#EA4C89] shadow-[0_0_16px_rgba(234,76,137,0.8)]"
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span className="h-5 w-0.5 bg-[var(--db-panel)]/20" />
      </div>

      {/* kepala */}
      <div className="relative rounded-[1.75rem] border border-white/10 bg-[#1A1929] px-8 pb-7 pt-8 shadow-[0_30px_80px_rgba(0,0,0,0.5)] sm:px-12">
        <div className="flex items-center justify-center gap-4 sm:gap-5">
          <MascotEye x={x} y={y} blinkDelay={0} />
          <MascotEye x={x} y={y} blinkDelay={0.4} />
        </div>
        {/* mulut: 3 titik LED */}
        <div className="mt-5 flex items-center justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-[#EA4C89]"
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.3, ease: 'easeInOut' }}
            />
          ))}
        </div>
      </div>

      {/* badge play di dada */}
      <div className="absolute -bottom-5 left-1/2 grid h-10 w-10 -translate-x-1/2 place-items-center rounded-xl bg-[#EA4C89] shadow-[0_10px_30px_rgba(234,76,137,0.45)]">
        <svg viewBox="0 0 12 12" className="h-4 w-4 text-white" fill="currentColor" aria-hidden>
          <path d="M4 2.5v7l6-3.5z" />
        </svg>
      </div>
    </motion.div>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [emailMode, setEmailMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

  // Eye tracking: pupil mengikuti kursor (max ~5px), spring untuk gerak halus
  const pupilX = useMotionValue(0);
  const pupilY = useMotionValue(0);
  const springX = useSpring(pupilX, { stiffness: 150, damping: 15 });
  const springY = useSpring(pupilY, { stiffness: 150, damping: 15 });

  const handleEyeMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    pupilX.set(Math.max(-5, Math.min(5, dx / 40)));
    pupilY.set(Math.max(-5, Math.min(5, dy / 40)));
  };

  // If already authenticated, skip login
  useEffect(() => {
    const token = localStorage.getItem('clipforge_token');
    const user = localStorage.getItem('clipforge_user');
    if (token && user) {
      router.replace('/dashboard');
    }
  }, [router]);

  // Show error from OAuth callback redirect (?error=...)
  useEffect(() => {
    const err = searchParams.get('error');
    if (err) {
      setError(decodeURIComponent(err));
    }
  }, [searchParams]);

  const executeGoogleAuthWithToken = async (idToken: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl('/api/auth/google'), {
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

  // Optional: GIS One Tap - only initialize if client ID present
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID) return;
    if (typeof window === 'undefined') return;
    if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      try {
        const w = window as unknown as { google?: { accounts?: { id?: { initialize: (opts: unknown) => void; prompt: () => void } } } };
        if (w.google?.accounts?.id) {
          w.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response: unknown) => {
              const cred = (response as { credential?: string })?.credential;
              if (cred) {
                executeGoogleAuthWithToken(cred);
              }
            },
            auto_select: false,
            cancel_on_tap_outside: false,
          } as unknown);
          // w.google.accounts.id.prompt();
        }
      } catch (_e) {
        /* ignore */
      }
    };
    script.onerror = () => {
      console.warn('Failed to load Google GSI script');
    };
    document.body.appendChild(script);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [GOOGLE_CLIENT_ID]);

  const handleGoogleButtonClick = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl('/api/auth/google/url'));
      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
          return;
        }
        if (data.error) {
          throw new Error(data.error);
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Gagal mendapatkan URL Google OAuth (${res.status})`);
      }
    } catch (e: unknown) {
      console.warn('Falling back to client-side redirect', e);
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      if (!clientId) {
        setError(e instanceof Error ? e.message : 'Google Client ID belum dikonfigurasi. Hubungi admin. Set NEXT_PUBLIC_GOOGLE_CLIENT_ID di .env');
        setLoading(false);
        return;
      }
      const redirectUri = `${window.location.origin}/api/auth/callback/google`;
      const googleAuthUrl =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=code` +
        `&scope=${encodeURIComponent('openid email profile')}` +
        `&prompt=select_account` +
        `&access_type=offline` +
        `&include_granted_scopes=true`;
      window.location.href = googleAuthUrl;
      return;
    }
    setLoading(false);
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      setError('Email dan password wajib diisi');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(getApiUrl(emailMode === 'login' ? '/api/auth/login' : '/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, ...(emailMode === 'register' && name ? { name } : {}) }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal masuk');
      }

      setAuthSession(data.token, data.user);
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Gagal masuk';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[var(--db-panel)] text-[var(--ink)] selection:bg-[#EA4C89] selection:text-white">
      <header className="mx-auto flex w-full max-w-7xl items-center justify-end px-6 py-5">
        <Link href="/home" className="text-xs font-semibold text-[var(--db-gray)] transition-colors hover:text-[#EA4C89]">
          ← Kembali ke Beranda
        </Link>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6">
        <div className="grid grid-cols-1 items-stretch gap-6 lg:grid-cols-12 lg:gap-8">
          {/* KIRI: panel hitam + maskot */}
          <section
            onMouseMove={handleEyeMove}
            className="relative flex flex-col overflow-hidden rounded-3xl bg-[#0D0C22] px-6 py-10 sm:px-10 lg:col-span-7 lg:px-14 lg:py-12"
          >
            {/* glow radial pink */}
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#EA4C89]/20 blur-[100px]"
            ></div>

            <h1
              className="relative text-center text-3xl font-black leading-tight tracking-tight text-white sm:text-4xl xl:text-[2.75rem]"
              style={displayFont}
            >
              Satu link YouTube.
              <br />
              <span className="text-[#EA4C89]">Tiga klip viral.</span>
            </h1>

            <div className="relative flex flex-1 items-center justify-center py-14">
              <Mascot x={springX} y={springY} />
            </div>

            <div className="relative flex flex-col items-center gap-6">
              <ClipForgeLogo light />
              <div className="hidden flex-wrap justify-center gap-2 md:flex">
                {[
                  'AI pilih 3 momen terbaik otomatis',
                  'Subtitle karaoke auto-sync',
                  'Bayar per kredit — QRIS & transfer',
                ].map((f) => (
                  <span key={f} className="rounded-full bg-[var(--db-panel)]/10 px-3.5 py-1.5 text-[11px] font-bold text-white">
                    {f}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {/* KANAN: form terpusat */}
          <div className="flex items-center justify-center lg:col-span-5">
            <div className="w-full max-w-sm py-12">
              <div className="flex justify-center">
                <ClipForgeLogo compact />
              </div>

              <div className="mt-6 text-center">
                <h2 className="text-3xl font-black tracking-tight text-[var(--ink)]" style={displayFont}>
                  {emailMode === 'login' ? 'Selamat datang kembali!' : 'Buat akun gratis'}
                </h2>
                <p className="mt-2 text-sm text-[var(--db-gray)]">
                  {emailMode === 'login'
                    ? 'Masuk untuk lanjut bikin klip viral kamu.'
                    : 'Daftar gratis, dapatkan 5 kredit untuk 5 proyek.'}
                </p>
              </div>

              {error && (
                <div className="mt-6 flex items-start gap-2 rounded-xl bg-[#FDE3E1] p-3 text-xs text-[#B42318]" role="alert">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              <div className="mt-6 space-y-4">
                {emailMode === 'register' && (
                  <div className="space-y-1.5">
                    <label htmlFor="lf-name" className="text-xs font-semibold text-[var(--ink)]">Nama</label>
                    <input
                      id="lf-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama (opsional)"
                      className="w-full rounded-xl border border-[var(--db-line)] bg-[var(--db-panel)] px-4 py-3 text-sm text-[var(--ink)] placeholder-[#9B99AF] transition-colors focus:border-[#EA4C89] focus:outline-none focus:ring-2 focus:ring-[#EA4C89]/20"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="lf-email" className="text-xs font-semibold text-[var(--ink)]">Email</label>
                  <input
                    id="lf-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full rounded-xl border border-[var(--db-line)] bg-[var(--db-panel)] px-4 py-3 text-sm text-[var(--ink)] placeholder-[#9B99AF] transition-colors focus:border-[#EA4C89] focus:outline-none focus:ring-2 focus:ring-[#EA4C89]/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="lf-password" className="text-xs font-semibold text-[var(--ink)]">Password</label>
                  <input
                    id="lf-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
                    placeholder="Min. 8 karakter"
                    className="w-full rounded-xl border border-[var(--db-line)] bg-[var(--db-panel)] px-4 py-3 text-sm text-[var(--ink)] placeholder-[#9B99AF] transition-colors focus:border-[#EA4C89] focus:outline-none focus:ring-2 focus:ring-[#EA4C89]/20"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleEmailAuth}
                  disabled={loading}
                  className="w-full rounded-full bg-[#0D0C22] px-4 py-3.5 text-sm font-extrabold text-white transition-colors hover:bg-[#EA4C89] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : emailMode === 'login' ? 'Masuk' : 'Daftar & Dapatkan 5 Kredit'}
                </button>
              </div>

              <div className="my-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-[var(--db-line)]"></span>
                <span className="text-xs font-semibold text-[var(--db-gray)]">atau</span>
                <span className="h-px flex-1 bg-[var(--db-line)]"></span>
              </div>

              <button
                type="button"
                onClick={handleGoogleButtonClick}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-[var(--db-line)] bg-[var(--db-panel)] px-4 py-3.5 text-sm font-extrabold text-[var(--ink)] transition-all hover:shadow-[0_10px_30px_rgba(13,12,34,0.12)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>{loading ? 'Menghubungkan...' : 'Lanjutkan dengan Google'}</span>
              </button>

              <button
                type="button"
                onClick={() => { setEmailMode(emailMode === 'login' ? 'register' : 'login'); setError(null); }}
                className="mt-6 w-full text-center text-xs font-semibold text-[#EA4C89] transition-colors hover:text-[#C32361]"
              >
                {emailMode === 'login' ? 'Belum punya akun? Daftar di sini' : 'Sudah punya akun? Masuk di sini'}
              </button>

              <p className="mt-6 text-center text-[10px] leading-normal text-[var(--db-gray)]">
                Dengan masuk, kamu setuju dengan{' '}
                <Link href="#" className="text-[var(--ink)] underline">
                  Syarat Layanan
                </Link>{' '}
                dan{' '}
                <Link href="#" className="text-[var(--ink)] underline">
                  Kebijakan Privasi
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center space-y-4 bg-[var(--db-panel)] p-6 text-[var(--ink)]">
          <Loader2 className="h-10 w-10 animate-spin text-[#EA4C89]" />
          <p className="text-sm font-semibold text-[var(--db-gray)]">Memuat...</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
