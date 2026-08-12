'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setAuthSession } from '@/lib/auth';
import { Loader2 } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const userStr = searchParams.get('user');

    if (token && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr));
        setAuthSession(token, user);
        router.push('/dashboard');
        return;
      } catch (e) {
        console.error('Failed to parse OAuth callback user session:', e);
      }
    }

    router.push('/login');
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-[#060609] text-white flex flex-col items-center justify-center p-6 space-y-4">
      <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
      <p className="text-sm font-semibold text-gray-300">Menghubungkan Akun Google Anda...</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#060609] text-white flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-cyan-400" />
        <p className="text-sm font-semibold text-gray-300">Memuat...</p>
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}
