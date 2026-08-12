'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Mail, Lock, User as UserIcon, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { setAuthSession } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Google Email Quick Sign-in State
  const [showGoogleInput, setShowGoogleInput] = useState<boolean>(false);
  const [googleEmail, setGoogleEmail] = useState<string>('');

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const payload = isRegister ? { email, password, name } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Autentikasi gagal');
      }

      setAuthSession(data.token, data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat masuk');
    } finally {
      setLoading(false);
    }
  };

  const executeGoogleAuth = async (targetEmail: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetEmail,
          name: targetEmail.split('@')[0],
          picture: 'https://lh3.googleusercontent.com/a/default-user=s96-c',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Gagal masuk dengan Akun Google');
      }

      setAuthSession(data.token, data.user);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Gagal masuk dengan Google');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleButtonClick = () => {
    setShowGoogleInput((prev) => !prev);
  };

  return (
    <div className="min-h-screen bg-[#07070b] text-white flex items-center justify-center p-4 relative selection:bg-cyan-500 selection:text-black overflow-hidden">
      {/* Ambient Aura Background */}
      <div className="mesh-bg"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-purple-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link href="/home" className="inline-block group">
            <img src="/logo.png" alt="ClipForge AI" className="h-12 mx-auto object-contain drop-shadow-[0_0_20px_rgba(34,211,238,0.4)] group-hover:scale-105 transition-transform" />
          </Link>
          <p className="text-xs text-gray-400">Masuk untuk mengelola video klip viral & saldo menit AI Anda.</p>
        </div>

        {/* Auth Glass Card */}
        <div className="rounded-3xl glass-panel p-6 sm:p-8 border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"></div>

          {error && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-In Section */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleButtonClick}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-100 text-black font-bold py-3 px-4 rounded-2xl text-xs sm:text-sm transition-all flex items-center justify-center gap-3 shadow-lg hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Lanjutkan dengan Akun Google</span>
            </button>

            {showGoogleInput && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (googleEmail) executeGoogleAuth(googleEmail);
                }}
                className="pt-2 flex items-center gap-2 animate-in fade-in duration-200"
              >
                <input
                  type="email"
                  required
                  autoFocus
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="Masukkan Email Google Anda (contoh: studioruangvisual@gmail.com)"
                  className="flex-1 bg-white/10 border border-cyan-400/50 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-cyan-400 hover:bg-cyan-300 text-black font-extrabold px-4 py-2 rounded-xl text-xs transition-all shrink-0"
                >
                  Masuk
                </button>
              </form>
            )}
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-white/10 w-full"></div>
            <span className="bg-[#0a0a10] px-3 text-[10px] text-gray-500 uppercase tracking-widest font-bold absolute">atau</span>
          </div>

          {/* Email / Password Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isRegister && (
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Nama Lengkap</label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required={isRegister}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama Anda"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@domain.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-300 block mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-400 to-purple-500 hover:from-cyan-300 hover:to-purple-400 text-black font-extrabold py-3 rounded-xl text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(34,211,238,0.3)] disabled:opacity-50"
            >
              <span>{isRegister ? 'Daftar Akun Baru' : 'Masuk ke Dashboard'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Toggle Register / Login */}
          <div className="text-center pt-2 border-t border-white/5 text-xs text-gray-400">
            {isRegister ? (
              <p>
                Sudah punya akun?{' '}
                <button onClick={() => setIsRegister(false)} className="text-cyan-400 font-bold hover:underline">
                  Masuk Sekarang
                </button>
              </p>
            ) : (
              <p>
                Belum punya akun?{' '}
                <button onClick={() => setIsRegister(true)} className="text-cyan-400 font-bold hover:underline">
                  Daftar Gratis (25 Menit)
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Security Footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-gray-500">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Sistem Keamanan Terenkripsi SSL 256-Bit</span>
        </div>
      </div>
    </div>
  );
}
