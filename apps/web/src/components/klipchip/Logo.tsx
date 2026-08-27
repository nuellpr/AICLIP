export function KlipChipLogo({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      {/* Icon: reimagines ClipForge scissors+chip for KlipChip: chip + cut */}
      <div className="relative h-9 w-9 shrink-0 overflow-visible">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-cyan-400 via-teal-400 to-lime-400 blur-[6px] opacity-60" />
        <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-cyan-500 to-lime-400 shadow-[0_0_20px_rgba(34,211,238,0.45)]">
          <svg viewBox="0 0 32 32" className="h-6 w-6 text-black" fill="none" aria-hidden>
            <path d="M11 9L9 11l5 5-5 5 2 2 7-7-7-7Z" fill="currentColor" opacity={0.95} />
            <path d="M18 9l-2 2 3 3h6V11h-7Z" fill="white" opacity={0.92} />
            <path d="M18 21l-2-2 3-3h6v3h-7Z" fill="white" opacity={0.72} />
            {/* scissors hint */}
            <circle cx="20" cy="20" r="1.6" stroke="white" strokeWidth="1.1" opacity={0.9} />
          </svg>
        </div>
      </div>
      <div className={compact ? "hidden sm:block" : ""}>
        <div className="flex items-baseline gap-1.5 leading-none">
          <span className="text-[19px] font-black tracking-tight text-white">KlipChip</span>
          <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-black tracking-widest text-black">AI</span>
        </div>
        <div className="text-[10px] font-bold tracking-[0.22em] text-white/60">INSTANT CLIP</div>
      </div>
    </div>
  );
}

export function KlipChipBadge() {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/25 bg-cyan-400/10 px-3 py-1.5 text-xs font-bold text-cyan-300 backdrop-blur">
      <span className="h-2 w-2 animate-pulse rounded-full bg-lime-400 shadow-[0_0_10px_rgba(132,204,2,0.9)]" />
      Faster-Whisper • Auto Highlight • 9:16
    </div>
  );
}
