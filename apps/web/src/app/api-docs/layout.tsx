import Link from 'next/link';
import { ReactNode } from 'react';

export default function ApiDocsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-[#09090b] text-zinc-300 font-sans">
      {/* Sidebar */}
      <aside className="w-72 flex-shrink-0 border-r border-zinc-800 bg-[#111113] overflow-y-auto hidden md:block">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
            </div>
            <h2 className="text-lg font-semibold text-white tracking-tight">API Docs</h2>
          </div>
          
          <div className="space-y-8">
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Memulai</h3>
              <ul className="space-y-1">
                <li><Link href="/api-docs" className="block px-3 py-2 rounded-md text-sm bg-green-500/10 text-green-400 font-medium">Pengenalan</Link></li>
                <li><Link href="#" className="block px-3 py-2 rounded-md text-sm hover:bg-zinc-800/50 hover:text-white transition-colors">Panduan Cepat</Link></li>
                <li><Link href="#" className="block px-3 py-2 rounded-md text-sm hover:bg-zinc-800/50 hover:text-white transition-colors">Autentikasi</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Endpoint API</h3>
              <ul className="space-y-1">
                <li><Link href="/api-docs/ai-clipping" className="block px-3 py-2 rounded-md text-sm hover:bg-zinc-800/50 hover:text-white transition-colors">AI Clipping</Link></li>
                <li><Link href="#" className="block px-3 py-2 rounded-md text-sm hover:bg-zinc-800/50 hover:text-white transition-colors">Find Moments</Link></li>
                <li><Link href="#" className="block px-3 py-2 rounded-md text-sm hover:bg-zinc-800/50 hover:text-white transition-colors">Social Media Publishing</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Referensi</h3>
              <ul className="space-y-1">
                <li><Link href="#" className="block px-3 py-2 rounded-md text-sm hover:bg-zinc-800/50 hover:text-white transition-colors">Gaya Subtitel</Link></li>
                <li><Link href="#" className="block px-3 py-2 rounded-md text-sm hover:bg-zinc-800/50 hover:text-white transition-colors">Bahasa yang Didukung</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-8 lg:p-12 xl:p-16">
          {children}
        </div>
      </main>
    </div>
  );
}
