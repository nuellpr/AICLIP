import React, { useRef } from 'react';
import { Inter, Montserrat, Poppins } from 'next/font/google';
import { CaptionPreset, CAPTION_PRESETS } from '@clipforge/shared';
import { ChevronLeft, ChevronRight, Lock, Check } from 'lucide-react';

const inter = Inter({ subsets: ['latin'], display: 'swap' });
const montserrat = Montserrat({ subsets: ['latin'], display: 'swap' });
const poppins = Poppins({ subsets: ['latin'], weight: ['700', '800', '900'], display: 'swap' });

const PRESET_FONT: Record<string, string> = {
  Inter: inter.style.fontFamily,
  Montserrat: montserrat.style.fontFamily,
  Poppins: poppins.style.fontFamily,
  Impact: "Impact, 'Arial Black', sans-serif",
  Arial: 'Arial, Helvetica, sans-serif',
  Georgia: "Georgia, 'Times New Roman', serif",
};

const ANIM_LABEL: Record<string, string> = {
  none: 'Statis',
  pop: 'Pop',
  grow: 'Grow',
  bounce: 'Bounce',
  karaoke: 'Karaoke',
  glow: 'Glow',
  underline: 'Underline',
  boxHighlight: 'Box',
  typewriter: 'Typewriter',
  wordFocus: 'Word Focus',
};

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

  const posClass =
    preset.position === 'top' ? 'top-3' : preset.position === 'center' ? 'top-1/2 -translate-y-1/2' : 'bottom-4';
  const wordSize = Math.max(14, Math.min(26, Math.round((preset.fontSize || 60) / 3)));

  return (
    <div className={`absolute inset-x-0 flex items-center justify-center gap-1.5 px-2 text-center select-none ${posClass}`}
         style={{
           fontFamily: PRESET_FONT[preset.fontFamily] || preset.fontFamily,
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
              fontSize: `${wordSize}px`,
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
              className={`snap-start shrink-0 rounded-2xl border-2 overflow-hidden transition-all duration-200
                ${preset.isLocked ? 'cursor-not-allowed opacity-90' : 'cursor-pointer hover:-translate-y-1 hover:shadow-lg'}
                ${isSelected && !preset.isLocked ? 'border-[#EA4C89] ring-2 ring-[#EA4C89]/30 scale-[1.02] shadow-lg shadow-[#EA4C89]/20' : 'border-black/[0.08] hover:border-black/20'}
                [&:nth-child(4n+1)]:bg-[var(--db-lavender)] [&:nth-child(4n+2)]:bg-[var(--db-mint)] [&:nth-child(4n+3)]:bg-[var(--db-butter)] [&:nth-child(4n+4)]:bg-[var(--db-peach)]`}
              style={{ width: '170px' }}
            >
              <div
                className="h-32 w-full rounded-t-2xl overflow-hidden relative bg-black"
                style={{
                  background:
                    'radial-gradient(circle at 30% 15%, rgba(255,255,255,0.12), transparent 55%), linear-gradient(150deg, #2a2f3f 0%, #151823 55%, #0c0e15 100%)',
                }}
              >
                {preset.id === 'no-caption' ? (
                  <div className="w-12 h-12 rounded-full border-4 border-gray-500 relative flex items-center justify-center absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-14 h-1 bg-gray-500 rotate-45 absolute" />
                  </div>
                ) : (
                  <>
                    <div
                      className="absolute inset-0 opacity-40 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 50% ${preset.position === 'top' ? '18%' : preset.position === 'center' ? '50%' : '82%'}, ${preset.activeWordColor}33, transparent 62%)`,
                      }}
                    />
                    <AnimatedPresetPreview preset={preset} />
                  </>
                )}

                {isSelected && !preset.isLocked && (
                  <div className="absolute top-2 right-2 z-10 w-5 h-5 rounded-full bg-[#EA4C89] flex items-center justify-center shadow">
                    <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
                  </div>
                )}

                {preset.isLocked && (
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 p-2">
                    <Lock className="w-6 h-6 text-yellow-500 mb-1" />
                    <span className="text-yellow-500 text-[10px] font-bold text-center leading-tight">Topup untuk<br/>membuka</span>
                  </div>
                )}
              </div>
              <div className="p-2.5 text-center border-t border-black/[0.08]">
                <p className={`text-xs font-bold leading-tight line-clamp-2 min-h-[2rem] flex items-center justify-center ${isSelected ? 'text-[#EA4C89]' : 'text-[var(--ink)]'}`}>
                  {preset.name}
                </p>
                <p className="mt-1 text-[10px] uppercase tracking-wider font-semibold" style={{ color: preset.activeWordColor }}>
                  {ANIM_LABEL[preset.animation] || preset.animation}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
