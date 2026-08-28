'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2, Scissors, Sparkles, Zap } from 'lucide-react';
import { setAuthSession } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';
import { ClipForgeLogo } from '@/components/clipforge/Logo';

const displayFont = { fontFamily: "'Unbounded', system-ui, sans-serif" } as React.CSSProperties;

const EQ_BARS = [38, 62, 45, 80, 55, 92, 48, 70, 40, 85, 58, 76, 44, 66, 52];

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'google' | 'email'>('google');
  const [emailMode, setEmailMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';

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
    <div className="relative min-h-screen overflow-hidden bg-[#04070E] text-white selection:bg-cyan-400 selection:text-black">
      <style>{`
        @keyframes lf-story { 0% { width: 4%; } 70% { width: 100%; } 100% { width: 100%; } }
        @keyframes lf-pop {
          0% { opacity: 0; transform: translateY(10px) scale(0.8); }
          6% { opacity: 1; transform: translateY(0) scale(1); }
          28% { opacity: 1; transform: translateY(0) scale(1); }
          34% { opacity: 0; transform: translateY(-8px) scale(0.95); }
          100% { opacity: 0; }
        }
        @keyframes lf-eq { 0%, 100% { transform: scaleY(0.3); } 50% { transform: scaleY(1); } }
        @keyframes lf-play { 0% { left: 3%; } 100% { left: 97%; } }
        @keyframes lf-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
        @keyframes lf-marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        @keyframes lf-scan { 0% { top: -20%; opacity: 0; } 15% { opacity: 1; } 85% { opacity: 1; } 100% { top: 110%; opacity: 0; } }
        @keyframes lf-glow { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.9; } }
      `}</style>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Unbounded:wght@500;700;800;900&display=swap" />

      {/* Atmosfer background */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 right-[-10%] h-[34rem] w-[34rem] rounded-full bg-cyan-500/10 blur-[120px]" style={{ animation: 'lf-glow 7s ease-in-out infinite' }}></div>
        <div className="absolute bottom-[-20%] left-[-10%] h-[30rem] w-[30rem] rounded-full bg-blue-700/10 blur-[130px]" style={{ animation: 'lf-glow 9s ease-in-out infinite 1.5s' }}></div>
        <div className="absolute inset-0 opacity-[0.06]" style={{ backgroundImage: 'linear-gradient(rgba(103,232,249,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(103,232,249,0.5) 1px, transparent 1px)', backgroundSize: '44px 44px' }}></div>
        <div className="absolute inset-0 opacity-[0.035]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")" }}></div>
      </div>

      {/* Marquee platform */}
      <div aria-hidden className="pointer-events-none absolute bottom-10 left-[-5%] right-[-5%] -rotate-2 overflow-hidden border-y border-cyan-400/10 bg-cyan-400/[0.03] py-2 force-motion">
        <div className="flex w-max whitespace-nowrap text-[11px] font-bold tracking-[0.3em] text-cyan-200/30" style={{ animation: 'lf-marquee 28s linear infinite' }}>
          {[0, 1].map((n) => (
            <span key={n} className="flex shrink-0">
              {['TIKTOK', 'REELS', 'SHORTS', 'SUBTITLE KARAOKE', 'AI CROP 9:16', 'FACE TRACKING', 'HOOK GENERATOR', 'SFX OTOMATIS'].map((w) => (
                <span key={w} className="mx-6 flex items-center gap-6">
                  {w} <Scissors className="h-3 w-3" />
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/home" className="flex items-center gap-3 group">
          <ClipForgeLogo />
        </Link>
        <Link href="/home" className="text-xs font-semibold text-gray-400 transition-colors hover:text-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400">
          ← Kembali ke Beranda
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-6 pb-24 pt-4">
        <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* KIRI: Hero + mockup produk */}
          <div className="space-y-8 lg:col-span-7 lg:pr-8">
            <div className="inline-flex items-center gap-2.5 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-300">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-60"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400"></span>
              </span>
              AI Video Clipper No.1 di Indonesia
            </div>

            <h1 className="text-4xl font-black leading-[1.12] tracking-tight sm:text-5xl xl:text-[3.4rem]" style={displayFont}>
              Satu link YouTube.
              <br />
              <span className="bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 bg-clip-text text-transparent">
                Tiga klip viral.
              </span>
            </h1>

            <p className="max-w-xl text-sm font-medium leading-relaxed text-gray-300 sm:text-base">
              Tempel link, AI yang memotong. Klip pertama jadi dalam 5 menit — lengkap subtitle karaoke, crop 9:16, dan hook yang bikin orang berhenti scroll.
            </p>

            {/* Mockup produk animasi */}
            <div className="force-motion relative flex flex-wrap items-end gap-6 pt-2">
              <div className="absolute -inset-6 rounded-full bg-cyan-500/10 blur-3xl" aria-hidden></div>

              {/* Phone 9:16 */}
              <div className="relative w-[200px] shrink-0 sm:w-[225px]">
                <div className="relative aspect-[9/16] overflow-hidden rounded-[1.8rem] border border-white/15 bg-black shadow-[0_25px_70px_rgba(0,0,0,0.7),0_0_45px_rgba(34,211,238,0.12)]">
                  {/* "footage" */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/40 via-slate-800 to-cyan-900/50"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(34,211,238,0.35),transparent_55%)]"></div>
                  <div className="absolute left-0 right-0 h-10 bg-gradient-to-b from-transparent via-cyan-300/20 to-transparent" style={{ animation: 'lf-scan 3.2s ease-in-out infinite' }}></div>

                  {/* story progress */}
                  <div className="absolute left-3 right-3 top-3 flex gap-1.5">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/20"><div className="h-full rounded-full bg-white" style={{ animation: 'lf-story 4.5s ease-in-out infinite' }}></div></div>
                    <div className="h-1 flex-1 rounded-full bg-white/20"></div>
                    <div className="h-1 flex-1 rounded-full bg-white/20"></div>
                  </div>

                  {/* caption karaoke */}
                  <div className="absolute inset-x-3 bottom-14 text-center" style={displayFont}>
                    <div className="mx-auto w-max rounded-md bg-black/70 px-2.5 py-1 text-[13px] font-extrabold uppercase text-white shadow-lg" style={{ animation: 'lf-pop 7.5s ease-in-out infinite' }}>POV:</div>
                    <div className="mx-auto mt-1.5 w-max rounded-md bg-cyan-400 px-2.5 py-1 text-[13px] font-extrabold uppercase text-black shadow-lg" style={{ animation: 'lf-pop 7.5s ease-in-out infinite 2.5s' }}>DIAM-DIAM</div>
                    <div className="mx-auto mt-1.5 w-max rounded-md bg-black/70 px-2.5 py-1 text-[13px] font-extrabold uppercase text-white shadow-lg" style={{ animation: 'lf-pop 7.5s ease-in-out infinite 5s' }}>KAMU DIPIGILIN!</div>
                  </div>

                  {/* equalizer */}
                  <div className="absolute inset-x-4 bottom-5 flex h-6 items-end justify-between gap-[3px]">
                    {EQ_BARS.map((h, i) => (
                      <span key={i} className="w-full origin-bottom rounded-sm bg-gradient-to-t from-cyan-500 to-blue-400" style={{ height: `${h}%`, animation: `lf-eq 1.1s ease-in-out infinite ${i * 0.09}s` }}></span>
                    ))}
                  </div>
                </div>

                {/* chip melayang */}
                <div className="absolute -right-4 top-10 flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-[#0A1220]/90 px-3 py-1.5 text-[11px] font-black text-cyan-300 shadow-xl backdrop-blur" style={{ animation: 'lf-bob 3.4s ease-in-out infinite' }}>
                  <Sparkles className="h-3.5 w-3.5" /> Score 92
                </div>
                <div className="absolute -left-5 bottom-16 flex items-center gap-1.5 rounded-xl border border-white/10 bg-[#0A1220]/90 px-3 py-1.5 text-[11px] font-black text-white shadow-xl backdrop-blur" style={{ animation: 'lf-bob 3.9s ease-in-out infinite 0.6s' }}>
                  <Zap className="h-3.5 w-3.5 text-yellow-400" /> +12 rb views
                </div>
              </div>

              {/* Timeline editing */}
              <div className="hidden min-w-[240px] flex-1 space-y-3 pb-5 md:block" aria-hidden>
                <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                  <Scissors className="h-3.5 w-3.5 text-cyan-400" /> Timeline dipilih AI
                </div>
                <div className="relative rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
                  <div className="flex gap-1.5">
                    <div className="h-9 w-[42%] rounded-md bg-gradient-to-br from-cyan-500/50 to-blue-600/40 ring-1 ring-cyan-400/40"></div>
                    <div className="h-9 w-[26%] rounded-md bg-gradient-to-br from-blue-500/30 to-indigo-600/30"></div>
                    <div className="h-9 flex-1 rounded-md bg-gradient-to-br from-sky-500/30 to-cyan-700/30"></div>
                  </div>
                  <div className="absolute -top-1 bottom-0 w-0.5 rounded bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.9)]" style={{ animation: 'lf-play 6s linear infinite' }}></div>
                </div>
                <div className="flex gap-1.5 text-[10px] font-bold text-gray-400">
                  <span className="rounded bg-cyan-400/10 px-2 py-0.5 text-cyan-300">AI PICK 1</span>
                  <span className="rounded bg-white/5 px-2 py-0.5">HOOK 0-4s</span>
                  <span className="rounded bg-white/5 px-2 py-0.5">SFX OTOMATIS</span>
                </div>
              </div>
            </div>

            <div className="grid max-w-xl gap-3 pt-2 sm:grid-cols-3">
              {[
                { t: 'AI pilih momen', d: '3 momen terbaik otomatis' },
                { t: 'Subtitle karaoke', d: 'Bahasa Indonesia, auto-sync' },
                { t: 'Bayar per kredit', d: 'QRIS & transfer, tanpa langganan' },
              ].map((f) => (
                <div key={f.t} className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
                  <p className="flex items-center gap-1.5 text-xs font-black text-white"><CheckCircle2 className="h-3.5 w-3.5 text-cyan-400" />{f.t}</p>
                  <p className="mt-1 text-[11px] leading-snug text-gray-400">{f.d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* KANAN: Kartu auth */}
          <div className="lg:col-span-5">
            <div className="relative space-y-6 overflow-hidden rounded-3xl border border-white/10 bg-[#0A101C]/90 p-6 shadow-[0_0_60px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-8">
              <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent"></div>
              <div className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-cyan-500/10 blur-3xl" aria-hidden></div>

              {error && (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/5 p-1" role="tablist" aria-label="Metode masuk">
                <button type="button" role="tab" aria-selected={authMode === 'google'} onClick={() => setAuthMode('google')} className={`rounded-lg py-2 text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 ${authMode === 'google' ? 'bg-cyan-400/15 text-cyan-300' : 'text-gray-400 hover:text-white'}`}>Google</button>
                <button type="button" role="tab" aria-selected={authMode === 'email'} onClick={() => setAuthMode('email')} className={`rounded-lg py-2 text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400 ${authMode === 'email' ? 'bg-cyan-400/15 text-cyan-300' : 'text-gray-400 hover:text-white'}`}>Email</button>
              </div>

              {authMode === 'google' && (
              <>
              <div className="space-y-1">
                <h2 className="text-xl font-black text-white">Lanjutkan dengan Google</h2>
                <p className="text-xs text-gray-400">
                  Masuk cepat dengan Google. Klip pertama gratis (1 kredit), gak perlu setor duit di depan.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleButtonClick}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm font-extrabold text-black shadow-xl transition-all hover:scale-[1.02] hover:bg-gray-100 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
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

              <p className="text-center text-[11px] text-gray-500">
                Aman & terverifikasi Google OAuth 2.0. Kami hanya akses nama, email & foto profil.
              </p>
              </>
              )}

              {authMode === 'email' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-xl font-black text-white">{emailMode === 'login' ? 'Masuk dengan Email' : 'Daftar dengan Email'}</h2>
                  <p className="text-xs text-gray-400">
                    {emailMode === 'login' ? 'Masuk ke akun ClipForge Anda.' : 'Daftar gratis, dapatkan 5 kredit untuk 5 proyek.'}
                  </p>
                </div>

                {emailMode === 'register' && (
                  <div className="space-y-1.5">
                    <label htmlFor="lf-name" className="text-[11px] font-black uppercase tracking-wider text-gray-400">Nama</label>
                    <input
                      id="lf-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama (opsional)"
                      className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="lf-email" className="text-[11px] font-black uppercase tracking-wider text-gray-400">Email</label>
                  <input
                    id="lf-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="lf-password" className="text-[11px] font-black uppercase tracking-wider text-gray-400">Password</label>
                  <input
                    id="lf-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
                    placeholder="Min. 8 karakter"
                    className="w-full rounded-xl border border-white/10 bg-black/50 px-4 py-3 text-sm text-white placeholder-gray-500 transition-colors focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleEmailAuth}
                  disabled={loading}
                  className="w-full rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 py-3.5 px-4 text-sm font-extrabold text-black shadow-[0_10px_30px_rgba(34,211,238,0.25)] transition-all hover:from-cyan-300 hover:to-blue-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : emailMode === 'login' ? 'Masuk' : 'Daftar & Dapatkan 5 Kredit'}
                </button>

                <button
                  type="button"
                  onClick={() => { setEmailMode(emailMode === 'login' ? 'register' : 'login'); setError(null); }}
                  className="w-full text-center text-xs text-cyan-400 transition-colors hover:text-cyan-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400"
                >
                  {emailMode === 'login' ? 'Belum punya akun? Daftar di sini' : 'Sudah punya akun? Masuk di sini'}
                </button>
              </div>
              )}

              <div className="space-y-3 border-t border-white/10 pt-4">
                <p className="text-[11px] font-black uppercase tracking-wider text-gray-400">YANG AKAN TERJADI</p>

                <div className="space-y-3">
                  {[
                    'Buat akun (atau masuk) dengan Google, tanpa password.',
                    'Tempel link YouTube di dashboard, AI memilih 3 momen viral.',
                    'Download klip 9:16 + subtitle karaoke, langsung upload ke TikTok / Reels / Shorts.',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-400/15 text-xs font-black text-cyan-300">{i + 1}</span>
                      <p className="text-xs leading-snug text-gray-300">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="pt-2 text-center text-[10px] leading-normal text-gray-500">
                Dengan masuk, kamu setuju dengan{' '}
                <Link href="#" className="text-gray-400 underline">
                  Syarat Layanan
                </Link>{' '}
                dan{' '}
                <Link href="#" className="text-gray-400 underline">
                  Kebijakan Privasi
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between border-t border-white/5 px-6 py-4 text-[11px] text-gray-500">
        <p>© 2026 ClipForge AI · All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="#" className="transition-colors hover:text-gray-400">
            Privasi
          </Link>
          <Link href="#" className="transition-colors hover:text-gray-400">
            Syarat
          </Link>
          <Link href="#" className="transition-colors hover:text-gray-400">
            Kontak
          </Link>
        </div>
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center space-y-4 bg-[#04070E] p-6 text-white">
          <Loader2 className="h-10 w-10 animate-spin text-cyan-400" />
          <p className="text-sm font-semibold text-gray-300">Memuat...</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
