'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Plus, Clock, Search, Video, Sparkles, CheckCircle2, AlertCircle, ExternalLink, Loader2, Folder, Clapperboard, Coins } from 'lucide-react';
import { MotionDiv } from '@/components/Motion';
import { getStoredUser } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

export default function DashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [firstName, setFirstName] = useState<string>('kreator');
  const [credits, setCredits] = useState<number | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    const first = user?.name?.trim().split(/\s+/)[0];
    if (first) setFirstName(first);

    if (!user || !user.id) {
      setProjects([]);
      setLoading(false);
      return;
    }

    apiFetch('/api/projects')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (Array.isArray(data)) setProjects(data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));

    apiFetch('/api/payment/subscription')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data?.subscription) setCredits(data.subscription.credits);
      })
      .catch(console.error);
  }, []);

  // Klip siap = klip milik proyek READY (payload proyek tidak punya status per-klip)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const readyClips = projects.filter((p: any) => p.status === 'READY').reduce((sum: number, p: any) => sum + (p._count?.clips || 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processingProjects = projects.filter((p: any) => p.status && !['READY', 'FAILED', 'CANCELLED'].includes(p.status)).length;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredProjects = projects.filter((p: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (p.title && p.title.toLowerCase().includes(term)) || (p.sourceUrl && p.sourceUrl.toLowerCase().includes(term));
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#EA4C89]" />
      </div>
    );
  }

  return (
    <div className="space-y-10 relative z-10">
      {/* Top Header Banner */}
      <MotionDiv 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[var(--db-line)] pb-8"
      >
        <div>
          <h1 className="text-4xl font-black tracking-tight text-[var(--ink)] flex items-center gap-3" style={{ fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif' }}>
            Halo, {firstName} 👋
          </h1>
          <p className="text-[var(--db-gray)] mt-2 text-base">
            Kelola semua proyek klip kamu di satu tempat.
          </p>
        </div>

        <Link href="/dashboard/new" className="group shrink-0">
          <div className="flex items-center gap-2.5 rounded-xl bg-[#EA4C89] hover:bg-[#C32361] px-7 py-3.5 font-black text-white transition-all text-sm shadow-[0_8px_24px_-8px_rgba(234,76,137,0.5)]">
            <Sparkles className="h-5 w-5 text-white" />
            <span>Buat Proyek Baru</span>
          </div>
        </Link>
      </MotionDiv>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <div className="rounded-2xl bg-[var(--db-panel)] border border-[var(--db-line)] shadow-sm p-5">
          <div className="h-11 w-11 rounded-xl bg-[#E7E4F9] text-[#5B3FBF] flex items-center justify-center mb-4">
            <Folder className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold text-[var(--db-gray)] uppercase tracking-wider">Total Proyek</p>
          <h3 className="text-3xl font-black text-[var(--ink)] mt-1" style={{ fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif' }}>{projects.length}</h3>
        </div>

        <div className="rounded-2xl bg-[var(--db-panel)] border border-[var(--db-line)] shadow-sm p-5">
          <div className="h-11 w-11 rounded-xl bg-[#DBF3E8] text-[#166534] flex items-center justify-center mb-4">
            <Clapperboard className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold text-[var(--db-gray)] uppercase tracking-wider">Klip Siap</p>
          <h3 className="text-3xl font-black text-[var(--ink)] mt-1" style={{ fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif' }}>{readyClips}</h3>
        </div>

        <div className="rounded-2xl bg-[var(--db-panel)] border border-[var(--db-line)] shadow-sm p-5">
          <div className="h-11 w-11 rounded-xl bg-[#FDF3D8] text-[#92400E] flex items-center justify-center mb-4">
            <Loader2 className={`h-5 w-5 ${processingProjects > 0 ? 'animate-spin' : ''}`} />
          </div>
          <p className="text-xs font-bold text-[var(--db-gray)] uppercase tracking-wider">Sedang Diproses</p>
          <h3 className="text-3xl font-black text-[var(--ink)] mt-1" style={{ fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif' }}>{processingProjects}</h3>
        </div>

        <div className="rounded-2xl bg-[var(--db-panel)] border border-[var(--db-line)] shadow-sm p-5">
          <div className="h-11 w-11 rounded-xl bg-[#FDE3E1] text-[#EA4C89] flex items-center justify-center mb-4">
            <Coins className="h-5 w-5" />
          </div>
          <p className="text-xs font-bold text-[var(--db-gray)] uppercase tracking-wider">Kredit Tersisa</p>
          <h3 className="text-3xl font-black text-[#EA4C89] mt-1" style={{ fontFamily: 'var(--font-space-grotesk), system-ui, sans-serif' }}>
            {credits === null ? '—' : credits}
          </h3>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <MotionDiv 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="flex flex-col sm:flex-row gap-4"
      >
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[var(--db-gray)] group-focus-within:text-[#EA4C89] transition-colors" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama proyek atau video..." 
            className="w-full rounded-2xl border border-transparent bg-[var(--db-cream)] pl-12 pr-4 py-3.5 text-[var(--ink)] placeholder-[#6E6D7A] focus:border-[#EA4C89] focus:outline-none focus:ring-1 focus:ring-[#EA4C89] transition-all text-sm"
          />
        </div>
      </MotionDiv>

      {/* Projects Grid / Empty State */}
      {filteredProjects.length === 0 ? (
        <MotionDiv 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center py-20 rounded-3xl glass-panel relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-[#E7E4F9]/40 via-[#FDE3E1]/30 to-transparent pointer-events-none"></div>
          <div className="h-20 w-20 mx-auto rounded-3xl bg-[#FDE3E1] flex items-center justify-center text-[#EA4C89] mb-6 shadow-[0_8px_24px_-8px_rgba(234,76,137,0.35)]">
            <Video className="h-10 w-10" />
          </div>
          <h3 className="text-3xl font-black text-[var(--ink)] mb-3 relative z-10">Belum Ada Proyek</h3>
          <p className="text-[var(--db-gray)] mb-8 max-w-md mx-auto relative z-10 text-sm leading-relaxed">
            Mulailah dengan memasukkan link video YouTube untuk membiarkan AI mengekstrak klip viral pertama Anda!
          </p>
          <Link href="/dashboard/new" className="inline-flex items-center gap-2.5 rounded-2xl bg-[#EA4C89] hover:bg-[#C32361] px-8 py-4 font-black text-white transition-all shadow-[0_8px_24px_-8px_rgba(234,76,137,0.5)] hover:-translate-y-1 relative z-10 text-sm">
            <Plus className="h-5 w-5" />
            Mulai Buat Proyek Pertama
          </Link>
        </MotionDiv>
      ) : (
        <div className="grid gap-5">
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          {filteredProjects.map((project: any, index: number) => (
            <MotionDiv
              key={project.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.08 * index }}
            >
              <div className="flex items-center justify-between rounded-2xl glass-card p-6 group relative overflow-hidden hover:border-[#EA4C89]/40">
                <div className="flex items-center gap-6 relative z-10">
                  <Link href={`/dashboard/project/${project.id}`} className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--db-cream)] border border-[var(--db-line)] group-hover:border-[#EA4C89]/40 group-hover:shadow-[0_8px_20px_-8px_rgba(234,76,137,0.35)] transition-all duration-300 shrink-0">
                    <Video className="h-8 w-8 text-[var(--db-gray)] group-hover:text-[#EA4C89] transition-colors duration-300" />
                  </Link>
                  <div>
                    {project.sourceUrl ? (
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-black text-[#B91C1C] bg-[#FDE3E1] px-2.5 py-1 rounded-lg uppercase tracking-wide shrink-0">
                          Link: YouTube
                        </span>
                        <a 
                          href={project.sourceUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-base font-bold text-[#EA4C89] hover:text-[#C32361] hover:underline truncate max-w-md transition-colors flex items-center gap-1.5"
                          title={project.sourceUrl}
                        >
                          <span className="truncate">{project.sourceUrl}</span>
                          <ExternalLink className="h-4 w-4 shrink-0 text-[#EA4C89]" />
                        </a>
                      </div>
                    ) : (
                      <Link href={`/dashboard/project/${project.id}`} className="text-xl font-bold text-[var(--ink)] group-hover:text-[#EA4C89] transition-colors duration-300 block">
                        {project.title}
                      </Link>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-[var(--db-gray)] font-medium">
                      <span suppressHydrationWarning className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-[var(--db-gray)]" /> {new Date(project.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-[var(--db-gray)]/60">•</span>
                      <span className="bg-[#E7E4F9] text-[#5B3FBF] px-3 py-1 rounded-full font-bold">{project._count?.clips || 0} Klip High Quality</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                  <Link href={`/dashboard/project/${project.id}`} className="px-4 py-2 rounded-xl bg-[var(--db-panel)] border border-[var(--db-line)] hover:border-[#EA4C89]/50 hover:text-[#EA4C89] text-[var(--ink)] font-bold text-xs transition-colors">
                    Buka Proyek
                  </Link>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider
                    ${project.status === 'READY' ? 'bg-[#DBF3E8] text-[#166534]' : 
                      (project.status === 'FAILED' || project.status === 'CANCELLED') ? 'bg-[#FDE3E1] text-[#B91C1C]' : 
                      'bg-[#FDF3D8] text-[#92400E] animate-pulse'}`}>
                    {project.status === 'READY' && <CheckCircle2 className="h-3.5 w-3.5" />}
                    {project.status === 'FAILED' && <AlertCircle className="h-3.5 w-3.5" />}
                    {project.status}
                  </span>
                </div>
              </div>
            </MotionDiv>
          ))}
        </div>
      )}
    </div>
  );
}
