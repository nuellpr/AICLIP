"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { CheckCircle2, Loader2, AlertCircle, Video, Download, Edit, Play, Mic } from "lucide-react";
import { CaptionCarousel } from "@/components/CaptionCarousel";
import { PreviewVideo } from "@/components/PreviewVideo";
import { TimelineSlider } from "@/components/TimelineSlider";
import { InteractiveWordEditor } from "@/components/InteractiveWordEditor";
import { CAPTION_PRESETS, CaptionPreset, getDefaultPreset, Word } from "@clipforge/shared";
import { getApiUrl, apiFetch } from "@/lib/api";

export default function ProjectPage() {
  const params = useParams();
  const id = params.id as string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [project, setProject] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [error, setError] = useState("");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [editingClip, setEditingClip] = useState<any>(null);
  const [captionSettings, setCaptionSettings] = useState<CaptionPreset>(getDefaultPreset());
  const [previewWords, setPreviewWords] = useState<Word[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [renderLoadingId, setRenderLoadingId] = useState<string | null>(null);
  const [pollTrigger, setPollTrigger] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (!id) return;

    // Fetch initial project data
    const fetchProgress = async () => {
      try {
        const res = await apiFetch(`/api/projects/${id}/progress`);
        if (res.ok) {
          const data = await res.json();
          setProject(data);

          if (data.status === 'READY' || data.status === 'FAILED') {
            return true;
          }
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (e: any) {
        console.error('Failed to fetch project progress:', e);
      }
      return false;
    };

    fetchProgress();

    // Continuous 3-second live polling
    const pollInterval = setInterval(async () => {
      const isDone = await fetchProgress();
      if (isDone) {
        clearInterval(pollInterval);
      }
    }, 3000);

    let eventSource: EventSource | null = null;
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('clipforge_token') : null;
      const url = getApiUrl(`/api/projects/${id}/stream${token ? `?token=${encodeURIComponent(token)}` : ''}`);
      eventSource = new EventSource(url);
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setProject(data);
          if (data.status === 'READY' || data.status === 'FAILED') {
            clearInterval(pollInterval);
            eventSource?.close();
          }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {}
      };
      eventSource.onerror = () => {
        eventSource?.close();
      };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {}

    return () => {
      clearInterval(pollInterval);
      if (eventSource) eventSource.close();
    };
  }, [id, pollTrigger]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleEditOpen = async (clip: any) => {
    setEditingClip({...clip});
    try {
      let settings = getDefaultPreset();
      if (clip.captionSettings) {
        settings = typeof clip.captionSettings === 'string' ? JSON.parse(clip.captionSettings) : clip.captionSettings;
      } else if (clip.captionPresetId) {
        const found = CAPTION_PRESETS.find(p => p.id === clip.captionPresetId);
        if (found) settings = found;
      }
      setCaptionSettings(settings);
      
      const res = await apiFetch(`/api/clips/${clip.id}/words`);
      if (res.ok) {
        const words = await res.json();
        setPreviewWords(words);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await apiFetch(`/api/clips/${editingClip.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editingClip.title,
          hook: editingClip.hook,
          startTime: editingClip.startTime,
          endTime: editingClip.endTime,
          caption: editingClip.caption,
          captionPresetId: captionSettings.id,
          captionSettings: captionSettings,
          subtitleOffset: captionSettings.subtitleOffset !== undefined ? captionSettings.subtitleOffset : 0.0,
          layoutMode: editingClip.layoutMode
        })
      });
      if (!res.ok) throw new Error("Failed to save");
      setEditingClip(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      alert("Gagal menyimpan perubahan");
    } finally {
      // Re-fetch project to update clip status instantly
      try {
        const pRes = await apiFetch(`/api/projects/${id}/progress`);
        if (pRes.ok) {
          const data = await pRes.json();
          setProject(data);
          setPollTrigger(p => p + 1);
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch(e) {}
      
      setIsSaving(false);
    }
  };

  const handleRender = async (clipId: string) => {
    setRenderLoadingId(clipId);
    try {
      const res = await apiFetch(`/api/clips/${clipId}/render`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error("Failed to trigger render");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      alert("Gagal memicu render");
    } finally {
      // Re-fetch project to update clip status instantly
      try {
        const pRes = await apiFetch(`/api/projects/${id}/progress`);
        if (pRes.ok) {
          const data = await pRes.json();
          setProject(data);
          setPollTrigger(p => p + 1);
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch(e) {}
      
      setRenderLoadingId(null);
    }
  };

  if (!mounted) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  if (error) return <div className="text-red-500 p-8 border border-red-500/20 bg-red-500/10 rounded-2xl">Error: {error}</div>;
  if (!project) return <div className="flex items-center justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  const isCompleted = project.status === 'READY';
  const isFailed = project.status === 'FAILED';

  const stages = [
    { key: 'QUEUED', label: 'Menunggu Antrean' },
    { key: 'DOWNLOADING', label: 'Mengunduh Video' },
    { key: 'EXTRACTING_AUDIO', label: 'Ekstrak Audio' },
    { key: 'TRANSCRIBING', label: 'Transkripsi AI' },
    { key: 'ANALYZING', label: 'Analisis Momen Viral' },
    { key: 'GENERATING_CLIPS', label: 'Membuat Klip' },
    { key: 'COMPLETED', label: 'Selesai' }
  ];

  const rawStageIndex = stages.findIndex(s => s.key === project.currentStage);
  const currentStageIndex = rawStageIndex === -1 && !isCompleted && !isFailed ? 0 : rawStageIndex;

  return (
    <div className="max-w-6xl mx-auto space-y-8 relative">
      <div>
        <h1 className="text-3xl font-bold">Status Proyek</h1>
        <p className="text-gray-400 mt-1">ID: {id}</p>
      </div>

        <div className="bg-[#111] border border-white/10 rounded-xl p-6 force-motion">
          <div className="flex items-center justify-between mb-8 relative pb-6">
            <div className="absolute top-1/2 left-0 right-0 h-1 bg-white/10 -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-0 h-1 bg-primary -translate-y-1/2 z-0 transition-all duration-700 shadow-[0_0_12px_rgba(37,99,235,0.8)] overflow-hidden"
              style={{ width: `${(Math.max(0, currentStageIndex) / (stages.length - 1)) * 100}%` }}
            >
              <div className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent" style={{ animation: 'shimmer 1.1s ease-in-out infinite' }} />
            </div>

          {stages.map((stage, idx) => {
            const isPast = currentStageIndex > idx;
            const isCurrent = currentStageIndex === idx;
            
            let circleClass = "bg-[#222] border-white/20 text-gray-500";
            if (isPast || isCompleted) circleClass = "bg-primary border-primary text-black";
            else if (isCurrent && !isFailed) circleClass = "bg-[#111] border-primary text-primary shadow-[0_0_20px_rgba(37,99,235,0.7)]";
            else if (isCurrent && isFailed) circleClass = "bg-[#111] border-red-500 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.5)]";

            return (
              <div key={stage.key} className="relative z-10 flex flex-col items-center gap-3">
                <div className="relative">
                  {isCurrent && !isFailed && !isCompleted && (
                    <>
                      <div className="absolute -inset-2 rounded-full bg-primary/30 animate-ping" style={{ animationDuration: '1.5s' }} />
                      <div className="absolute -inset-1.5 rounded-full border-[3px] border-primary border-t-transparent animate-spin" style={{ animationDuration: '0.8s' }} />
                    </>
                  )}
                  <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-colors ${circleClass} ${isCurrent && !isFailed && !isCompleted ? 'animate-pulse' : ''}`}>
                    {isPast || isCompleted ? <CheckCircle2 className="w-6 h-6" /> : (isCurrent && !isFailed ? <Loader2 className="w-5 h-5 animate-spin" /> : (isCurrent && isFailed ? <AlertCircle className="w-5 h-5" /> : <div className={`w-3 h-3 rounded-full bg-current ${idx === currentStageIndex + 1 ? 'animate-pulse' : ''}`} />))}
                  </div>
                </div>
                <div className={`absolute top-11 flex flex-col items-center gap-1 whitespace-nowrap transition-colors ${isCurrent ? (isFailed ? 'text-red-500' : 'text-primary') : (isPast || isCompleted ? 'text-white' : 'text-gray-500')}`}>
                  <span className={`text-xs font-medium ${isCurrent && !isFailed && !isCompleted ? 'animate-pulse font-bold' : ''}`}>{stage.label}</span>
                  {isCurrent && !isFailed && !isCompleted && (
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms', animationDuration: '0.9s' }} />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms', animationDuration: '0.9s' }} />
                      <span className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms', animationDuration: '0.9s' }} />
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {isFailed && (
          <div className="mt-12 bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-red-400">
            <strong>Proses gagal:</strong> {project.errorMessage || project.error || "Terjadi kesalahan tidak dikenal."}
          </div>
        )}
        
        {project.errorMessage && !isFailed && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-yellow-400">
            <strong>Peringatan AI:</strong> {project.errorMessage}
          </div>
        )}
      </div>

      {(isCompleted || project.clips?.length > 0) && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">Rekomendasi Klip Viral</h2>
            <span className="bg-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium">Siap Diedit</span>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {project.clips?.map((clip: any, idx: number) => {
              const isRendering = clip.renderStatus === 'QUEUED' || clip.renderStatus === 'RENDERING' || renderLoadingId === clip.id;
              const isReady = clip.renderStatus === 'READY';

              const isErrorClip = clip.title?.startsWith?.('Gagal:') || clip.reason?.startsWith?.('Error:') || clip.reason?.startsWith?.('AI gagal:');

              return (
                <div key={idx} className={`flex flex-col rounded-xl border overflow-hidden transition-colors ${isErrorClip ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-white/10 bg-white/5 hover:border-primary/50'}`}>
                  <div className="aspect-[9/16] bg-black relative flex items-center justify-center">
                    {isReady && clip.renderedFileKey ? (
                      <video src={clip.renderedFileKey} controls className="w-full h-full object-cover" />
                    ) : isRendering ? (
                      <div className="force-motion relative flex flex-col items-center justify-center w-full h-full overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950/50 to-slate-950">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 via-purple-500/15 to-blue-500/20 animate-pulse"></div>
                        <div className="absolute inset-0 opacity-[0.12] animate-[grid-drift_2.5s_linear_infinite]" style={{ backgroundImage: 'linear-gradient(rgba(59,130,246,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.4) 1px, transparent 1px)', backgroundSize: '32px 32px' }}></div>
                        <div className="absolute left-0 right-0 h-14 animate-[scan-y_2.4s_ease-in-out_infinite] bg-gradient-to-b from-transparent via-blue-400/25 to-transparent"></div>
                        <div className="absolute top-3 left-3 w-6 h-6 border-t-2 border-l-2 border-blue-400/80 rounded-sm animate-pulse"></div>
                        <div className="absolute top-3 right-3 w-6 h-6 border-t-2 border-r-2 border-blue-400/80 rounded-sm animate-pulse [animation-delay:300ms]"></div>
                        <div className="absolute bottom-3 left-3 w-6 h-6 border-b-2 border-l-2 border-blue-400/80 rounded-sm animate-pulse [animation-delay:600ms]"></div>
                        <div className="absolute bottom-3 right-3 w-6 h-6 border-b-2 border-r-2 border-blue-400/80 rounded-sm animate-pulse [animation-delay:900ms]"></div>
                        <div className="absolute bottom-10 left-[15%] w-1 h-1 rounded-full bg-blue-300/80 animate-[float-up_2.6s_ease-out_infinite]"></div>
                        <div className="absolute bottom-10 left-[32%] w-1.5 h-1.5 rounded-full bg-purple-300/70 animate-[float-up_2.6s_ease-out_infinite] [animation-delay:500ms]"></div>
                        <div className="absolute bottom-10 left-[52%] w-1 h-1 rounded-full bg-blue-200/70 animate-[float-up_2.6s_ease-out_infinite] [animation-delay:1s]"></div>
                        <div className="absolute bottom-10 left-[70%] w-1.5 h-1.5 rounded-full bg-purple-300/60 animate-[float-up_2.6s_ease-out_infinite] [animation-delay:1.5s]"></div>
                        <div className="absolute bottom-10 left-[85%] w-1 h-1 rounded-full bg-blue-300/70 animate-[float-up_2.6s_ease-out_infinite] [animation-delay:2s]"></div>
                        <div className="relative flex flex-col items-center gap-4">
                          <div className="relative w-20 h-20">
                            <div className="absolute inset-0 rounded-full bg-blue-500/30 blur-xl animate-pulse"></div>
                            <div className="absolute inset-0 rounded-full overflow-hidden animate-[spin_1.2s_linear_infinite]">
                              <div className="w-full h-full" style={{ background: 'conic-gradient(from 0deg, rgba(59,130,246,0) 0%, rgba(59,130,246,0.15) 45%, rgba(147,197,253,0.95) 100%)' }}></div>
                            </div>
                            <div className="absolute inset-[3px] rounded-full bg-slate-950 border border-blue-500/30 flex items-center justify-center">
                              <Loader2 className="h-6 w-6 text-blue-400 animate-spin" />
                            </div>
                          </div>
                          <div className="text-blue-300 text-xs font-bold tracking-[0.3em] uppercase drop-shadow-[0_0_8px_rgba(59,130,246,0.6)]">
                            Rendering<span className="animate-[dot-blink_1.4s_ease-in-out_infinite]">.</span><span className="animate-[dot-blink_1.4s_ease-in-out_infinite] [animation-delay:200ms]">.</span><span className="animate-[dot-blink_1.4s_ease-in-out_infinite] [animation-delay:400ms]">.</span>
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-500/10">
                          <div className="h-full w-1/4 bg-gradient-to-r from-transparent via-blue-400 to-purple-400 animate-[indeterminate_1.4s_ease-in-out_infinite]"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        {isErrorClip ? <AlertCircle className="h-12 w-12 text-yellow-500" /> : <Video className="h-12 w-12 text-white/20" />}
                        {isErrorClip && <span className="text-yellow-500 text-xs font-bold">AI ERROR</span>}
                      </div>
                    )}
                    <div className={`absolute top-2 right-2 backdrop-blur-md px-2 py-1 rounded-md text-xs font-bold border ${isErrorClip ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' : 'bg-black/60 text-primary/80 border-white/10'}`}>
                      Score: {clip.viralScore}
                    </div>
                    <div className="absolute bottom-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-xs font-medium text-white border border-white/10">
                      {clip.startTime}s - {clip.endTime}s
                    </div>
                  </div>
                  
                  <div className="p-4 flex flex-col flex-1">
                    <h3 className={`font-bold text-lg leading-tight mb-2 ${isErrorClip ? 'text-yellow-400' : ''}`}>{clip.title}</h3>
                    <p className={`text-sm line-clamp-2 mb-4 flex-1 ${isErrorClip ? 'text-yellow-500/70' : 'text-gray-400'}`}>"{clip.hook}"</p>
                    
                    <div className="flex items-center gap-2 mt-auto">
                      <button 
                        onClick={() => handleEditOpen(clip)}
                        disabled={isRendering || isReady}
                        className="flex-1 flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        <Edit className="h-4 w-4" /> Edit
                      </button>
                      
                      {isReady ? (
                        <a 
                          href={clip.renderedFileKey?.startsWith('http') ? clip.renderedFileKey : getApiUrl(`/renders/${encodeURIComponent((clip.title || 'clip').replace(/[^a-zA-Z0-9 ]/g, "").trim() || clip.id)}.mp4`)} 
                          download={`${(clip.title || 'clip').replace(/[^a-zA-Z0-9_-]/g, '_')}.mp4`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-black rounded-lg py-2 text-sm font-medium transition-colors"
                        >
                          <Download className="h-4 w-4" /> Unduh
                        </a>
                      ) : (
                        <button 
                          onClick={() => handleRender(clip.id)}
                          disabled={isRendering}
                          className="flex-1 flex items-center justify-center gap-2 bg-primary hover:bg-primary/80 text-black rounded-lg py-2 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          {isRendering ? (
                            <><Loader2 className="h-4 w-4 animate-spin" /> Render...</>
                          ) : (
                            <><Play className="h-4 w-4" /> Render</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingClip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#111] border border-white/10 rounded-2xl p-4 sm:p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto flex flex-col lg:flex-row gap-6 lg:gap-8">
            
            {/* Left Side: Video Preview */}
            <div className="w-full lg:w-[320px] shrink-0 flex justify-center">
              <PreviewVideo 
                videoSrc={project.sourceUrl}
                previewWords={previewWords}
                captionSettings={captionSettings}
                startTime={editingClip.startTime}
                endTime={editingClip.endTime}
              />
            </div>

            {/* Right Side: Edit Form */}
            <div className="flex-1 flex flex-col min-h-0 overflow-y-auto pr-2">
              <h2 className="text-2xl font-bold mb-6">Edit Klip</h2>
              
              <div className="space-y-6">
                {/* Presets Carousel */}
                <CaptionCarousel 
                  selectedId={captionSettings.id}
                  onSelect={(preset) => setCaptionSettings({...preset, fontWeight: 900})}
                />

                {/* Subtitle Color Customizer */}
                <div className="rounded-xl border border-white/10 bg-white/5 p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-primary/80 uppercase tracking-wider">Kustomisasi Warna Subtitle</h4>
                    <span className="text-[10px] font-extrabold bg-primary/20 text-primary/80 px-2 py-0.5 rounded-full border border-primary/30">TEBAL (BOLD)</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Warna Sorotan Kata (Active Word) */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">Warna Kata Sorotan (Aktif)</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={captionSettings.activeWordColor || '#FFE600'}
                          onChange={e => setCaptionSettings({...captionSettings, activeWordColor: e.target.value, fontWeight: 900})}
                          className="h-9 w-12 rounded-lg bg-black border border-white/20 cursor-pointer p-0.5 shrink-0"
                        />
                        <input 
                          type="text" 
                          value={captionSettings.activeWordColor || '#FFE600'}
                          onChange={e => setCaptionSettings({...captionSettings, activeWordColor: e.target.value, fontWeight: 900})}
                          className="flex-1 bg-black border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-mono"
                        />
                      </div>
                    </div>

                    {/* Warna Teks Utama (Text Color) */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">Warna Teks Utama</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={captionSettings.textColor || '#FFFFFF'}
                          onChange={e => setCaptionSettings({...captionSettings, textColor: e.target.value, fontWeight: 900})}
                          className="h-9 w-12 rounded-lg bg-black border border-white/20 cursor-pointer p-0.5 shrink-0"
                        />
                        <input 
                          type="text" 
                          value={captionSettings.textColor || '#FFFFFF'}
                          onChange={e => setCaptionSettings({...captionSettings, textColor: e.target.value, fontWeight: 900})}
                          className="flex-1 bg-black border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-mono"
                        />
                      </div>
                    </div>

                    {/* Warna Outline / Stroke */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">Warna Garis Tepi (Stroke)</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={captionSettings.strokeColor === 'transparent' ? '#000000' : (captionSettings.strokeColor || '#000000')}
                          onChange={e => setCaptionSettings({...captionSettings, strokeColor: e.target.value, fontWeight: 900})}
                          className="h-9 w-12 rounded-lg bg-black border border-white/20 cursor-pointer p-0.5 shrink-0"
                        />
                        <input 
                          type="text" 
                          value={captionSettings.strokeColor || '#000000'}
                          onChange={e => setCaptionSettings({...captionSettings, strokeColor: e.target.value, fontWeight: 900})}
                          className="flex-1 bg-black border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white uppercase font-mono"
                        />
                      </div>
                    </div>

                    {/* Warna Latar Belakang / Box */}
                    <div>
                      <label className="block text-xs font-semibold text-gray-300 mb-1.5">Warna Latar Kotak (Box BG)</label>
                      <div className="flex items-center gap-2">
                        <input 
                          type="color" 
                          value={captionSettings.backgroundColor && captionSettings.backgroundColor !== 'transparent' ? (captionSettings.backgroundColor.startsWith('#') ? captionSettings.backgroundColor : '#000000') : '#000000'}
                          onChange={e => setCaptionSettings({...captionSettings, backgroundColor: e.target.value, fontWeight: 900})}
                          className="h-9 w-12 rounded-lg bg-black border border-white/20 cursor-pointer p-0.5 shrink-0"
                        />
                        <button
                          type="button"
                          onClick={() => setCaptionSettings({
                            ...captionSettings, 
                            backgroundColor: captionSettings.backgroundColor === 'transparent' || !captionSettings.backgroundColor ? 'rgba(0,0,0,0.75)' : 'transparent',
                            fontWeight: 900
                          })}
                          className="flex-1 bg-white/10 hover:bg-white/20 text-white rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors"
                        >
                          {captionSettings.backgroundColor === 'transparent' || !captionSettings.backgroundColor ? 'Aktifkan Box' : 'Nonaktifkan Box'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Palet Warna Cepat Populer */}
                  <div className="pt-1">
                    <p className="text-[11px] text-gray-400 mb-1.5 font-medium">Palet Warna Cepat:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: 'Kuning Hormozi', active: '#FFE600', text: '#FFFFFF', stroke: '#000000' },
                        { name: 'Cyan Neon', active: '#00E5FF', text: '#FFFFFF', stroke: '#000000' },
                        { name: 'Magenta Viral', active: '#FF007F', text: '#FFFFFF', stroke: '#000000' },
                        { name: 'Hijau Lemon', active: '#00FF66', text: '#FFFFFF', stroke: '#000000' },
                        { name: 'Oranye Api', active: '#FF6B00', text: '#FFFFFF', stroke: '#000000' },
                      ].map((p, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setCaptionSettings({
                            ...captionSettings,
                            activeWordColor: p.active,
                            textColor: p.text,
                            strokeColor: p.stroke,
                            fontWeight: 900
                          })}
                          className="flex items-center gap-1.5 bg-black/60 hover:bg-black px-2.5 py-1 rounded-lg border border-white/15 text-xs font-bold text-white transition-all hover:scale-105"
                        >
                          <span className="h-3 w-3 rounded-full border border-white/30 shrink-0" style={{ backgroundColor: p.active }} />
                          <span>{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t border-white/10 pt-4">
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-400 mb-1">Judul Klip</label>
                      <input 
                        type="text" 
                        value={editingClip.title}
                        onChange={e => setEditingClip({...editingClip, title: e.target.value})}
                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm text-gray-400 mb-1">Offset (detik)</label>
                      <input 
                        type="number"
                        step="0.05"
                        min="-2"
                        max="2"
                        value={captionSettings.subtitleOffset !== undefined ? captionSettings.subtitleOffset : 0.0}
                        onChange={e => setCaptionSettings({...captionSettings, subtitleOffset: parseFloat(e.target.value)})}
                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block text-sm text-gray-400 mb-1">Mode Layout</label>
                      <select 
                        value={editingClip.layoutMode || 'fit_blur'}
                        onChange={e => setEditingClip({...editingClip, layoutMode: e.target.value})}
                        className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none"
                      >
                        <option value="fit_blur">Fit Penuh + Blur</option>
                        <option value="crop_blur">Crop 1:1 + Blur</option>
                        <option value="split">Split (Atas & Bawah)</option>
                        <option value="gameplay">Gameplay (Game & Wajah)</option>
                        <option value="face">Face (Fokus Wajah 9:16)</option>
                      </select>
                    </div>
                  </div>

                  {/* Interactive Word-by-Word Editor */}
                  <InteractiveWordEditor
                    clipId={editingClip.id}
                    words={previewWords}
                    onWordsChange={(updatedWords) => {
                      setPreviewWords(updatedWords);
                      const newCaption = updatedWords.map(w => w.text).join(' ');
                      setEditingClip({ ...editingClip, caption: newCaption });
                    }}
                  />

                  <div className="mb-4">
                    <label className="block text-sm text-gray-400 mb-2 font-medium">Trim Klip (Timeline)</label>
                    <TimelineSlider
                      min={Math.max(0, editingClip.startTime - 60)}
                      max={editingClip.endTime + 60}
                      startTime={editingClip.startTime}
                      endTime={editingClip.endTime}
                      onChange={(start, end) => setEditingClip({ ...editingClip, startTime: start, endTime: end })}
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-sm text-gray-400">Teks Subtitle Lengkap</label>
                      <button
                        type="button"
                        disabled={isTranscribing}
                        onClick={async () => {
                          setIsTranscribing(true);
                          try {
                            const res = await apiFetch(`/api/clips/${editingClip.id}/retranscribe`, { method: 'POST' });
                            if (!res.ok) {
                              const err = await res.json();
                              alert('Gagal transkripsi: ' + (err.error || 'Unknown error'));
                              return;
                            }
                            const data = await res.json();
                            setEditingClip({...editingClip, caption: data.caption});
                            alert('Transkripsi Whisper berhasil. Caption diperbarui.');
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          } catch (e: any) {
                            alert('Error: ' + e.message);
                          } finally {
                            setIsTranscribing(false);
                          }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-secondary hover:bg-secondary/80 text-white transition-all disabled:opacity-50"
                      >
                        {isTranscribing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Mic className="h-3 w-3" />}
                        {isTranscribing ? 'Mentranskripsi...' : 'Transkripsi Ulang (Whisper)'}
                      </button>
                    </div>
                    <textarea 
                      value={editingClip.caption}
                      onChange={e => setEditingClip({...editingClip, caption: e.target.value})}
                      className="w-full bg-black border border-white/10 rounded-lg px-3 py-2 text-white focus:border-primary focus:outline-none text-sm"
                      rows={3}
                    />
                    <p className="text-[10px] text-gray-500 mt-1">Klik &quot;Transkripsi Ulang&quot; jika kata-kata subtitle tidak sesuai ucapan. Whisper akan mengenali ulang ucapan asli dari audio video.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-white/10 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setEditingClip(null)}
                  className="px-4 py-2 rounded-lg font-medium text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="button"
                  onClick={handleEditSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-6 py-2 rounded-lg font-medium bg-primary text-black hover:bg-primary/80 transition-colors disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Simpan Klip
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
