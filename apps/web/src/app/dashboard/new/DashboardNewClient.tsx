"use client";

import { useState } from "react";
import { Upload, Link as LinkIcon, Settings2, ArrowRight, Loader2, Sparkles, PlaySquare, Crop, SplitSquareVertical, Zap, ScanFace, FileVideo, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MotionDiv } from "@/components/Motion";
import { apiFetch } from "@/lib/api";

export default function NewProjectPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [layoutMode, setLayoutMode] = useState("crop_blur");
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [clipCount, setClipCount] = useState(3);
  const [targetDuration, setTargetDuration] = useState("30-60");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAiModel, setSelectedAiModel] = useState("");

  const handleSubmit = async () => {
    if (activeTab === 'url' && !url) {
      setError("Masukkan URL video terlebih dahulu");
      return;
    }
    if (activeTab === 'upload' && !file) {
      setError("Pilih file video terlebih dahulu");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let body: any = {
        title: activeTab === 'url' ? "Proyek dari URL" : "Proyek dari File",
        sourceType: activeTab === 'url' ? "URL" : "UPLOAD",
        layoutMode: layoutMode,
        aspectRatio: aspectRatio,
        clipCount: clipCount,
        targetDuration: targetDuration,
        searchQuery: searchQuery,
        aiProvider: selectedAiModel ? selectedAiModel.split(':')[0] : null,
        aiModel: selectedAiModel ? selectedAiModel.split(':')[1] : null,
      };

      if (activeTab === 'upload') {
        const up = await apiFetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: file,
        });
        const upData = await up.json().catch(() => ({}));
        if (!up.ok) {
          throw new Error(upData.error || "Gagal mengunggah file");
        }
        body.sourceFileKey = upData.fileKey;
      } else {
        body.sourceUrl = url;
      }

      const res = await apiFetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat proyek");
      }

      router.push(`/dashboard/project/${data.projectId || data.id}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || "Gagal membuat proyek");
      setLoading(false);
    }
  };
  
  return (
    <MotionDiv 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto space-y-8 relative z-10 pb-20"
    >
      <div>
        <h1 className="text-4xl font-black text-[var(--ink)]">Proyek Baru</h1>
        <p className="text-[var(--db-gray)] mt-2 text-lg">Pilih sumber video untuk memulai ekstraksi klip viral Anda.</p>
      </div>

      {error && (
        <MotionDiv initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#FDE3E1] text-[#B91C1C] px-5 py-4 rounded-xl font-semibold">
          {error}
        </MotionDiv>
      )}

      <div className="flex gap-4 border-b border-[var(--db-line)] pb-px relative">
        <button 
          onClick={() => setActiveTab('url')}
          className={`flex items-center gap-2 px-6 py-4 font-bold transition-all border-b-2 relative ${activeTab === 'url' ? 'border-[#EA4C89] text-[#EA4C89]' : 'border-transparent text-[var(--db-gray)] hover:text-[var(--ink)] hover:bg-[var(--db-cream)] rounded-t-xl'}`}
        >
          <LinkIcon className="h-5 w-5" />
          Gunakan URL Video
        </button>
        <button 
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-6 py-4 font-bold transition-all border-b-2 relative ${activeTab === 'upload' ? 'border-[#EA4C89] text-[#EA4C89]' : 'border-transparent text-[var(--db-gray)] hover:text-[var(--ink)] hover:bg-[var(--db-cream)] rounded-t-xl'}`}
        >
          <Upload className="h-5 w-5" />
          Unggah File
        </button>
      </div>

      <div className="rounded-2xl glass-panel p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#E7E4F9]/60 rounded-full blur-[80px] pointer-events-none -mr-32 -mt-32"></div>
        {activeTab === 'url' ? (
          <div className="space-y-6 relative z-10">
            <div>
              <label className="block text-sm font-bold text-[var(--ink)] mb-3 uppercase tracking-wider">URL Video (YouTube, TikTok, dll)</label>
              <div className="relative group">
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..." 
                  className="w-full relative rounded-xl border border-transparent bg-[var(--db-cream)] px-5 py-4 text-[var(--ink)] placeholder-[#6E6D7A] focus:outline-none focus:border-[#EA4C89] focus:ring-1 focus:ring-[#EA4C89]"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <input type="checkbox" id="rights" className="w-5 h-5 rounded border-black/20 bg-[var(--db-panel)] text-[#EA4C89] focus:ring-[#EA4C89] cursor-pointer accent-[#EA4C89]" />
              <label htmlFor="rights" className="text-sm text-[var(--db-gray)] cursor-pointer hover:text-[var(--ink)] transition-colors">Saya menyatakan memiliki hak atau izin untuk memproses video ini.</label>
            </div>
          </div>
        ) : (
          <div className="space-y-6 relative z-10">
            {file ? (
              <div className="flex items-center justify-between gap-4 rounded-2xl border-2 border-[#EA4C89]/40 bg-[#FDE3E1]/40 p-6">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="p-4 rounded-xl bg-[#FDE3E1] text-[#C32361]">
                    <FileVideo className="h-10 w-10" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-[var(--ink)] truncate">{file.name}</p>
                    <p className="text-sm text-[var(--db-gray)] mt-1">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
                  </div>
                </div>
                <button
                  onClick={() => setFile(null)}
                  className="p-3 rounded-xl bg-[var(--db-panel)] hover:bg-[#FDE3E1] hover:text-[#B91C1C] text-[var(--db-gray)] transition-colors border border-[var(--db-line)]"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[var(--db-line)] bg-[var(--db-cream)] p-16 text-center hover:border-[#EA4C89]/50 hover:bg-[#FDE3E1]/30 transition-all cursor-pointer group">
                <input
                  type="file"
                  accept="video/mp4,video/quicktime,video/x-matroska,video/webm"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      if (f.size > 500 * 1024 * 1024) {
                        setError("Ukuran file maksimal 500MB");
                        return;
                      }
                      setFile(f);
                    }
                  }}
                />
                <div className="p-4 rounded-full bg-[var(--db-panel)] group-hover:bg-[#FDE3E1] group-hover:scale-110 transition-all duration-300 mb-6 border border-[var(--db-line)]">
                  <Upload className="h-10 w-10 text-[var(--db-gray)] group-hover:text-[#EA4C89] transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-[var(--ink)] group-hover:text-[#C32361] transition-colors">Seret & lepas video ke sini</h3>
                <p className="mt-2 text-sm text-[var(--db-gray)]">atau klik untuk memilih file dari komputer Anda</p>
                <div className="mt-6 px-4 py-2 rounded-full bg-[var(--db-panel)] text-xs font-medium text-[var(--db-gray)] border border-[var(--db-line)]">
                  Mendukung MP4, MOV, MKV, WebM. Maks. 500MB.
                </div>
              </label>
            )}
          </div>
        )}
      </div>

      {/* Pilih Mode Layout */}
      <div className="rounded-2xl glass-panel p-8 space-y-8 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EA4C89] text-white font-black text-lg shadow-[0_8px_20px_-8px_rgba(234,76,137,0.5)]">
            2
          </div>
          <h3 className="text-2xl font-bold text-[var(--ink)]">Pilih Mode Layout</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
          <MotionDiv
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLayoutMode('auto')}
            className={`flex items-start gap-4 p-5 rounded-2xl text-left transition-all glass-card cursor-pointer ${layoutMode === 'auto' ? 'border-[#7C3AED] bg-[#E7E4F9]/50' : 'hover:border-[#7C3AED]/50'}`}
          >
            <div className={`p-4 rounded-xl ${layoutMode === 'auto' ? 'bg-[#E7E4F9] text-[#5B3FBF]' : 'bg-[var(--db-cream)] text-[var(--db-gray)]'}`}>
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <div className="font-bold text-xl mb-1 flex items-center gap-2 text-[var(--ink)]">
                Auto {layoutMode === 'auto' && <span className="text-[#5B3FBF] text-sm">✓</span>}
              </div>
              <p className="text-sm text-[var(--db-gray)] leading-relaxed">AI analisis konten dan pilih layout paling cocok per klip secara cerdas.</p>
            </div>
          </MotionDiv>

          <MotionDiv
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLayoutMode('fit_blur')}
            className={`flex items-start gap-4 p-5 rounded-2xl text-left transition-all glass-card cursor-pointer ${layoutMode === 'fit_blur' ? 'border-[#EA4C89] bg-[#FDE3E1]/40' : 'hover:border-[#EA4C89]/50'}`}
          >
            <div className={`p-4 rounded-xl ${layoutMode === 'fit_blur' ? 'bg-[#FDE3E1] text-[#C32361]' : 'bg-[var(--db-cream)] text-[var(--db-gray)]'}`}>
              <PlaySquare className="h-7 w-7" />
            </div>
            <div>
              <div className="font-bold text-xl mb-2 flex items-center gap-2 text-[var(--ink)] flex-wrap">
                Fit + Blur <span className="text-xs text-[#166534] bg-[#DBF3E8] px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold"><Zap className="h-3 w-3" /> 2x Cepat</span>
              </div>
              <p className="text-sm text-[var(--db-gray)] leading-relaxed">Seluruh frame video terlihat. Area kosong diisi efek latar blur estetik.</p>
            </div>
          </MotionDiv>

          <MotionDiv
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLayoutMode('crop_blur')}
            className={`flex items-start gap-4 p-5 rounded-2xl text-left transition-all glass-card cursor-pointer ${layoutMode === 'crop_blur' ? 'border-[#EA4C89] bg-[#FDE3E1]/40' : 'hover:border-[#EA4C89]/50'}`}
          >
            <div className={`p-4 rounded-xl ${layoutMode === 'crop_blur' ? 'bg-[#FDE3E1] text-[#C32361]' : 'bg-[var(--db-cream)] text-[var(--db-gray)]'}`}>
              <Crop className="h-7 w-7" />
            </div>
            <div>
              <div className="font-bold text-xl mb-2 flex items-center gap-2 text-[var(--ink)] flex-wrap">
                Crop + Blur <span className="text-xs text-[#166534] bg-[#DBF3E8] px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold"><Zap className="h-3 w-3" /> 2x Cepat</span>
              </div>
              <p className="text-sm text-[var(--db-gray)] leading-relaxed">Video dipotong rasio 1:1 di tengah. Area atas/bawah menggunakan latar blur.</p>
            </div>
          </MotionDiv>

          <MotionDiv
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLayoutMode('split')}
            className={`flex items-start gap-4 p-5 rounded-2xl text-left transition-all glass-card cursor-pointer ${layoutMode === 'split' ? 'border-[#EA4C89] bg-[#FDE3E1]/40' : 'hover:border-[#EA4C89]/50'}`}
          >
            <div className={`p-4 rounded-xl ${layoutMode === 'split' ? 'bg-[#FDE3E1] text-[#C32361]' : 'bg-[var(--db-cream)] text-[var(--db-gray)]'}`}>
              <SplitSquareVertical className="h-7 w-7" />
            </div>
            <div>
              <div className="font-bold text-xl mb-1 flex items-center gap-2 text-[var(--ink)]">
                Split Screen
              </div>
              <p className="text-sm text-[var(--db-gray)] leading-relaxed">Layout layar terbelah atas-bawah. Cocok untuk video wawancara/podcast.</p>
            </div>
          </MotionDiv>

          <MotionDiv
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLayoutMode('face')}
            className={`flex items-start gap-4 p-5 rounded-2xl text-left transition-all glass-card cursor-pointer ${layoutMode === 'face' ? 'border-[#EA4C89] bg-[#FDE3E1]/40' : 'hover:border-[#EA4C89]/50'}`}
          >
            <div className={`p-4 rounded-xl ${layoutMode === 'face' ? 'bg-[#FDE3E1] text-[#C32361]' : 'bg-[var(--db-cream)] text-[var(--db-gray)]'}`}>
              <ScanFace className="h-7 w-7" />
            </div>
            <div>
              <div className="font-bold text-xl mb-1 flex items-center gap-2 text-[var(--ink)]">
                Face
              </div>
              <p className="text-sm text-[var(--db-gray)] leading-relaxed">Crop 9:16 mengikuti posisi wajah pembicara.</p>
            </div>
          </MotionDiv>
        </div>
      </div>

      <div className="rounded-2xl glass-panel p-8 space-y-8 relative overflow-hidden">
        <h3 className="text-xl font-bold flex items-center gap-3 text-[var(--ink)]">
          <div className="p-2 bg-[var(--db-cream)] rounded-lg border border-[var(--db-line)]"><Settings2 className="h-5 w-5 text-[var(--db-gray)]" /></div> Pengaturan AI
        </h3>
        
        <div className="grid gap-8 md:grid-cols-2">
          <div className="glass-card p-5 rounded-xl">
            <label className="block text-sm font-bold text-[var(--ink)] mb-3 uppercase tracking-wider">Bahasa Utama</label>
            <select className="w-full rounded-xl border border-transparent bg-[var(--db-cream)] px-4 py-3.5 text-[var(--ink)] font-medium focus:border-[#EA4C89] focus:outline-none focus:ring-1 focus:ring-[#EA4C89] cursor-pointer">
              <option value="id">Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>
          
          <div className="glass-card p-5 rounded-xl">
            <label className="block text-sm font-bold text-[var(--ink)] mb-3 uppercase tracking-wider">Rasio Aspek</label>
            <div className="grid grid-cols-3 gap-2">
              {[['9:16', '9:16 Vertikal'], ['1:1', '1:1 Kotak'], ['4:5', '4:5 Feed']].map(([v, label]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setAspectRatio(v)}
                  className={`p-3 rounded-xl text-sm font-semibold transition-all border ${aspectRatio === v ? 'border-[#EA4C89] bg-[#FDE3E1]/40 text-[#C32361]' : 'border-transparent bg-[var(--db-cream)] text-[var(--ink)] hover:border-[#EA4C89]/50'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-card p-5 rounded-xl">
            <label className="block text-sm font-bold text-[var(--ink)] mb-3 uppercase tracking-wider">Target Durasi Klip</label>
            <select 
              value={targetDuration}
              onChange={(e) => setTargetDuration(e.target.value)}
              className="w-full rounded-xl border border-transparent bg-[var(--db-cream)] px-4 py-3.5 text-[var(--ink)] font-medium focus:border-[#EA4C89] focus:outline-none focus:ring-1 focus:ring-[#EA4C89] cursor-pointer"
            >
              <option value="30-60">30 - 60 Detik</option>
              <option value="61-180">61 - 180 Detik</option>
            </select>
          </div>
          
          <div className="md:col-span-2 glass-card p-6 rounded-xl">
            <label className="block text-sm font-bold text-[var(--ink)] mb-3 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#7C3AED]" /> Model AI
            </label>
            <select 
              value={selectedAiModel}
              onChange={(e) => setSelectedAiModel(e.target.value)}
              className="w-full rounded-xl border border-transparent bg-[var(--db-cream)] px-4 py-3.5 text-[var(--ink)] font-medium focus:border-[#EA4C89] focus:outline-none focus:ring-1 focus:ring-[#EA4C89] cursor-pointer"
            >
              <option value="">Gunakan Default Server (Sesuai Konfigurasi Admin)</option>
              <option value="google-gemini:gemini-1.5-flash">Gemini 1.5 Flash (Google - Sangat Cepat)</option>
              <option value="google-gemini:gemini-1.5-pro">Gemini 1.5 Pro (Google - Paling Pintar)</option>
              <option value="openai:gpt-4o">GPT-4o (OpenAI - Premium)</option>
              <option value="openai:gpt-4o-mini">GPT-4o Mini (OpenAI - Cepat & Efisien)</option>
            </select>
          </div>
          
          <div className="md:col-span-2 glass-card p-6 rounded-xl">
            <label className="block text-sm font-bold text-[var(--ink)] mb-6 flex items-center justify-between uppercase tracking-wider">
              <span>Jumlah Klip Maksimal</span>
              <span className="text-[#C32361] font-black text-lg bg-[#FDE3E1] px-3 py-1 rounded-lg">{clipCount} KLIP</span>
            </label>
            <input 
              type="range" 
              min="1" 
              max="3" 
              value={clipCount} 
              onChange={(e) => setClipCount(parseInt(e.target.value))}
              className="w-full accent-[#EA4C89] cursor-pointer h-2 bg-[var(--db-cream)] rounded-lg appearance-none"
            />
            <div className="flex justify-between text-sm font-medium text-[var(--db-gray)] mt-3 px-1">
              <span>1</span>
              <span>2</span>
              <span>3</span>
            </div>
          </div>

          <div className="md:col-span-2 glass-card p-6 rounded-xl">
            <label className="block text-sm font-bold text-[var(--ink)] mb-3 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#EA4C89]" /> Pencarian Momen Alami (Opsional)
            </label>
            <p className="text-sm text-[var(--db-gray)] mb-4">Cari momen spesifik menggunakan bahasa alami (contoh: "Cari momen lucu saat bermain game", "Cari saat pembicara membahas AI"). Biarkan kosong untuk AI mencari momen terbaik secara umum.</p>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Contoh: Cari penjelasan tentang..." 
              className="w-full relative rounded-xl border border-transparent bg-[var(--db-cream)] px-5 py-4 text-[var(--ink)] placeholder-[#6E6D7A] focus:border-[#EA4C89] focus:outline-none focus:ring-1 focus:ring-[#EA4C89]"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-6">
        <Link href="/dashboard" className="px-8 py-4 rounded-xl font-bold text-[var(--db-gray)] hover:text-[var(--ink)] hover:bg-[var(--db-cream)] transition-all text-center border border-[var(--db-line)]">
          Batal
        </Link>
        <button 
          onClick={handleSubmit}
          disabled={loading}
          className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-black bg-[#EA4C89] hover:bg-[#C32361] text-white transition-all disabled:opacity-50 shadow-[0_8px_24px_-8px_rgba(234,76,137,0.5)]"
        >
          {loading ? (
            <><Loader2 className="h-6 w-6 animate-spin text-white" /> <span>Memproses AI...</span></>
          ) : (
            <><span>Buat Proyek & Analisis</span> <ArrowRight className="h-6 w-6" /></>
          )}
        </button>
      </div>
    </MotionDiv>
  );
}
