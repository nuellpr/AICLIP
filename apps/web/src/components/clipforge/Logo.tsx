export function ClipForgeLogo({
  compact = false,
  size = "md",
  light = false,
  className = "",
}: {
  compact?: boolean;
  size?: "sm" | "md";
  light?: boolean;
  className?: string;
}) {
  const box = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const icon = size === "sm" ? "h-4.5 w-4.5" : "h-6 w-6";
  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      <div className={`relative ${box} shrink-0`}>
        <div className={`relative grid ${box} place-items-center rounded-xl bg-gradient-to-br from-[#EA4C89] to-[#C32361] shadow-[0_6px_18px_rgba(234,76,137,0.35)]`}>
          <svg viewBox="0 0 32 32" className={`${icon} text-white`} fill="none" aria-hidden>
            {/* scissors */}
            <circle cx="11" cy="11" r="2" stroke="currentColor" strokeWidth="1.6" />
            <circle cx="11" cy="21" r="2" stroke="currentColor" strokeWidth="1.6" />
            <path d="M12.5 12.5 24 22M12.5 19.5 24 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            {/* clip/chip hint */}
            <rect x="18" y="9" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.4" opacity="0.85" />
            <path d="M20 12h3M20 14.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" opacity="0.7" />
          </svg>
        </div>
      </div>
      {!compact && (
        <div className="leading-none">
          <div className="flex items-baseline gap-1.5">
            <span className={`text-[19px] font-black tracking-tight ${light ? "text-white" : "text-[#0D0C22]"}`}>
              ClipForge
            </span>
            <span className="text-[15px] font-black text-[#EA4C89]">AI</span>
          </div>
          <div className={`mt-1 text-[10px] font-bold tracking-[0.22em] ${light ? "text-white/60" : "text-[#6E6D7A]"}`}>
            AUTO VIRAL CLIPPING
          </div>
        </div>
      )}
    </div>
  );
}
