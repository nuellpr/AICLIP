const words = [
  "TIKTOK",
  "REELS",
  "SHORTS",
  "SUBTITLE KARAOKE",
  "CROP 9:16",
  "FACE TRACKING",
  "HOOK GENERATOR",
  "SFX OTOMATIS",
  "SKOR VIRAL",
];

export default function Marquee() {
  const row = [...words, ...words];
  return (
    <section
      aria-hidden="true"
      className="relative overflow-hidden bg-[#0D0C22] py-5"
    >
      <div
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-[#0D0C22] to-transparent"
      />
      <div
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-[#0D0C22] to-transparent"
      />
      <div className="cf-marquee-track flex w-max items-center gap-10">
        {row.map((w, i) => (
          <span key={i} className="flex items-center gap-10">
            <span
              className={`text-sm font-bold tracking-[0.25em] whitespace-nowrap ${
                i % 2 === 0 ? "text-white" : "text-[#EA4C89]"
              }`}
            >
              {w}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-[#EA4C89]" />
          </span>
        ))}
      </div>
    </section>
  );
}
