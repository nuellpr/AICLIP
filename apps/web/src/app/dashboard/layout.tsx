import Link from 'next/link';
import { LayoutDashboard, PlusCircle, Settings, LogOut, Video, FolderKanban, Sparkles } from 'lucide-react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col md:flex-row min-h-screen text-white selection:bg-cyan-500 selection:text-black relative bg-[#07070b]">
      {/* Background Mesh Animation */}
      <div className="mesh-bg"></div>

      {/* Top Header for Mobile */}
      <header className="flex md:hidden items-center justify-between p-4 border-b border-white/10 glass-panel sticky top-0 z-40">
        <Link href="/home" className="flex items-center gap-2.5">
          <img src="/logo.png" alt="ClipForge AI" className="h-8 w-auto object-contain" />
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold bg-cyan-500/20 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/30">
            25m Kredit
          </span>
          <Link href="/dashboard/new" className="bg-gradient-to-r from-cyan-400 to-purple-500 p-2 rounded-xl text-black font-bold">
            <Sparkles className="h-4 w-4" />
          </Link>
        </div>
      </header>

      {/* Floating Glass Sidebar for Desktop */}
      <div className="p-4 flex-shrink-0 z-30 hidden md:block">
        <aside className="w-68 h-[calc(100vh-2rem)] rounded-3xl glass-panel p-6 flex flex-col relative overflow-hidden border border-white/10 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
          {/* Top Neon Accent Glow Line */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500"></div>

          {/* Brand Logo */}
          <Link href="/home" className="flex items-center gap-3 mb-10 z-10 pt-2 group" title="Kembali ke Tampilan Depan">
            <img src="/logo.png" alt="ClipForge AI" className="h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.4)] group-hover:scale-105 transition-transform" />
          </Link>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-3.5 z-10">
            <Link href="/dashboard" className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-gray-300 hover:bg-white/10 hover:text-white transition-all hover:translate-x-1 group font-semibold text-sm">
              <LayoutDashboard className="h-5 w-5 group-hover:text-cyan-400 transition-colors" />
              <span>Dashboard Proyek</span>
            </Link>

            <Link href="/dashboard/new" className="relative group block">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 rounded-2xl blur-[3px] opacity-70 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-white bg-[#0a0a10] hover:bg-black/40 transition-all font-extrabold text-sm">
                <Sparkles className="h-5 w-5 text-cyan-400 group-hover:text-pink-400 transition-colors" />
                <span>Buat Proyek Baru</span>
              </div>
            </Link>

            <Link href="/dashboard/library" className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-gray-300 hover:bg-white/10 hover:text-white transition-all hover:translate-x-1 group font-semibold text-sm">
              <FolderKanban className="h-5 w-5 group-hover:text-purple-400 transition-colors" />
              <span>Penyimpanan Klip</span>
            </Link>

            <Link href="/dashboard/settings" className="flex items-center gap-3.5 rounded-2xl px-4 py-3.5 text-gray-300 hover:bg-white/10 hover:text-white transition-all hover:translate-x-1 group font-semibold text-sm">
              <Settings className="h-5 w-5 group-hover:text-pink-400 transition-colors" />
              <span>Pengaturan AI</span>
            </Link>
          </nav>

          {/* Credit Widget & User Profile Footer */}
          <div className="mt-auto pt-6 z-10 space-y-4">
            <div className="rounded-2xl glass-card p-4 relative overflow-hidden border border-white/10 bg-gradient-to-b from-white/5 to-transparent">
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 relative z-10">Kredit AI Tersisa</p>
              <div className="flex items-baseline justify-between relative z-10">
                <p className="text-3xl font-black text-white">25 <span className="text-xs font-semibold text-cyan-400">menit</span></p>
                <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full border border-green-500/30">AKTIF</span>
              </div>
              <div className="w-full bg-white/10 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full w-[70%] rounded-full"></div>
              </div>
            </div>

            {/* Quick User Badge */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-purple-500 flex items-center justify-center font-bold text-xs text-black">
                  DU
                </div>
                <div>
                  <p className="text-xs font-bold text-white">Demo User</p>
                  <p className="text-[10px] text-gray-400">demo@clipforge.ai</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-red-400 transition-colors p-1.5 rounded-lg hover:bg-white/10" title="Keluar">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Main Container */}
      <main className="flex-1 overflow-y-auto p-4 md:py-4 md:pr-4 md:pl-0 pb-20 md:pb-4">
        <div className="min-h-[calc(100vh-2rem)] md:h-[calc(100vh-2rem)] rounded-3xl glass-panel p-4 sm:p-6 md:p-8 overflow-y-auto overflow-x-hidden relative border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.4)]">
          {/* Background Ambient Aura Optimized */}
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full pointer-events-none -mr-40 -mt-40 bg-[radial-gradient(circle,rgba(6,182,212,0.05)_0%,transparent_70%)] will-change-transform"></div>
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full pointer-events-none -ml-40 -mb-40 bg-[radial-gradient(circle,rgba(168,85,247,0.05)_0%,transparent_70%)] will-change-transform"></div>
          {children}
        </div>
      </main>

      {/* Bottom Floating Navigation for Mobile */}
      <div className="fixed bottom-3 left-3 right-3 z-50 block md:hidden">
        <div className="glass-panel rounded-2xl p-2 flex items-center justify-around border border-white/15 bg-black/80 backdrop-blur-2xl shadow-[0_0_30px_rgba(0,0,0,0.8)]">
          <Link href="/dashboard" className="flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-cyan-400 transition-colors text-[10px] font-bold">
            <LayoutDashboard className="h-5 w-5" />
            Proyek
          </Link>
          <Link href="/dashboard/new" className="flex flex-col items-center gap-1 p-2 text-cyan-400 font-bold text-[10px]">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-r from-cyan-400 to-purple-500 text-black flex items-center justify-center -mt-6 border-2 border-black shadow-[0_0_15px_rgba(6,182,212,0.6)]">
              <PlusCircle className="h-6 w-6" />
            </div>
            Baru
          </Link>
          <Link href="/dashboard/library" className="flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-purple-400 transition-colors text-[10px] font-bold">
            <FolderKanban className="h-5 w-5" />
            Klip
          </Link>
          <Link href="/dashboard/settings" className="flex flex-col items-center gap-1 p-2 text-gray-400 hover:text-pink-400 transition-colors text-[10px] font-bold">
            <Settings className="h-5 w-5" />
            Pengaturan
          </Link>
        </div>
      </div>
    </div>
  );
}
