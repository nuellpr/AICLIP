"use client";

import React, { useState, useEffect, useRef } from 'react';

interface TimelineSliderProps {
  min: number;
  max: number;
  startTime: number;
  endTime: number;
  onChange: (start: number, end: number) => void;
}

export function TimelineSlider({ min, max, startTime, endTime, onChange }: TimelineSliderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | 'range' | null>(null);
  const [dragOffset, setDragOffset] = useState(0);

  const duration = max - min;
  // Handle edge case where max is not loaded yet
  const safeDuration = duration > 0 ? duration : 100;
  
  const startPercent = Math.max(0, Math.min(100, ((startTime - min) / safeDuration) * 100));
  const endPercent = Math.max(0, Math.min(100, ((endTime - min) / safeDuration) * 100));

  const handlePointerDown = (e: React.PointerEvent, type: 'start' | 'end' | 'range') => {
    e.preventDefault();
    e.stopPropagation();
    
    if (type === 'range') {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const clientX = e.clientX;
        const pxPerSec = rect.width / safeDuration;
        const clickTime = min + ((clientX - rect.left) / rect.width) * safeDuration;
        setDragOffset(clickTime - startTime);
      }
    }
    
    setIsDragging(type);
    
    // Add event listeners to window to capture drags outside the element
    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let percent = (moveEvent.clientX - rect.left) / rect.width;
      percent = Math.max(0, Math.min(1, percent));
      
      const newTime = min + (percent * safeDuration);
      
      if (type === 'start') {
        const cappedNewTime = Math.min(newTime, endTime - 1); // Min 1s gap
        onChange(Number(cappedNewTime.toFixed(2)), endTime);
      } else if (type === 'end') {
        const cappedNewTime = Math.max(newTime, startTime + 1); // Min 1s gap
        onChange(startTime, Number(cappedNewTime.toFixed(2)));
      } else if (type === 'range') {
        const currentDuration = endTime - startTime;
        // The new start time is based on cursor position minus the offset where they clicked
        const clickTime = min + ((moveEvent.clientX - rect.left) / rect.width) * safeDuration;
        let newStart = clickTime - dragOffset;
        
        // Clamp to boundaries
        if (newStart < min) newStart = min;
        if (newStart + currentDuration > max) newStart = max - currentDuration;
        
        onChange(Number(newStart.toFixed(2)), Number((newStart + currentDuration).toFixed(2)));
      }
    };

    const handlePointerUp = () => {
      setIsDragging(null);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  return (
    <div className="w-full select-none py-6">
      <div 
        ref={containerRef}
        className="relative h-12 bg-[#222] rounded-lg border border-white/10 cursor-pointer overflow-hidden"
      >
        {/* Background markers (optional visual enhancement) */}
        <div></div>

        {/* Selected Range */}
        <div 
          className="absolute h-full bg-primary/30 border-y-2 border-primary hover:bg-primary/40 transition-colors"
          style={{ 
            left: `${startPercent}%`, 
            width: `${endPercent - startPercent}%`,
            cursor: isDragging === 'range' ? 'grabbing' : 'grab'
          }}
          onPointerDown={(e) => handlePointerDown(e, 'range')}
        >
          {/* Active styling when dragging */}
          <div className="w-full h-full flex items-center justify-center pointer-events-none opacity-50 text-primary-foreground text-xs font-bold font-mono">
            {(endTime - startTime).toFixed(1)}s
          </div>
        </div>

        {/* Left Thumb (Start) */}
        <div 
          className="absolute top-0 bottom-0 w-4 -ml-2 bg-white rounded-sm shadow-md flex items-center justify-center cursor-ew-resize hover:bg-primary/80 z-10 transition-colors"
          style={{ left: `${startPercent}%` }}
          onPointerDown={(e) => handlePointerDown(e, 'start')}
        >
          <div className="w-0.5 h-4 bg-black/30 rounded-full"></div>
        </div>

        {/* Right Thumb (End) */}
        <div 
          className="absolute top-0 bottom-0 w-4 -ml-2 bg-white rounded-sm shadow-md flex items-center justify-center cursor-ew-resize hover:bg-primary/80 z-10 transition-colors"
          style={{ left: `${endPercent}%` }}
          onPointerDown={(e) => handlePointerDown(e, 'end')}
        >
          <div></div>
        </div>
      </div>
      
      <div className="flex justify-between mt-2 text-xs font-mono text-gray-500">
        <span>{startTime.toFixed(2)}s</span>
        <span>{endTime.toFixed(2)}s</span>
      </div>
    </div>
  );
}
