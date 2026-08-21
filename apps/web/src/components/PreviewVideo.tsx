import React, { useEffect, useRef, useState } from 'react';
import { Word, CaptionPreset } from '@clipforge/shared';

interface PreviewVideoProps {
  videoSrc: string;
  previewWords: Word[];
  captionSettings: CaptionPreset;
  startTime: number;
  endTime: number;
}

export function PreviewVideo({ videoSrc, previewWords, captionSettings, startTime, endTime }: PreviewVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [activeWords, setActiveWords] = useState<{word: Word, isActive: boolean, isSpoken: boolean}[]>([]);
  
  useEffect(() => {
    let animationFrameId: number;
    
    const updateCaptions = () => {
      if (!videoRef.current || captionSettings.id === 'no-caption') {
        animationFrameId = requestAnimationFrame(updateCaptions);
        return;
      }
      
      const currentTime = videoRef.current.currentTime;
      const offset = captionSettings.subtitleOffset || -0.20;
      const adjustedTime = currentTime + offset;
      
      // We only show words that are within the current "chunk".
      // To simulate chunking (since we don't have the backend chunker here), 
      // we find the active word, and show it along with its surrounding words based on wordsPerCaption.
      
      const activeWordIndex = previewWords.findIndex(w => adjustedTime >= w.start && adjustedTime < w.end);
      
      if (activeWordIndex !== -1) {
        // Find chunk boundaries
        const wordsPerCaption = captionSettings.wordsPerCaption || 4;
        const chunkStartIndex = Math.floor(activeWordIndex / wordsPerCaption) * wordsPerCaption;
        const chunkWords = previewWords.slice(chunkStartIndex, chunkStartIndex + wordsPerCaption);
        
        const displayWords = chunkWords.map((w, idx) => ({
          word: w,
          isActive: (chunkStartIndex + idx) === activeWordIndex,
          isSpoken: (chunkStartIndex + idx) < activeWordIndex
        }));
        
        setActiveWords(displayWords);
      } else {
        // If between words, maybe show the last chunk if within 0.5s
        setActiveWords([]);
      }
      
      animationFrameId = requestAnimationFrame(updateCaptions);
    };
    
    animationFrameId = requestAnimationFrame(updateCaptions);
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [previewWords, captionSettings]);

  // Handle loop
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    
    const handleTimeUpdate = () => {
      if (video.currentTime >= endTime) {
        video.currentTime = startTime;
        const p = video.play();
        if (p !== undefined) p.catch(() => {});
      }
    };
    
    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [startTime, endTime]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.currentTime = startTime;
      const p = videoRef.current.play();
      if (p !== undefined) p.catch(() => {});
    }
  }, [videoSrc, startTime]);

  if (!videoSrc) return null;

  return (
    <div ref={containerRef} className="relative aspect-[9/16] bg-black rounded-xl overflow-hidden w-full max-w-[320px] mx-auto border border-white/10">
      <video 
        ref={videoRef}
        src={videoSrc}
        className="w-full h-full object-cover"
        playsInline
        muted
        loop={false}
      />
      
      {/* Subtitle Overlay */}
      {captionSettings.id !== 'no-caption' && activeWords.length > 0 && (
        <div 
          className="absolute left-0 right-0 pointer-events-none flex flex-col items-center justify-center px-4"
          style={{
            bottom: captionSettings.position === 'bottom' ? `${(captionSettings.marginBottom || 180) / 1920 * 100}%` : 'auto',
            top: captionSettings.position === 'top' ? '10%' : (captionSettings.position === 'center' ? '50%' : 'auto'),
            transform: captionSettings.position === 'center' ? 'translateY(-50%)' : 'none',
          }}
        >
          <div 
            className="flex flex-wrap justify-center text-center leading-tight transition-all duration-75"
            style={{
              fontFamily: captionSettings.fontFamily,
              fontWeight: captionSettings.fontWeight || 900,
              fontStyle: captionSettings.fontStyle || 'normal',
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              textTransform: captionSettings.textTransform as any,
              backgroundColor: captionSettings.backgroundColor !== 'transparent' ? captionSettings.backgroundColor : 'transparent',
              padding: captionSettings.backgroundColor !== 'transparent' ? '8px 16px' : '0',
              borderRadius: captionSettings.backgroundColor !== 'transparent' ? '8px' : '0',
            }}
          >
            {activeWords
              .filter((_, idx) => {
                // For typewriter: only show words up to (and including) the active word
                if (captionSettings.animation === 'typewriter') {
                  const activeIdx = activeWords.findIndex(w => w.isActive);
                  return idx <= activeIdx;
                }
                return true;
              })
              .map((item, idx) => {
              const { word, isActive, isSpoken } = item;
              
              // Scale for preview container (usually 320px wide instead of 1080px)
              // We divide font size by roughly 3.375 (1080/320)
              const scaleRatio = 320 / 1080;
              const fontSize = (captionSettings.fontSize || 64) * scaleRatio;
              const strokeWidth = (captionSettings.strokeWidth || 5) * scaleRatio;
              
              let color = captionSettings.textColor;
              if (isActive) color = captionSettings.activeWordColor;
              else if (isSpoken) color = captionSettings.spokenWordColor;
              
              const isPop = (captionSettings.animation === 'pop' || captionSettings.animation === 'wordFocus') && isActive;
              const isGrow = captionSettings.animation === 'grow' && isActive;
              const isBounce = captionSettings.animation === 'bounce' && isActive;
              const isUnderline = captionSettings.animation === 'underline' && isActive;
              const isGlow = captionSettings.animation === 'glow' && isActive;
              const isBoxHighlight = (captionSettings.animation === 'boxHighlight' && isActive);
              
              const strokeColor = captionSettings.strokeColor;
              const showGlow = strokeColor === '#8A2BE2' || strokeColor === '#FFFFFF' || isGlow;
              const glowColor = isGlow ? (captionSettings.activeWordColor || '#FFFFFF') : strokeColor;

              let textDecoration = 'none';
              if (isUnderline) textDecoration = 'underline';
              
              let wordBg = 'transparent';
              if (isBoxHighlight) wordBg = captionSettings.backgroundColor || 'rgba(0,0,0,0.75)';

              return (
                <span 
                  key={idx}
                  className={`inline-block mx-[3px] ${isPop ? 'scale-110' : ''} ${isGrow ? 'scale-105' : ''} ${isBounce ? 'animate-bounce' : ''} transition-all duration-100`}
                  style={{
                    color: color,
                    fontSize: `${fontSize}px`,
                    WebkitTextStroke: strokeWidth > 0 ? `${strokeWidth}px ${strokeColor}` : '0',
                    textShadow: showGlow ? `0 0 10px ${glowColor}` : 'none',
                    textDecoration,
                    backgroundColor: wordBg,
                    padding: isBoxHighlight ? '4px 6px' : '0',
                    borderRadius: isBoxHighlight ? '4px' : '0',
                  }}
                >
                  {word.text}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
