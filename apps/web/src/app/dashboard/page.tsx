'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Plus, Clock, Search, Filter, Video, Sparkles, Film, PlayCircle, CheckCircle2, AlertCircle, ExternalLink, Loader2 } from 'lucide-react';
import { MotionDiv } from '@/components/Motion';
import { getStoredUser } from '@/lib/auth';
import { apiFetch } from '@/lib/api';

export default function DashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    const user = getStoredUser();
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
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalClips = projects.reduce((sum: number, p: any) => sum + (p._count?.clips || 0), 0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const readyProjects = projects.filter((p: any) => p.status === 'READY').length;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredProjects = projects.filter((p: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (p.title && p.title.toLowerCase().includes(term)) || (p.sourceUrl && p.sourceUrl.toLowerCase().includes(term));
  });

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
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
        className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/10 pb-8"
      >
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white flex items-center gap-3">
            Dashboard Proyek
            <span className="text-xs font-bold uppercase tracking-widest text-blue-400 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/30">
              Live Workspace
            </span>
          </h1>
          <p className="text-gray-400 mt-2 text-base">
            Kelola dan konversi video panjang Anda menjadi deretan klip pendek siap viral.
          </p>
        </div>

        <Link href="/dashboard/new" className="gradient-border group shrink-0">
          <div className="flex items-center gap-2.5 rounded-xl bg-black px-7 py-3.5 font-black text-white transition-all hover:bg-black/50 text-sm shadow-[0_0_20px_rgba(37,99,235,0.3)]">
            <Sparkles className="h-5 w-5 text-blue-400 group-hover:text-pink-400 transition-colors" />
            <span>Buat Proyek Baru</span>
          </div>
        </Link>
      </MotionDiv>

      {/* Quick Summary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="glass-card rounded-2xl p-5 relative overflow-hidden border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Proyek</p>
              <h3 className="text-3xl font-black text-white mt-1">{projects.length}</h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Film className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Klip Viral Dihasilkan</p>
              <h3 className="text-3xl font-black text-purple-400 mt-1">{totalClips}</h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20">
              <PlayCircle className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 relative overflow-hidden border border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Proyek Selesai</p>
              <h3 className="text-3xl font-black text-emerald-400 mt-1">{readyProjects}</h3>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
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
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-blue-400 transition-colors" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari nama proyek atau video..." 
            className="w-full rounded-2xl border border-white/10 bg-white/5 pl-12 pr-4 py-3.5 text-white placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all text-sm"
          />
        </div>
      </MotionDiv>

      {/* Projects Grid / Empty State */}
      {filteredProjects.length === 0 ? (
        <MotionDiv 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-center py-20 border border-white/10 rounded-3xl glass-panel relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 via-purple-500/5 to-transparent pointer-events-none"></div>
          <div className="h-20 w-20 mx-auto rounded-3xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-6 shadow-[0_0_30px_rgba(37,99,235,0.3)]">
            <Video className="h-10 w-10" />
          </div>
          <h3 className="text-3xl font-black text-white mb-3 relative z-10">Belum Ada Proyek</h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto relative z-10 text-sm leading-relaxed">
            Mulailah dengan memasukkan link video YouTube untuk membiarkan AI mengekstrak klip viral pertama Anda!
          </p>
          <Link href="/dashboard/new" className="inline-flex items-center gap-2.5 rounded-2xl bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-8 py-4 font-black text-white hover:opacity-90 transition-all shadow-[0_0_25px_rgba(37,99,235,0.5)] hover:-translate-y-1 relative z-10 text-sm">
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
              <div className="flex items-center justify-between rounded-2xl glass-card p-6 group relative overflow-hidden border border-white/10 hover:border-blue-500/50">
                <div className="flex items-center gap-6 relative z-10">
                  <Link href={`/dashboard/project/${project.id}`} className="flex h-16 w-16 items-center justify-center rounded-2xl bg-black/60 border border-white/10 group-hover:border-blue-500/50 group-hover:shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all duration-300 shrink-0">
                    <Video className="h-8 w-8 text-gray-500 group-hover:text-blue-400 transition-colors duration-300" />
                  </Link>
                  <div>
                    {project.sourceUrl ? (
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-black text-red-400 bg-red-500/10 px-2.5 py-1 rounded-lg border border-red-500/20 uppercase tracking-wide shrink-0">
                          Link: YouTube
                        </span>
                        <a 
                          href={project.sourceUrl} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-base font-bold text-blue-400 hover:text-blue-300 hover:underline truncate max-w-md transition-colors flex items-center gap-1.5"
                          title={project.sourceUrl}
                        >
                          <span className="truncate">{project.sourceUrl}</span>
                          <ExternalLink className="h-4 w-4 shrink-0 text-blue-400" />
                        </a>
                      </div>
                    ) : (
                      <Link href={`/dashboard/project/${project.id}`} className="text-xl font-bold text-gray-100 group-hover:text-white transition-colors duration-300 block">
                        {project.title}
                      </Link>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 font-medium">
                      <span suppressHydrationWarning className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5 text-gray-500" /> {new Date(project.createdAt).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-gray-600">•</span>
                      <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full font-bold border border-blue-500/20">{project._count?.clips || 0} Klip High Quality</span>
                    </div>
                  </div>
                </div>

                <div className="relative z-10 flex items-center gap-3">
                  <Link href={`/dashboard/project/${project.id}`} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors">
                    Buka Proyek
                  </Link>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-black uppercase tracking-wider border
                    ${project.status === 'READY' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 
                      (project.status === 'FAILED' || project.status === 'CANCELLED') ? 'bg-red-500/15 text-red-400 border-red-500/30 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 
                      'bg-blue-500/15 text-blue-400 border-blue-500/30 shadow-[0_0_15px_rgba(37,99,235,0.3)] animate-pulse'}`}>
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
