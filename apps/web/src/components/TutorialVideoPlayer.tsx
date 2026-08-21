"use client";

import React, { useState, useRef } from "react";
import { Play, Pause, Volume2, VolumeX, Maximize, Sparkles, CheckCircle2 } from "lucide-react";

export function TutorialVideoPlayer() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      const p = videoRef.current.play();
      if (p !== undefined) {
        p.then(() => setIsPlaying(true)).catch(() => {});
      }
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    videoRef.current.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const current = videoRef.current.currentTime;
    const duration = videoRef.current.duration || 1;
    setProgress((current / duration) * 100);
  };

  const handleEnded = () => {
    setIsPlaying(false);
  };

  const handleFullscreen = () => {
    if (!videoRef.current) return;
    if (videoRef.current.requestFullscreen) {
      videoRef.current.requestFullscreen();
    }
  };

  return (
    <div className="mt-16 mx-auto max-w-5xl rounded-3xl border border-white/15 bg-white/5 p-3 sm:p-4 shadow-[0_0_60px_rgba(6,182,212,0.2)] backdrop-blur-2xl relative group">
      {/* Container aspect-video or height */}
      <div className="relative aspect-video w-full rounded-2xl bg-[#08080e] border border-white/10 overflow-hidden flex items-center justify-center shadow-inner">
        {/* Video Element */}
        <video
          ref={videoRef}
          className="w-full h-full object-contain cursor-pointer"
          onClick={togglePlay}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          playsInline
          preload="metadata"
        >
          <source src="/tutorial.mp4" type="video/mp4" />
        </video>

        {/* Ambient Gradient Glow overlay when paused */}
        {!isPlaying && (
          <div 
            onClick={togglePlay}
            className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 hover:bg-black/50"
          >
            <div className="flex h-20 w-20 sm:h-24 sm:w-24 items-center justify-center rounded-full bg-gradient-to-tr from-cyan-500 to-purple-600 text-black shadow-[0_0_40px_rgba(6,182,212,0.7)] group-hover:scale-110 transition-transform">
              <Play className="h-10 w-10 sm:h-12 sm:w-12 fill-current ml-1" />
            </div>

            <div className="mt-6 text-center">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles className="h-3.5 w-3.5" /> Demo Video Tutorial ClipForge AI
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-white tracking-wide">
                Lihat Cara Kerja AI Memotong & Mengatur Subtitle
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-md mx-auto">
                Klik untuk memutar pratinjau hasil render video klip 9:16 ber subtitle animasi kata.
              </p>
            </div>
          </div>
        )}

        {/* Floating Custom Control Overlay Bar */}
        <div className={`absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent transition-opacity duration-300 ${isPlaying ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
          {/* Progress Bar */}
          <div className="w-full bg-white/20 h-1.5 rounded-full overflow-hidden mb-3 cursor-pointer">
            <div 
              className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full transition-all duration-150"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button 
                onClick={togglePlay} 
                className="h-9 w-9 rounded-xl bg-white/10 hover:bg-cyan-500 text-white hover:text-black flex items-center justify-center transition-colors"
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current ml-0.5" />}
              </button>

              <button 
                onClick={toggleMute}
                className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                {isMuted ? <VolumeX className="h-5 w-5 text-red-400" /> : <Volume2 className="h-5 w-5 text-cyan-400" />}
              </button>

              <span className="text-xs font-bold text-gray-300 hidden sm:inline-block">
                Tutorial Pratinjau Klip AI 9:16
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full border border-green-500/30 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> FULL HD 1080P
              </span>
              <button 
                onClick={handleFullscreen}
                className="h-9 w-9 rounded-xl bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                title="Layar Penuh"
              >
                <Maximize className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
