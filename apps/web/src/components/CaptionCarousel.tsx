import React, { useRef } from 'react';
import { CaptionPreset, CAPTION_PRESETS } from '@clipforge/shared';
import { ChevronLeft, ChevronRight, Lock } from 'lucide-react';

interface CaptionCarouselProps {
  selectedId: string;
  onSelect: (preset: CaptionPreset) => void;
}

function AnimatedPresetPreview({ preset }: { preset: CaptionPreset }) {
  const [activeIdx, setActiveIdx] = React.useState(0);
  const words = preset.textTransform === 'lowercase' ? ["hey", "there"] : ["HEY", "THERE"];

  React.useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % words.length);
    }, 750);
    return () => clearInterval(interval);
  }, [words.length]);

  return (
    <div className="flex items-center justify-center gap-1.5 w-full h-full p-2 text-center select-none"
         style={{
           fontFamily: preset.fontFamily || 'Montserrat',
           fontWeight: preset.fontWeight || 800,
           fontStyle: preset.fontStyle || 'normal',
           lineHeight: 1.2,
         }}>
      {words.map((word, idx) => {
        const isActive = idx === activeIdx;

        let color = isActive ? preset.activeWordColor : (preset.spokenWordColor || preset.textColor || '#FFFFFF');
        let bg = 'transparent';
        let transform = 'scale(1)';
        let textDecoration = 'none';
        const borderRadius = '4px';
        const padding = '2px 4px';
        let glowShadow = 'none';

        if (preset.animation === 'boxHighlight' || preset.id === 'smart-bg-focus' || preset.id === 'box-highlight') {
          if (isActive) {
            bg = (preset.id === 'smart-bg-focus' ? '#FFFF00' : preset.backgroundColor) || 'rgba(0,0,0,0.85)';
            color = preset.activeWordColor || (preset.id === 'smart-bg-focus' ? '#000000' : '#FFFFFF');
          } else {
            bg = 'transparent';
            color = preset.textColor || '#FFFFFF';
          }
        } else if (preset.animation === 'underline' || preset.id === 'underline-focus') {
          if (isActive) {
            textDecoration = `underline 3px ${preset.activeWordColor || '#FF00FF'}`;
            color = preset.activeWordColor || preset.textColor || '#FFFFFF';
          }
        } else if (preset.animation === 'glow') {
          if (isActive) {
            color = preset.activeWordColor || '#FFFFFF';
            glowShadow = `0 0 12px ${color}`;
          }
        } else if (preset.animation === 'pop' || preset.animation === 'grow' || preset.id === 'temp-0' || preset.id === 'temp-5' || preset.id === 'temp-15') {
          if (isActive) {
            transform = 'scale(1.15)';
          }
        }

        return (
          <span
            key={idx}
            className="inline-block transition-all duration-200"
            style={{
              color,
              backgroundColor: bg,
              transform,
              textDecoration,
              borderRadius,
              padding,
              fontSize: '16px',
              WebkitTextStroke: preset.strokeWidth && preset.strokeWidth > 0 ? `${preset.strokeWidth / 3.5}px ${preset.strokeColor}` : 'none',
              textShadow: glowShadow !== 'none' ? glowShadow : (preset.strokeColor && preset.strokeColor !== 'transparent' ? `0 0 4px ${preset.strokeColor}` : 'none')
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
}

export function CaptionCarousel({ selectedId, onSelect }: CaptionCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -300 : 300;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group w-full mb-6">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-semibold text-[var(--db-gray)] uppercase tracking-wider">Caption Style Presets</h3>
        <div className="flex gap-2">
          <button 
            type="button"
            onClick={() => scroll('left')}
            className="p-1 rounded-full bg-[var(--db-cream)] hover:bg-[var(--db-hover)] transition"
          >
            <ChevronLeft className="w-5 h-5 text-[var(--ink)]" />
          </button>
          <button 
            type="button"
            onClick={() => scroll('right')}
            className="p-1 rounded-full bg-[var(--db-cream)] hover:bg-[var(--db-hover)] transition"
          >
            <ChevronRight className="w-5 h-5 text-[var(--ink)]" />
          </button>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {CAPTION_PRESETS.filter(p => p.enabled).map((preset) => {
          const isSelected = selectedId === preset.id;
          
          return (
            <div 
              key={preset.id}
              onClick={() => {
                if (!preset.isLocked) {
                  onSelect(preset);
                }
              }}
              className={`snap-start shrink-0 rounded-xl border-2 transition-all duration-200 
                ${preset.isLocked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer'} 
                ${isSelected && !preset.isLocked ? 'border-[#EA4C89] ring-2 ring-[#EA4C89]/20' : 'border-black/[0.08] hover:border-black/20'} 
                [&:nth-child(4n+1)]:bg-[#E7E4F9] [&:nth-child(4n+2)]:bg-[#DBF3E8] [&:nth-child(4n+3)]:bg-[#FDF3D8] [&:nth-child(4n+4)]:bg-[#FDE3E1]`}
              style={{ width: '160px' }}
            >
              <div className="h-28 w-full flex items-center justify-center rounded-t-lg overflow-hidden p-2 relative bg-black">
                {preset.id === 'no-caption' ? (
                  <div className="w-12 h-12 rounded-full border-4 border-gray-500 relative flex items-center justify-center">
                    <div className="w-14 h-1 bg-gray-500 rotate-45 absolute" />
                  </div>
                ) : (
                  <AnimatedPresetPreview preset={preset} />
                )}
                
                {preset.isLocked && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-2">
                    <Lock className="w-6 h-6 text-yellow-500 mb-1" />
                    <span className="text-yellow-500 text-[10px] font-bold text-center leading-tight">Topup untuk<br/>membuka</span>
                  </div>
                )}
              </div>
              <div className="p-3 text-center border-t border-black/[0.08]">
                <p className={`text-sm font-semibold ${isSelected ? 'text-[#EA4C89]' : 'text-[var(--ink)]'}`}>
                  {preset.name}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
