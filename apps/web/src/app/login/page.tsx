'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle2, AlertCircle, Loader2, Sparkles, Zap } from 'lucide-react';
import { setAuthSession } from '@/lib/auth';
import { getApiUrl } from '@/lib/api';
import { ClipForgeLogo } from '@/components/clipforge/Logo';

const displayFont = { fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif' } as React.CSSProperties;

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
    <div className="relative min-h-screen overflow-hidden bg-white text-[#0D0C22] selection:bg-[#EA4C89] selection:text-white">
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
        @keyframes lf-bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      `}</style>

      {/* Blob pastel dekoratif */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 right-[-8%] h-[28rem] w-[28rem] rounded-full bg-[#E7E4F9] opacity-60 blur-[100px]"></div>
        <div className="absolute bottom-[-15%] left-[-8%] h-[26rem] w-[26rem] rounded-full bg-[#DBF3E8] opacity-60 blur-[110px]"></div>
        <div className="absolute left-1/3 top-1/2 h-[20rem] w-[20rem] rounded-full bg-[#FDF3D8] opacity-50 blur-[110px]"></div>
      </div>

      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/home" className="flex items-center gap-3 group">
          <ClipForgeLogo />
        </Link>
        <Link href="/home" className="text-xs font-semibold text-[#6E6D7A] transition-colors hover:text-[#EA4C89]">
          ← Kembali ke Beranda
        </Link>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-1 items-center px-6 pb-16 pt-4">
        <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-10">
          {/* KIRI: Branding (di bawah pada mobile) */}
          <div className="order-2 space-y-8 lg:order-1 lg:col-span-7 lg:pr-8">
            <div className="inline-flex items-center gap-2.5 rounded-full bg-[#F8F7F4] px-4 py-1.5 text-[11px] font-black uppercase tracking-[0.18em] text-[#0D0C22]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#EA4C89] opacity-60"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#EA4C89]"></span>
              </span>
              AI Video Clipper No.1 di Indonesia
            </div>

            <h1 className="text-4xl font-black leading-[1.1] tracking-tight text-[#0D0C22] sm:text-5xl xl:text-[3.6rem]" style={displayFont}>
              Satu link YouTube.
              <br />
              <span className="text-[#EA4C89]">Tiga klip viral.</span>
            </h1>

            <p className="max-w-xl text-sm font-medium leading-relaxed text-[#6E6D7A] sm:text-base">
              Tempel link, AI yang memotong. Klip pertama jadi dalam 5 menit — lengkap subtitle karaoke, crop 9:16, dan hook yang bikin orang berhenti scroll.
            </p>

            {/* Checklist fitur */}
            <ul className="space-y-3">
              {[
                'AI pilih 3 momen terbaik otomatis',
                'Subtitle karaoke Bahasa Indonesia, auto-sync',
                'Bayar per kredit — QRIS & transfer, tanpa langganan',
              ].map((f) => (
                <li key={f} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#EA4C89]">
                    <svg viewBox="0 0 12 12" className="h-3 w-3 text-white" fill="none" aria-hidden>
                      <path d="M2.5 6.5 5 9l4.5-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <span className="text-sm font-semibold text-[#0D0C22]">{f}</span>
                </li>
              ))}
            </ul>

            {/* Mockup produk animasi (light) */}
            <div className="force-motion relative hidden items-end gap-6 pt-2 sm:flex">
              {/* Phone 9:16 */}
              <div className="relative w-[200px] shrink-0 sm:w-[225px]">
                <div className="relative aspect-[9/16] overflow-hidden rounded-[1.8rem] border border-[#0D0C22]/10 bg-white shadow-[0_30px_70px_rgba(13,12,34,0.18)]">
                  {/* "footage" pastel */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#E7E4F9] via-[#F8F7F4] to-[#FDE3E1]"></div>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_25%,rgba(234,76,137,0.18),transparent_55%)]"></div>

                  {/* story progress */}
                  <div className="absolute left-3 right-3 top-3 flex gap-1.5">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-[#0D0C22]/10"><div className="h-full rounded-full bg-[#EA4C89]" style={{ animation: 'lf-story 4.5s ease-in-out infinite' }}></div></div>
                    <div className="h-1 flex-1 rounded-full bg-[#0D0C22]/10"></div>
                    <div className="h-1 flex-1 rounded-full bg-[#0D0C22]/10"></div>
                  </div>

                  {/* caption karaoke */}
                  <div className="absolute inset-x-3 bottom-14 text-center" style={displayFont}>
                    <div className="mx-auto w-max rounded-md bg-[#0D0C22] px-2.5 py-1 text-[13px] font-extrabold uppercase text-white shadow-lg" style={{ animation: 'lf-pop 7.5s ease-in-out infinite' }}>POV:</div>
                    <div className="mx-auto mt-1.5 w-max rounded-md bg-[#EA4C89] px-2.5 py-1 text-[13px] font-extrabold uppercase text-white shadow-lg" style={{ animation: 'lf-pop 7.5s ease-in-out infinite 2.5s' }}>DIAM-DIAM</div>
                    <div className="mx-auto mt-1.5 w-max rounded-md bg-[#0D0C22] px-2.5 py-1 text-[13px] font-extrabold uppercase text-white shadow-lg" style={{ animation: 'lf-pop 7.5s ease-in-out infinite 5s' }}>KAMU DIPIGILIN!</div>
                  </div>

                  {/* equalizer */}
                  <div className="absolute inset-x-4 bottom-5 flex h-6 items-end justify-between gap-[3px]">
                    {EQ_BARS.map((h, i) => (
                      <span key={i} className="w-full origin-bottom rounded-sm bg-gradient-to-t from-[#EA4C89] to-[#C32361]" style={{ height: `${h}%`, animation: `lf-eq 1.1s ease-in-out infinite ${i * 0.09}s` }}></span>
                    ))}
                  </div>
                </div>

                {/* chip melayang */}
                <div className="absolute -right-4 top-10 flex items-center gap-1.5 rounded-xl border border-[#0D0C22]/10 bg-white px-3 py-1.5 text-[11px] font-black text-[#EA4C89] shadow-[0_12px_30px_rgba(13,12,34,0.12)]" style={{ animation: 'lf-bob 3.4s ease-in-out infinite' }}>
                  <Sparkles className="h-3.5 w-3.5" /> Score 92
                </div>
                <div className="absolute -left-5 bottom-16 flex items-center gap-1.5 rounded-xl border border-[#0D0C22]/10 bg-white px-3 py-1.5 text-[11px] font-black text-[#0D0C22] shadow-[0_12px_30px_rgba(13,12,34,0.12)]" style={{ animation: 'lf-bob 3.9s ease-in-out infinite 0.6s' }}>
                  <Zap className="h-3.5 w-3.5 text-[#EA4C89]" /> +12 rb views
                </div>
              </div>

              {/* Chip pill fitur */}
              <div className="hidden flex-1 flex-wrap content-end gap-2 pb-8 md:flex" aria-hidden>
                {['TikTok', 'Reels', 'Shorts', 'AI Crop 9:16', 'Hook Generator', 'SFX Otomatis'].map((w, i) => (
                  <span
                    key={w}
                    className={`rounded-full px-3.5 py-1.5 text-[11px] font-bold text-[#0D0C22] ${['bg-[#E7E4F9]', 'bg-[#DBF3E8]', 'bg-[#FDF3D8]', 'bg-[#FDE3E1]'][i % 4]}`}
                  >
                    {w}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* KANAN: Kartu auth (di atas pada mobile) */}
          <div className="order-1 lg:order-2 lg:col-span-5">
            <div className="relative space-y-6 rounded-3xl border border-[#0D0C22]/[0.08] bg-white p-6 shadow-[0_24px_60px_rgba(13,12,34,0.1)] sm:p-8">
              {error && (
                <div className="flex items-start gap-2 rounded-xl bg-[#FDE3E1] p-3 text-xs text-[#B42318]" role="alert">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              <div className="grid grid-cols-2 gap-1 rounded-full bg-[#F8F7F4] p-1" role="tablist" aria-label="Metode masuk">
                <button type="button" role="tab" aria-selected={authMode === 'google'} onClick={() => setAuthMode('google')} className={`rounded-full py-2 text-xs font-bold transition-colors ${authMode === 'google' ? 'bg-[#0D0C22] text-white shadow' : 'text-[#6E6D7A] hover:text-[#0D0C22]'}`}>Google</button>
                <button type="button" role="tab" aria-selected={authMode === 'email'} onClick={() => setAuthMode('email')} className={`rounded-full py-2 text-xs font-bold transition-colors ${authMode === 'email' ? 'bg-[#0D0C22] text-white shadow' : 'text-[#6E6D7A] hover:text-[#0D0C22]'}`}>Email</button>
              </div>

              {authMode === 'google' && (
              <>
              <div className="space-y-1">
                <h2 className="text-2xl font-black text-[#0D0C22]" style={displayFont}>Lanjutkan dengan Google</h2>
                <p className="text-xs text-[#6E6D7A]">
                  Masuk cepat dengan Google. Klip pertama gratis (1 kredit), gak perlu setor duit di depan.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGoogleButtonClick}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-[#0D0C22]/15 bg-white px-4 py-3.5 text-sm font-extrabold text-[#0D0C22] transition-all hover:shadow-[0_10px_30px_rgba(13,12,34,0.12)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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

              <p className="text-center text-[11px] text-[#6E6D7A]">
                Aman & terverifikasi Google OAuth 2.0. Kami hanya akses nama, email & foto profil.
              </p>
              </>
              )}

              {authMode === 'email' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <h2 className="text-2xl font-black text-[#0D0C22]" style={displayFont}>{emailMode === 'login' ? 'Masuk' : 'Daftar'}</h2>
                  <p className="text-xs text-[#6E6D7A]">
                    {emailMode === 'login' ? 'Masuk ke akun ClipForge Anda.' : 'Daftar gratis, dapatkan 5 kredit untuk 5 proyek.'}
                  </p>
                </div>

                {emailMode === 'register' && (
                  <div className="space-y-1.5">
                    <label htmlFor="lf-name" className="text-[11px] font-black uppercase tracking-wider text-[#0D0C22]">Nama</label>
                    <input
                      id="lf-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nama (opsional)"
                      className="w-full rounded-xl border border-transparent bg-[#F8F7F4] px-4 py-3 text-sm text-[#0D0C22] placeholder-[#6E6D7A] transition-colors focus:border-[#EA4C89] focus:outline-none focus:ring-2 focus:ring-[#EA4C89]/20"
                    />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label htmlFor="lf-email" className="text-[11px] font-black uppercase tracking-wider text-[#0D0C22]">Email</label>
                  <input
                    id="lf-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="nama@email.com"
                    className="w-full rounded-xl border border-transparent bg-[#F8F7F4] px-4 py-3 text-sm text-[#0D0C22] placeholder-[#6E6D7A] transition-colors focus:border-[#EA4C89] focus:outline-none focus:ring-2 focus:ring-[#EA4C89]/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="lf-password" className="text-[11px] font-black uppercase tracking-wider text-[#0D0C22]">Password</label>
                  <input
                    id="lf-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEmailAuth()}
                    placeholder="Min. 8 karakter"
                    className="w-full rounded-xl border border-transparent bg-[#F8F7F4] px-4 py-3 text-sm text-[#0D0C22] placeholder-[#6E6D7A] transition-colors focus:border-[#EA4C89] focus:outline-none focus:ring-2 focus:ring-[#EA4C89]/20"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleEmailAuth}
                  disabled={loading}
                  className="w-full rounded-full bg-[#EA4C89] py-3.5 px-4 text-sm font-extrabold text-white shadow-[0_10px_30px_rgba(234,76,137,0.3)] transition-all hover:bg-[#C32361] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? <Loader2 className="mx-auto h-5 w-5 animate-spin" /> : emailMode === 'login' ? 'Masuk' : 'Daftar & Dapatkan 5 Kredit'}
                </button>

                <button
                  type="button"
                  onClick={() => { setEmailMode(emailMode === 'login' ? 'register' : 'login'); setError(null); }}
                  className="w-full text-center text-xs font-semibold text-[#EA4C89] transition-colors hover:text-[#C32361]"
                >
                  {emailMode === 'login' ? 'Belum punya akun? Daftar di sini' : 'Sudah punya akun? Masuk di sini'}
                </button>
              </div>
              )}

              <div className="space-y-3 border-t border-[#0D0C22]/[0.08] pt-4">
                <p className="text-[11px] font-black uppercase tracking-wider text-[#6E6D7A]">YANG AKAN TERJADI</p>

                <div className="space-y-3">
                  {[
                    'Buat akun (atau masuk) dengan Google, tanpa password.',
                    'Tempel link YouTube di dashboard, AI memilih 3 momen viral.',
                    'Download klip 9:16 + subtitle karaoke, langsung upload ke TikTok / Reels / Shorts.',
                  ].map((step, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#FDE3E1] text-xs font-black text-[#EA4C89]">{i + 1}</span>
                      <p className="text-xs leading-snug text-[#6E6D7A]">{step}</p>
                    </div>
                  ))}
                </div>
              </div>

              <p className="pt-2 text-center text-[10px] leading-normal text-[#6E6D7A]">
                Dengan masuk, kamu setuju dengan{' '}
                <Link href="#" className="text-[#0D0C22] underline">
                  Syarat Layanan
                </Link>{' '}
                dan{' '}
                <Link href="#" className="text-[#0D0C22] underline">
                  Kebijakan Privasi
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between border-t border-[#0D0C22]/[0.08] px-6 py-4 text-[11px] text-[#6E6D7A]">
        <p>© 2026 ClipForge AI · All rights reserved.</p>
        <div className="flex items-center gap-4">
          <Link href="#" className="transition-colors hover:text-[#0D0C22]">
            Privasi
          </Link>
          <Link href="#" className="transition-colors hover:text-[#0D0C22]">
            Syarat
          </Link>
          <Link href="#" className="transition-colors hover:text-[#0D0C22]">
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
        <div className="flex min-h-screen flex-col items-center justify-center space-y-4 bg-white p-6 text-[#0D0C22]">
          <Loader2 className="h-10 w-10 animate-spin text-[#EA4C89]" />
          <p className="text-sm font-semibold text-[#6E6D7A]">Memuat...</p>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
