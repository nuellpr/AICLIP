"use client";

import { useState, useEffect } from "react";
import { Download, Video, Loader2, Calendar, Trash2, CheckSquare, Square, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { getApiUrl, apiFetch } from "@/lib/api";

import { getStoredUser } from "@/lib/auth";

export default function LibraryPage() {
  const [mounted, setMounted] = useState(false);
  const [clips, setClips] = useState<{id:string,title:string,hook:string,createdAt:string,project?:{title:string},renderedFileKey?:string}[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const fetchClips = async () => {
    setIsLoading(true);
    try {
      const currentUser = getStoredUser();
      if (!currentUser || !currentUser.id) {
        setClips([]);
        return;
      }
      const res = await apiFetch('/api/clips/library');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setClips(data);
        }
      }
    } catch (_e) {
      console.error('Fetch error:', _e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchClips();
  }, []);

  // Toggle single clip selection
  const toggleSelectClip = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Toggle select all
  const toggleSelectAll = () => {
    if (selectedIds.length === clips.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(clips.map(c => c.id));
    }
  };

  // Delete single clip (Moves file to Recycle Bin)
  const handleDelete = async (id: string) => {
    if (!confirm('Pindahkan video klip ini ke Recycle Bin laptop Anda?')) return;
    
    try {
      const res = await apiFetch(`/api/clips/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSelectedIds(prev => prev.filter(item => item !== id));
        showToast('Klip berhasil dipindahkan ke Recycle Bin!');
        fetchClips();
      }
    } catch (_e) {
      alert('Gagal menghapus klip');
    }
  };

  // Batch delete selected clips (Moves all selected files to Recycle Bin)
  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Pindahkan ${selectedIds.length} video klip terpilih ke Recycle Bin laptop Anda?`)) return;

    setIsDeleting(true);
    try {
      const res = await apiFetch('/api/clips/batch-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clipIds: selectedIds })
      });

      if (res.ok) {
        showToast(`${selectedIds.length} Klip berhasil dipindahkan ke Recycle Bin!`);
        setSelectedIds([]);
        fetchClips();
      } else {
        alert('Gagal menghapus beberapa klip');
      }
    } catch (_e) {
      alert('Terjadi kesalahan saat menghapus');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!mounted || isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#EA4C89]" />
      </div>
    );
  }

  const isAllSelected = clips.length > 0 && selectedIds.length === clips.length;

  return (
    <div className="max-w-6xl mx-auto space-y-8 relative">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-emerald-500 text-white font-bold px-4 py-3 rounded-xl shadow-[0_8px_24px_-8px_rgba(16,185,129,0.5)] animate-bounce">
          <CheckCircle2 className="h-5 w-5" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--db-line)] pb-6">
        <div>
          <h1 className="text-3xl font-bold">Penyimpanan Klip</h1>
          <p className="text-[var(--db-gray)] mt-1">Daftar semua klip video yang telah di-render. Pilih & hapus instan ke Recycle Bin laptop.</p>
        </div>

        {clips.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSelectAll}
              className="flex items-center gap-2 bg-[var(--db-panel)] hover:bg-[var(--db-cream)] text-[var(--ink)] px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--db-line)] transition-colors"
            >
              {isAllSelected ? <CheckSquare className="w-4 h-4 text-[#EA4C89]" /> : <Square className="w-4 h-4 text-[var(--db-gray)]" />}
              <span>{isAllSelected ? 'Batal Pilih Semua' : 'Pilih Semua'}</span>
            </button>

            {selectedIds.length > 0 && (
              <button
                onClick={handleBatchDelete}
                disabled={isDeleting}
                className="flex items-center gap-2 bg-[#B42318] hover:bg-[#9A1F15] text-white px-4 py-2 rounded-xl text-sm font-extrabold transition-all shadow-[0_8px_20px_-8px_rgba(180,35,24,0.5)] disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Hapus Terpilih ({selectedIds.length})</span>
              </button>
            )}
          </div>
        )}
      </div>

      {clips.length === 0 ? (
        <div className="rounded-2xl border border-[var(--db-line)] bg-[var(--db-panel)] shadow-sm p-12 text-center">
          <Video className="mx-auto h-12 w-12 text-[var(--db-gray)] mb-4" />
          <h3 className="text-xl font-medium text-[var(--ink)] mb-2">Belum ada klip</h3>
          <p className="text-[var(--db-gray)] mb-6">Anda belum merender klip apa pun. Buat proyek baru untuk memulai.</p>
          <Link href="/dashboard/new" className="inline-block bg-[#EA4C89] hover:bg-[#C32361] text-white px-6 py-2 rounded-lg font-medium transition-colors">
            Buat Proyek
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {clips.map((clip) => {
            const isSelected = selectedIds.includes(clip.id);
            const safeTitle = clip.title.replace(/[^a-zA-Z0-9 ]/g, "").trim() || clip.id;
            const filename = `${safeTitle}.mp4`;
            const rawUrl = clip.renderedFileKey || getApiUrl(`/renders/${filename}`);
            const videoUrl = typeof window !== 'undefined' ? rawUrl.replace('localhost:3001', `${window.location.hostname}:3001`).replace('127.0.0.1:3001', `${window.location.hostname}:3001`) : rawUrl;
            
            return (
              <div 
                key={clip.id} 
                className={`group relative rounded-2xl border transition-all overflow-hidden flex flex-col ${
                  isSelected ? 'border-[#EA4C89] bg-[var(--db-panel)] shadow-[0_8px_24px_-8px_rgba(234,76,137,0.35)]' : 'border-[var(--db-line)] bg-[var(--db-panel)] hover:border-[#EA4C89]/40'
                }`}
              >
                <div className="relative aspect-[9/16] bg-black">
                  <video 
                    src={videoUrl}
                    className="w-full h-full object-cover"
                    controls
                    preload="metadata"
                  />
                  
                  {/* Select Checkbox Box */}
                  <button
                    onClick={() => toggleSelectClip(clip.id)}
                    className="absolute top-3 right-3 z-20 flex items-center justify-center h-8 w-8 rounded-lg bg-black/70 backdrop-blur-md border border-white/20 text-white transition-transform hover:scale-110"
                    title={isSelected ? "Batal Pilih" : "Pilih Klip"}
                  >
                    {isSelected ? <CheckSquare className="w-5 h-5 text-[#EA4C89]" /> : <Square className="w-5 h-5 text-gray-400" />}
                  </button>

                  {/* Project Title Badge */}
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-md text-xs font-semibold border border-white/10 text-[#F9A8D4]">
                    {clip.project?.title || "Video"}
                  </div>
                </div>
                
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="font-bold text-lg mb-1 line-clamp-2">{clip.title}</h3>
                  <p className="text-sm text-[var(--db-gray)] line-clamp-2 mb-4 flex-1">&quot;{clip.hook}&quot;</p>
                  
                  <div className="flex items-center justify-between mt-auto pt-4 border-t border-[var(--db-line)]">
                    <div className="flex items-center text-xs text-[var(--db-gray)]">
                      <Calendar className="w-3 h-3 mr-1" />
                      {new Date(clip.createdAt).toLocaleDateString()}
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDelete(clip.id)}
                        className="flex items-center justify-center bg-[#FDE3E1] hover:bg-[#FAD5D2] text-[#B42318] p-2 rounded-xl transition-colors"
                        title="Pindahkan ke Recycle Bin Laptop"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <a 
                        href={videoUrl} 
                        download={filename}
                        target="_blank"
                        className="flex items-center gap-2 bg-[var(--db-panel)] hover:bg-[var(--db-cream)] text-[var(--ink)] border border-[var(--db-line)] px-3 py-2 rounded-xl text-sm font-medium transition-colors"
                      >
                        <Download className="w-4 h-4" /> Unduh
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
