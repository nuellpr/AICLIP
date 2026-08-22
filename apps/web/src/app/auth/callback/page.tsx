'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setAuthSession } from '@/lib/auth';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');
    const err = searchParams.get('error');

    if (err) {
      setError(decodeURIComponent(err));
      setTimeout(() => router.push(`/login?error=${encodeURIComponent(err)}`), 2000);
      return;
    }

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        setAuthSession(token, user);
        // small delay for UX, then push
        router.replace('/dashboard');
        return;
      } catch (e) {
        console.error('Failed to parse OAuth callback user session:', e);
        setError('Gagal memproses sesi login Google');
        setTimeout(() => router.push('/login?error=Gagal%20memproses%20sesi'), 1500);
        return;
      }
    }

    // If direct hit without params, maybe came from GIS without redirect?
    // Give a moment then go to login
    const timer = setTimeout(() => {
      if (!token || !userStr) {
        router.push('/login');
      }
    }, 1500);
    return () => clearTimeout(timer);
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#05060B] text-white flex flex-col items-center justify-center p-6 space-y-4">
        <div className="p-3 rounded-full bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <p className="text-sm font-bold text-red-300 text-center max-w-md">{error}</p>
        <p className="text-xs text-gray-400">Mengalihkan ke halaman login...</p>
        <Link href="/login" className="text-xs text-blue-400 underline">
          Kembali ke Login
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#05060B] text-white flex flex-col items-center justify-center p-6 space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
      <p className="text-sm font-semibold text-gray-300">Menghubungkan Akun Google Anda...</p>
      <p className="text-xs text-gray-500">Mohon tunggu, sedang menyiapkan dashboard</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#05060B] text-white flex flex-col items-center justify-center p-6 space-y-4">
          <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
          <p className="text-sm font-semibold text-gray-300">Memuat...</p>
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
