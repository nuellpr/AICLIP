'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, PlusCircle, Settings, LogOut, FolderKanban, Sparkles, CreditCard, Shield } from 'lucide-react';
import { getStoredUser, getStoredToken, setAuthSession, clearAuthSession, AuthUser } from '@/lib/auth';
import { getApiUrl, apiFetch } from '@/lib/api';
import { ClipForgeLogo } from '@/components/clipforge/Logo';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [credits, setCredits] = useState<number>(5);

  useEffect(() => {
    const currentUser = getStoredUser();
    const token = getStoredToken();

    // Guard: redirect to login if not authenticated
    if (!currentUser || !token) {
      router.push('/login');
      return;
    }

    if (currentUser) {
      setUser(currentUser);
      fetchUserCredits();

      // Refresh user session from backend via /api/auth/me with JWT
      if (token) {
        fetch(getApiUrl('/api/auth/me'), {
          headers: { Authorization: `Bearer ${token}` },
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data?.user) {
              setUser(data.user);
              // Keep existing token, update user cache
              setAuthSession(token, data.user);
            }
          })
          .catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchUserCredits = async () => {
    try {
      const res = await apiFetch('/api/payment/subscription');
      if (res.ok) {
        const data = await res.json();
        if (data.subscription) {
          setCredits(data.subscription.credits);
        }
      }
    } catch (e) {
      console.error('Failed to fetch user credits:', e);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    router.push('/login');
  };

  const userInitial = user?.name ? user.name.substring(0, 2).toUpperCase() : 'DU';

  return (
    <div className="flex flex-col md:flex-row min-h-screen text-[#0D0C22] selection:bg-[#EA4C89]/25 selection:text-[#0D0C22] relative bg-[#F8F7F4]">
      {/* Background Mesh Animation */}
      <div className="cf-mesh"></div>

      {/* Top Header for Mobile */}
      <header className="flex md:hidden items-center justify-between p-4 border-b border-black/5 bg-white sticky top-0 z-40">
        <Link href="/home" className="flex items-center gap-2.5">
          <ClipForgeLogo compact size="sm" />
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-[#E7E4F9] text-[#5B3FBF] px-3 py-1 rounded-full">
            {credits}m Kredit
          </span>
          <Link href="/dashboard/new" className="bg-[#EA4C89] hover:bg-[#C32361] p-2 rounded-xl text-white font-bold transition-colors">
            <Sparkles className="h-4 w-4" />
          </Link>
          <button onClick={handleLogout} className="p-2 rounded-xl bg-[#F8F7F4] text-[#6E6D7A] hover:text-red-500 transition-colors" title="Keluar">
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Floating Sidebar for Desktop */}
      <div className="p-4 flex-shrink-0 z-30 hidden md:block">
        <aside className="w-68 h-[calc(100vh-2rem)] rounded-3xl bg-white p-6 flex flex-col relative overflow-hidden border border-black/5 shadow-[0_10px_40px_-10px_rgba(13,12,34,0.1)]">
          {/* Top Accent Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-[#EA4C89] via-[#7C3AED] to-[#F9A8D4]"></div>

          {/* Brand Logo */}
          <Link href="/home" className="flex items-center gap-3 mb-10 z-10 pt-2 group" title="Kembali ke Tampilan Depan">
            <ClipForgeLogo compact className="transition-transform group-hover:scale-105" />
          </Link>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-3.5 z-10">
            <Link href="/dashboard" className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-[#6E6D7A] hover:bg-[#F8F7F4] hover:text-[#0D0C22] transition-all hover:translate-x-1 group font-semibold text-sm">
              <LayoutDashboard className="h-5 w-5 group-hover:text-[#EA4C89] transition-colors" />
              <span>Dashboard Proyek</span>
            </Link>

            <Link href="/dashboard/new" className="relative group block">
              <div className="relative flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-white bg-[#EA4C89] hover:bg-[#C32361] transition-all font-extrabold text-sm shadow-[0_8px_24px_-8px_rgba(234,76,137,0.5)]">
                <Sparkles className="h-5 w-5 text-white" />
                <span>Buat Proyek Baru</span>
              </div>
            </Link>

            <Link href="/dashboard/library" className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-[#6E6D7A] hover:bg-[#F8F7F4] hover:text-[#0D0C22] transition-all hover:translate-x-1 group font-semibold text-sm">
              <FolderKanban className="h-5 w-5 group-hover:text-[#EA4C89] transition-colors" />
              <span>Penyimpanan Klip</span>
            </Link>

            <Link href="/dashboard/settings" className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-[#6E6D7A] hover:bg-[#F8F7F4] hover:text-[#0D0C22] transition-all hover:translate-x-1 group font-semibold text-sm">
              <Settings className="h-5 w-5 group-hover:text-[#EA4C89] transition-colors" />
              <span>Pengaturan AI</span>
            </Link>

            <Link href="/dashboard/billing" className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-[#6E6D7A] hover:bg-[#F8F7F4] hover:text-[#0D0C22] transition-all hover:translate-x-1 group font-semibold text-sm">
              <CreditCard className="h-5 w-5 group-hover:text-[#EA4C89] transition-colors" />
              <span>Langganan & Tagihan</span>
            </Link>

            {user?.role === 'ADMIN' && (
              <Link href="/dashboard/admin" className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-[#6E6D7A] hover:bg-[#F8F7F4] hover:text-[#0D0C22] transition-all hover:translate-x-1 group font-semibold text-sm">
                <Shield className="h-5 w-5 group-hover:text-[#EA4C89] transition-colors" />
                <span>Console Admin</span>
              </Link>
            )}
          </nav>

          {/* Credit Widget & User Profile Footer */}
          <div className="mt-auto pt-6 z-10 space-y-4">
            <div className="rounded-2xl bg-[#F8F7F4] p-4 relative overflow-hidden border border-black/5">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#E7E4F9] rounded-full blur-2xl -mr-10 -mt-10"></div>
              <p className="text-xs font-bold text-[#6E6D7A] uppercase tracking-wider mb-1 relative z-10">Kredit AI Tersisa</p>
              <div className="flex items-baseline justify-between relative z-10">
                <p className="text-3xl font-black text-[#0D0C22]">{credits} <span className="text-xs font-semibold text-[#EA4C89]">kredit</span></p>
                <span className="text-[10px] font-bold bg-[#DBF3E8] text-[#166534] px-2 py-0.5 rounded-full">AKTIF</span>
              </div>
              <div className="w-full bg-[#EDEBE6] h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-gradient-to-r from-[#EA4C89] to-[#7C3AED] h-full rounded-full" style={{ width: `${Math.min(100, Math.round((credits / 5) * 100))}%` }}></div>
              </div>
            </div>

            {/* Quick User Badge */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-[#F8F7F4] border border-black/5">
              <div className="flex items-center gap-3 overflow-hidden">
                {user?.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.image} alt={user.name || 'User'} className="h-9 w-9 rounded-xl object-cover border border-[#EA4C89]/30" />
                ) : (
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-[#EA4C89] to-[#7C3AED] flex items-center justify-center font-bold text-xs text-white flex-shrink-0">
                    {userInitial}
                  </div>
                )}
                <div className="overflow-hidden">
                  <p className="text-xs font-bold text-[#0D0C22] truncate">{user?.name || 'Demo User'}</p>
                  <p className="text-[10px] text-[#6E6D7A] truncate">{user?.email || 'demo@clipforge.ai'}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="text-[#6E6D7A] hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-white flex-shrink-0"
                title="Keluar"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto p-4 md:py-4 md:pr-4 md:pl-0 pb-20 md:pb-4">
        <div className="min-h-[calc(100vh-2rem)] md:h-[calc(100vh-2rem)] rounded-3xl bg-white p-4 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden relative border border-black/5 shadow-[0_10px_40px_-10px_rgba(13,12,34,0.08)]">
          {/* Background Ambient Aura Optimized */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none -mr-40 -mt-40 bg-[radial-gradient(circle,rgba(231,228,249,0.5)_0%,transparent_70%)] will-change-transform"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none -ml-40 -mb-40 bg-[radial-gradient(circle,rgba(253,227,225,0.5)_0%,transparent_70%)] will-change-transform"></div>
          {children}
        </div>
      </main>

      {/* Bottom Floating Navigation for Mobile */}
      <div className="fixed bottom-3 left-3 right-3 z-50 block md:hidden">
        <div className="rounded-2xl p-2 flex items-center justify-around border border-black/5 bg-white/95 backdrop-blur-2xl shadow-[0_10px_40px_-10px_rgba(13,12,34,0.25)]">
          <Link href="/dashboard" className="flex flex-col items-center gap-1 p-2 text-[#6E6D7A] hover:text-[#EA4C89] transition-colors text-[10px] font-bold">
            <LayoutDashboard className="h-5 w-5" />
            Proyek
          </Link>
          <Link href="/dashboard/new" className="flex flex-col items-center gap-1 p-2 text-[#EA4C89] font-bold text-[10px]">
            <div className="h-10 w-10 rounded-xl bg-[#EA4C89] text-white flex items-center justify-center -mt-6 border-2 border-white shadow-[0_8px_20px_-4px_rgba(234,76,137,0.5)]">
              <PlusCircle className="h-6 w-6" />
            </div>
            Baru
          </Link>
          <Link href="/dashboard/library" className="flex flex-col items-center gap-1 p-2 text-[#6E6D7A] hover:text-[#EA4C89] transition-colors text-[10px] font-bold">
            <FolderKanban className="h-5 w-5" />
            Klip
          </Link>
          <Link href="/dashboard/settings" className="flex flex-col items-center gap-1 p-2 text-[#6E6D7A] hover:text-[#EA4C89] transition-colors text-[10px] font-bold">
            <Settings className="h-5 w-5" />
            Pengaturan
          </Link>
          <Link href="/dashboard/billing" className="flex flex-col items-center gap-1 p-2 text-[#6E6D7A] hover:text-[#EA4C89] transition-colors text-[10px] font-bold">
            <CreditCard className="h-5 w-5" />
            Langganan
          </Link>
        </div>
      </div>
    </div>
  );
}
