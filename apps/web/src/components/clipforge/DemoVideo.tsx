"use client";

import { useRef, useState } from "react";
import { BadgeCheck, ShieldCheck, Wand2 } from "lucide-react";
import { Reveal } from "./Reveal";

const highlights = [
  {
    icon: Wand2,
    title: "AI Frame Intelligence",
    desc: "Pemotongan otomatis mengikuti wajah & momen dalam frame, subjek tetap di tengah viewport 9:16.",
    iconBg: "bg-[#E7E4F9]",
  },
  {
    icon: BadgeCheck,
    title: "Karaoke Subtitle Akurat",
    desc: "Subtitle word-by-word dengan preset Hormozi, karaoke & neon highlight, bikin video makin scroll-stopping.",
    iconBg: "bg-[#DBF3E8]",
  },
  {
    icon: ShieldCheck,
    title: "Render Full HD 1080p",
    desc: "Hasil render vertikal berkualitas tinggi, siap langsung diupload tanpa edit manual.",
    iconBg: "bg-[#FDF3D8]",
  },
];

export default function DemoVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);

  return (
    <section id="demo" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <Reveal className="mx-auto mb-14 max-w-2xl text-center">
          <div className="mb-4 text-xs font-semibold tracking-[0.2em] text-[#EA4C89] uppercase">
            Demo Video
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-5xl">
            Lihat Cara Kerja AI{" "}
            <span className="text-[#EA4C89]">Memotong & Mengatur Subtitle</span>
          </h2>
          <p className="mt-4 text-[var(--db-gray)]">
            Arahkan kursor ke video untuk memutar preview, persis seperti hasil akhir
            di TikTok, Reels & Shorts.
          </p>
        </Reveal>

        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,420px)_1fr] lg:gap-16">
          <Reveal className="mx-auto w-full max-w-[340px]">
            <div className="relative">
              <div className="pointer-events-none absolute -inset-4 rounded-[3rem] bg-gradient-to-b from-[#E7E4F9] via-[#FDE3E1]/60 to-transparent blur-2xl" />

              <div
                className="relative overflow-hidden rounded-[2.2rem] border-2 border-[#0D0C22] bg-[#0D0C22] shadow-[0_25px_80px_-20px_rgba(13,12,34,0.35)]"
                style={{ aspectRatio: "9/16" }}
              >
                <div className="absolute top-3 left-1/2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
                <video
                  ref={videoRef}
                  src="/tutorial.mp4"
                  className="h-full w-full object-cover"
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  onMouseEnter={() => {
                    videoRef.current?.play();
                    setPlaying(true);
                  }}
                  onMouseLeave={() => {
                    videoRef.current?.pause();
                    if (videoRef.current) videoRef.current.currentTime = 0;
                    setPlaying(false);
                  }}
                />
                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0D0C22] via-[#0D0C22]/70 to-transparent p-4 pt-10">
                  <div className="text-sm font-bold leading-snug text-white">
                    "Yang bikin orang <span className="text-[#EA4C89]">STOP scroll…</span>"
                  </div>
                  <div className="mt-0.5 text-[10px] tracking-wider text-white/70 uppercase">
                    Subtitle Hormozi • Word-by-word
                  </div>
                </div>
                {!playing && (
                  <div className="absolute inset-0 grid place-items-center bg-black/25">
                    <div className="rounded-full bg-[var(--db-panel)] px-4 py-2 text-xs font-semibold text-[var(--ink)] shadow-lg">
                      ▶ Hover untuk memutar
                    </div>
                  </div>
                )}
                <div className="absolute top-12 right-3 rounded-full bg-[#EA4C89] px-2.5 py-1 text-[10px] font-extrabold text-white">
                  FULL HD 1080P
                </div>
              </div>
            </div>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-1">
            {highlights.map((h, i) => (
              <Reveal key={h.title} delay={i * 0.1}>
                <div className="glass-card flex gap-4 rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1">
                  <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${h.iconBg} text-[var(--ink)]`}>
                    <h.icon size={22} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[var(--ink)]">{h.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--db-gray)]">{h.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
