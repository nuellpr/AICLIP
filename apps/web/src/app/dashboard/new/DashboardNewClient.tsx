"use client";

import { useState } from "react";
import { Upload, Link as LinkIcon, Settings2, ArrowRight, Loader2, Sparkles, PlaySquare, Crop, SplitSquareVertical, Gamepad2, User, Zap, ScanFace } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MotionDiv, MotionButton } from "@/components/Motion";
import { getApiUrl } from "@/lib/api";

export default function NewProjectPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [layoutMode, setLayoutMode] = useState("crop_blur");
  const [clipCount, setClipCount] = useState(5);
  const [targetDuration, setTargetDuration] = useState("30-60");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAiModel, setSelectedAiModel] = useState("");
  
  const handleSubmit = async () => {
    if (activeTab === 'url' && !url) {
      setError("Masukkan URL video terlebih dahulu");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('clipforge_user') || '{}') : null;
      const res = await fetch(getApiUrl("/api/projects"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Proyek dari URL",
          sourceType: "URL",
          sourceUrl: url,
          layoutMode: layoutMode,
          clipCount: clipCount,
          targetDuration: targetDuration,
          searchQuery: searchQuery,
          aiProvider: selectedAiModel ? selectedAiModel.split(':')[0] : null,
          aiModel: selectedAiModel ? selectedAiModel.split(':')[1] : null,
          userId: currentUser?.id,
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat proyek");
      }

      router.push(`/dashboard/project/${data.projectId || data.id}`);
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
        <h1 className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">Proyek Baru</h1>
        <p className="text-gray-400 mt-2 text-lg">Pilih sumber video untuk memulai ekstraksi klip viral Anda.</p>
      </div>

      {error && (
        <MotionDiv initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-red-500/10 border border-red-500/50 text-red-400 px-5 py-4 rounded-xl shadow-[0_0_15px_rgba(248,113,113,0.2)]">
          {error}
        </MotionDiv>
      )}

      <div className="flex gap-4 border-b border-white/5 pb-px relative">
        <button 
          onClick={() => setActiveTab('url')}
          className={`flex items-center gap-2 px-6 py-4 font-bold transition-all border-b-2 relative ${activeTab === 'url' ? 'border-cyan-500 text-cyan-400 shadow-[0_4px_20px_-10px_rgba(6,182,212,0.8)]' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5 rounded-t-xl'}`}
        >
          <LinkIcon className="h-5 w-5" />
          Gunakan URL Video
        </button>
        <button 
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-6 py-4 font-bold transition-all border-b-2 relative ${activeTab === 'upload' ? 'border-cyan-500 text-cyan-400 shadow-[0_4px_20px_-10px_rgba(6,182,212,0.8)]' : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5 rounded-t-xl'}`}
        >
          <Upload className="h-5 w-5" />
          Unggah File
        </button>
      </div>

      <div className="rounded-2xl glass-panel p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none -mr-32 -mt-32"></div>
        {activeTab === 'url' ? (
          <div className="space-y-6 relative z-10">
            <div>
              <label className="block text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">URL Video (YouTube, TikTok, dll)</label>
              <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-xl blur-[2px] opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
                <input 
                  type="text" 
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..." 
                  className="w-full relative rounded-xl border-none bg-black/80 px-5 py-4 text-white placeholder-gray-500 focus:outline-none focus:ring-0 shadow-inner"
                />
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <input type="checkbox" id="rights" className="w-5 h-5 rounded border-white/10 bg-black/50 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-gray-900 cursor-pointer" />
              <label htmlFor="rights" className="text-sm text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">Saya menyatakan memiliki hak atau izin untuk memproses video ini.</label>
            </div>
          </div>
        ) : (
          <div className="space-y-6 relative z-10">
            <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-black/30 p-16 text-center hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all cursor-pointer group">
              <div className="p-4 rounded-full bg-white/5 group-hover:bg-cyan-500/20 group-hover:scale-110 transition-all duration-300 mb-6">
                <Upload className="h-10 w-10 text-gray-400 group-hover:text-cyan-400 transition-colors" />
              </div>
              <h3 className="text-xl font-bold text-white group-hover:text-cyan-100 transition-colors">Seret & lepas video ke sini</h3>
              <p className="mt-2 text-sm text-gray-400">atau klik untuk memilih file dari komputer Anda</p>
              <div className="mt-6 px-4 py-2 rounded-full bg-white/5 text-xs font-medium text-gray-400 border border-white/10">
                Mendukung MP4, MOV, MKV, WebM. Maks. 500MB.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pilih Mode Layout */}
      <div className="rounded-2xl glass-panel p-8 space-y-8 relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 text-black font-black text-lg shadow-[0_0_15px_rgba(249,115,22,0.4)]">
            2
          </div>
          <h3 className="text-2xl font-bold">Pilih Mode Layout</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
          <MotionDiv
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLayoutMode('auto')}
            className={`flex items-start gap-4 p-5 rounded-2xl text-left transition-all glass-card cursor-pointer ${layoutMode === 'auto' ? 'border-purple-500 bg-purple-500/10 shadow-[0_0_20px_rgba(168,85,247,0.2)]' : 'hover:border-purple-500/50'}`}
          >
            <div className={`p-4 rounded-xl ${layoutMode === 'auto' ? 'bg-purple-500/20 text-purple-400 shadow-inner' : 'bg-black/50 text-gray-400 border border-white/5'}`}>
              <Sparkles className="h-7 w-7" />
            </div>
            <div>
              <div className="font-bold text-xl mb-1 flex items-center gap-2 text-white">
                Auto {layoutMode === 'auto' && <span className="text-purple-400 text-sm">✓</span>}
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">AI analisis konten dan pilih layout paling cocok per klip secara cerdas.</p>
            </div>
          </MotionDiv>

          <MotionDiv
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLayoutMode('fit_blur')}
            className={`flex items-start gap-4 p-5 rounded-2xl text-left transition-all glass-card cursor-pointer ${layoutMode === 'fit_blur' ? 'border-cyan-500 bg-cyan-500/10 shadow-[0_0_20px_rgba(6,182,212,0.2)]' : 'hover:border-cyan-500/50'}`}
          >
            <div className={`p-4 rounded-xl ${layoutMode === 'fit_blur' ? 'bg-cyan-500/20 text-cyan-400 shadow-inner' : 'bg-black/50 text-gray-400 border border-white/5'}`}>
              <PlaySquare className="h-7 w-7" />
            </div>
            <div>
              <div className="font-bold text-xl mb-2 flex items-center gap-2 text-white flex-wrap">
                Fit + Blur <span className="text-xs text-green-900 bg-green-400 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold"><Zap className="h-3 w-3" /> 2x Cepat</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">Seluruh frame video terlihat. Area kosong diisi efek latar blur estetik.</p>
            </div>
          </MotionDiv>

          <MotionDiv
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLayoutMode('crop_blur')}
            className={`flex items-start gap-4 p-5 rounded-2xl text-left transition-all glass-card cursor-pointer ${layoutMode === 'crop_blur' ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'hover:border-blue-500/50'}`}
          >
            <div className={`p-4 rounded-xl ${layoutMode === 'crop_blur' ? 'bg-blue-500/20 text-blue-400 shadow-inner' : 'bg-black/50 text-gray-400 border border-white/5'}`}>
              <Crop className="h-7 w-7" />
            </div>
            <div>
              <div className="font-bold text-xl mb-2 flex items-center gap-2 text-white flex-wrap">
                Crop + Blur <span className="text-xs text-green-900 bg-green-400 px-2.5 py-0.5 rounded-full flex items-center gap-1 font-bold"><Zap className="h-3 w-3" /> 2x Cepat</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">Video dipotong rasio 1:1 di tengah. Area atas/bawah menggunakan latar blur.</p>
            </div>
          </MotionDiv>

          <MotionDiv
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLayoutMode('split')}
            className={`flex items-start gap-4 p-5 rounded-2xl text-left transition-all glass-card cursor-pointer ${layoutMode === 'split' ? 'border-pink-500 bg-pink-500/10 shadow-[0_0_20px_rgba(236,72,153,0.2)]' : 'hover:border-pink-500/50'}`}
          >
            <div className={`p-4 rounded-xl ${layoutMode === 'split' ? 'bg-pink-500/20 text-pink-400 shadow-inner' : 'bg-black/50 text-gray-400 border border-white/5'}`}>
              <SplitSquareVertical className="h-7 w-7" />
            </div>
            <div>
              <div className="font-bold text-xl mb-1 flex items-center gap-2 text-white">
                Split Screen
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">Layout layar terbelah atas-bawah. Cocok untuk video wawancara/podcast.</p>
            </div>
          </MotionDiv>

          <MotionDiv
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setLayoutMode('face')}
            className={`flex items-start gap-4 p-5 rounded-2xl text-left transition-all glass-card cursor-pointer ${layoutMode === 'face' ? 'border-rose-500 bg-rose-500/10 shadow-[0_0_20px_rgba(244,63,94,0.2)]' : 'hover:border-rose-500/50'}`}
          >
            <div className={`p-4 rounded-xl ${layoutMode === 'face' ? 'bg-rose-500/20 text-rose-400 shadow-inner' : 'bg-black/50 text-gray-400 border border-white/5'}`}>
              <ScanFace className="h-7 w-7" />
            </div>
            <div>
              <div className="font-bold text-xl mb-1 flex items-center gap-2 text-white">
                Face
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">Crop 9:16 mengikuti posisi wajah pembicara.</p>
            </div>
          </MotionDiv>
        </div>
      </div>

      <div className="rounded-2xl glass-panel p-8 space-y-8 relative overflow-hidden">
        <h3 className="text-xl font-bold flex items-center gap-3 text-white">
          <div className="p-2 bg-white/10 rounded-lg border border-white/5"><Settings2 className="h-5 w-5 text-gray-300" /></div> Pengaturan AI
        </h3>
        
        <div className="grid gap-8 md:grid-cols-2">
          <div className="glass-card p-5 rounded-xl border border-white/5">
            <label className="block text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Bahasa Utama</label>
            <select className="w-full rounded-xl border border-white/10 bg-black/80 px-4 py-3.5 text-white font-medium focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer">
              <option value="id">🇮🇩 Indonesia</option>
              <option value="en">🇺🇸 English</option>
            </select>
          </div>
          
          <div className="glass-card p-5 rounded-xl border border-white/5">
            <label className="block text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider">Target Durasi Klip</label>
            <select 
              value={targetDuration}
              onChange={(e) => setTargetDuration(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/80 px-4 py-3.5 text-white font-medium focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="30-60">🔥 30 - 60 Detik</option>
              <option value="61-180">🎬 61 - 180 Detik</option>
            </select>
          </div>
          
          <div className="md:col-span-2 glass-card p-6 rounded-xl border border-white/5">
            <label className="block text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-purple-400" /> Model AI
            </label>
            <select 
              value={selectedAiModel}
              onChange={(e) => setSelectedAiModel(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-black/80 px-4 py-3.5 text-white font-medium focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              <option value="">⚙️ Gunakan Default Server (Sesuai Konfigurasi Admin)</option>
              <option value="google-gemini:gemini-1.5-flash">⚡ Gemini 1.5 Flash (Google - Sangat Cepat)</option>
              <option value="google-gemini:gemini-1.5-pro">🧠 Gemini 1.5 Pro (Google - Paling Pintar)</option>
              <option value="openai:gpt-4o">🌟 GPT-4o (OpenAI - Premium)</option>
              <option value="openai:gpt-4o-mini">🚀 GPT-4o Mini (OpenAI - Cepat & Efisien)</option>
            </select>
          </div>
          
          <div className="md:col-span-2 glass-card p-6 rounded-xl border border-white/5">
            <label className="block text-sm font-bold text-gray-300 mb-6 flex items-center justify-between uppercase tracking-wider">
              <span>Jumlah Klip Maksimal</span>
              <span className="text-cyan-400 font-black text-lg bg-cyan-400/10 px-3 py-1 rounded-lg border border-cyan-400/20">{clipCount} KLIP</span>
            </label>
            <input 
              type="range" 
              min="1" 
              max="10" 
              value={clipCount} 
              onChange={(e) => setClipCount(parseInt(e.target.value))}
              className="w-full accent-cyan-500 cursor-pointer h-2 bg-white/10 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-sm font-medium text-gray-500 mt-3 px-1">
              <span>1</span>
              <span>5</span>
              <span>10</span>
            </div>
          </div>

          <div className="md:col-span-2 glass-card p-6 rounded-xl border border-white/5">
            <label className="block text-sm font-bold text-gray-300 mb-3 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-cyan-400" /> Pencarian Momen Alami (Opsional)
            </label>
            <p className="text-sm text-gray-400 mb-4">Cari momen spesifik menggunakan bahasa alami (contoh: "Cari momen lucu saat bermain game", "Cari saat pembicara membahas AI"). Biarkan kosong untuk AI mencari momen terbaik secara umum.</p>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Contoh: Cari penjelasan tentang..." 
              className="w-full relative rounded-xl border border-white/10 bg-black/80 px-5 py-4 text-white placeholder-gray-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500 shadow-inner"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row justify-end gap-4 pt-6">
        <Link href="/dashboard" className="px-8 py-4 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/5 transition-all text-center">
          Batal
        </Link>
        <div className="gradient-border group">
          <button 
            onClick={handleSubmit}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl font-black bg-black text-white hover:bg-transparent transition-all disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="h-6 w-6 animate-spin text-cyan-400" /> <span className="text-cyan-400">Memproses AI...</span></>
            ) : (
              <><span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 group-hover:text-white transition-colors">Buat Proyek & Analisis</span> <ArrowRight className="h-6 w-6 text-purple-400 group-hover:text-white transition-colors" /></>
            )}
          </button>
        </div>
      </div>
    </MotionDiv>
  );
}
