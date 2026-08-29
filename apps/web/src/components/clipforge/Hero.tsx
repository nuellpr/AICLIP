"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform, useScroll } from "framer-motion";
import { ArrowRight, Link2, Sparkles, Flame, Play, Zap, Target, Captions, Crop } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { fadeUp, stagger } from "./Reveal";

function Counter({
  value,
  decimals = 0,
  suffix = "",
}: {
  value: number;
  decimals?: number;
  suffix?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [n, setN] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const start = performance.now();
    const dur = 1300;
    let raf: number;
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1);
      setN(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, value]);

  return (
    <span ref={ref} className="cf-num">
      {n.toFixed(decimals)}
      {suffix}
    </span>
  );
}

const stats: {
  label: string;
  note: string;
  value?: number;
  decimals?: number;
  suffix?: string;
  raw?: string;
  icon: LucideIcon;
  chip: string;
  delta: string;
  deltaBg: string;
}[] = [
  {
    label: "Lebih Cepat",
    raw: "10x",
    note: "Render paralel",
    icon: Zap,
    chip: "bg-[var(--db-lavender)]",
    delta: "+38% minggu ini",
    deltaBg: "bg-[var(--db-mint)]",
  },
  {
    label: "Akurasi Subtitle",
    value: 99.4,
    decimals: 1,
    suffix: "%",
    note: "Word-by-word",
    icon: Target,
    chip: "bg-[var(--db-mint)]",
    delta: "Akurat",
    deltaBg: "bg-[var(--db-lavender)]",
  },
  {
    label: "Preset Subtitle",
    value: 5,
    suffix: "+",
    note: "Hormozi, karaoke",
    icon: Captions,
    chip: "bg-[var(--db-butter)]",
    delta: "Auto",
    deltaBg: "bg-[var(--db-butter)]",
  },
  {
    label: "Auto Reframe",
    raw: "9:16",
    note: "Face tracking",
    icon: Crop,
    chip: "bg-[var(--db-peach)]",
    delta: "9:16",
    deltaBg: "bg-[var(--db-peach)]",
  },
];

const trust = [
  "Tanpa Watermark",
  "Render 1080p HD",
  "Subtitle Bahasa Indonesia",
  "Multi Model AI Provider",
];

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end start"] });
  const orbY1 = useTransform(scrollYProgress, [0, 1], [0, -110]);
  const orbY2 = useTransform(scrollYProgress, [0, 1], [0, 70]);

  const glowX = useMotionValue(50);
  const glowY = useMotionValue(30);
  const glowLeft = useSpring(useTransform(glowX, (v) => `${v}%`), { stiffness: 60, damping: 20 });
  const glowTop = useSpring(useTransform(glowY, (v) => `${v}%`), { stiffness: 60, damping: 20 });

  const rx = useSpring(0, { stiffness: 140, damping: 18 });
  const ry = useSpring(0, { stiffness: 140, damping: 18 });

  const onSectionMove = (e: React.MouseEvent) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    glowX.set(((e.clientX - rect.left) / rect.width) * 100);
    glowY.set(((e.clientY - rect.top) / rect.height) * 100);
  };

  const onMockupMove = (e: React.MouseEvent) => {
    const rect = mockupRef.current?.getBoundingClientRect();
    if (!rect) return;
    ry.set(((e.clientX - rect.left) / rect.width - 0.5) * 10);
    rx.set(-((e.clientY - rect.top) / rect.height - 0.5) * 10);
  };
  const onMockupLeave = () => {
    rx.set(0);
    ry.set(0);
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={onSectionMove}
      className="relative overflow-hidden bg-[var(--db-panel)] pt-32 pb-16 lg:pt-40 lg:pb-20"
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute h-[420px] w-[420px] rounded-full bg-[rgba(234,76,137,0.08)] blur-[110px]"
        style={{ left: glowLeft, top: glowTop, translateX: "-50%", translateY: "-50%" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute top-24 -left-24 h-72 w-72 rounded-full bg-[#E7E4F9] opacity-70 blur-[100px]"
        style={{ y: orbY1 }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-6rem] bottom-10 h-80 w-80 rounded-full bg-[#FDE3E1] opacity-70 blur-[110px]"
        style={{ y: orbY2 }}
      />
      <div className="cf-mesh" aria-hidden="true" />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-10">
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.div
              variants={fadeUp}
              className="mb-6 inline-flex items-center gap-2 rounded-full bg-[var(--db-peach)] px-4 py-1.5 text-xs font-semibold text-[var(--ink)]"
            >
              <Sparkles size={14} className="text-[#EA4C89]" />
              Teknologi Auto-Clipping AI Gen-Z v2.0
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-[2.6rem] leading-[1.08] font-extrabold tracking-tight text-[var(--ink)] sm:text-6xl lg:text-[4.2rem]"
            >
              Ubah Video Panjang
              <br />
              Menjadi Puluhan{" "}
              <span className="relative inline-block text-[#EA4C89]">
                Klip Viral
                <motion.span
                  aria-hidden="true"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.7, delay: 0.6, ease: [0.21, 0.47, 0.32, 0.98] }}
                  className="absolute inset-x-0 bottom-1 h-3 origin-left rounded-sm bg-[#EA4C89]/20"
                />
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--db-gray)]"
            >
              ClipForge AI memotong video YouTube, podcast & webinar jadi klip pendek{" "}
              <span className="font-semibold text-[var(--ink)]">format 9:16</span> siap
              upload ke TikTok, Reels & Shorts, otomatis tanpa editing manual.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="cf-cta-pulse group inline-flex items-center gap-2 rounded-full bg-[#EA4C89] px-7 py-3.5 text-base font-semibold text-white transition-all duration-300 hover:scale-[1.03] hover:bg-[#C32361]"
              >
                Mulai Buat Klip Gratis
                <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center gap-2 rounded-full border-2 border-[var(--ink)] px-6 py-3.5 text-base font-medium text-[var(--ink)] transition-all duration-300 hover:bg-[var(--ink)] hover:text-[var(--db-panel)]"
              >
                <Play size={16} />
                Lihat Demo
              </a>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="group rounded-2xl border border-[var(--db-line)] bg-[var(--db-panel)] p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${s.chip}`}>
                      <s.icon size={16} className="text-[var(--ink)]" />
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap text-[var(--ink)] ${s.deltaBg}`}
                    >
                      {s.delta}
                    </span>
                  </div>
                  <div className="mt-3 text-2xl font-extrabold text-[var(--ink)] sm:text-[1.7rem]">
                    {s.raw ? (
                      <span className="cf-num">{s.raw}</span>
                    ) : (
                      <Counter value={s.value ?? 0} decimals={s.decimals} suffix={s.suffix} />
                    )}
                  </div>
                  <div className="mt-1 text-xs font-semibold text-[var(--ink)]">{s.label}</div>
                  <div className="text-[11px] text-[var(--db-gray)]">{s.note}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.21, 0.47, 0.32, 0.98], delay: 0.15 }}
            ref={mockupRef}
            onMouseMove={onMockupMove}
            onMouseLeave={onMockupLeave}
            style={{ perspective: 1100 }}
            className="relative mx-auto hidden w-full max-w-md lg:block"
          >
            <motion.div
              style={{ rotateX: rx, rotateY: ry, transformStyle: "preserve-3d" }}
              className="relative rounded-3xl border border-[var(--db-line)] bg-[var(--db-panel)] p-4 shadow-[0_30px_80px_-20px_rgba(13,12,34,0.18)]"
            >
              <div className="flex items-center justify-between rounded-xl bg-[var(--db-cream)] px-4 py-2.5">
                <div className="flex items-center gap-2 text-xs text-[var(--db-gray)]">
                  <Link2 size={14} className="text-[#EA4C89]" />
                  https://youtube.com/watch?v=…
                </div>
                <span className="rounded-full bg-[#FDE3E1] px-2.5 py-1 text-[10px] font-semibold text-[#C32361]">
                  AUTO-CLIP
                </span>
              </div>

              <div className="mt-3 flex gap-3">
                <div className="relative w-2/5 overflow-hidden rounded-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-[#E7E4F9] via-[#FDE3E1] to-[#DBF3E8]" aria-hidden="true" />
                  <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                    <div className="grid h-12 w-12 place-items-center rounded-full bg-[#0D0C22] shadow-lg">
                      <Play size={18} className="ml-0.5 text-white" />
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0D0C22] via-[#0D0C22]/60 to-transparent p-2.5">
                    <div className="text-[11px] font-bold text-white">
                      "Yang bikin orang <span className="text-[#EA4C89]">STOP scroll…</span>"
                    </div>
                    <div className="text-[9px] text-white/70">SUBTITLE HORMOZI • WORD-BY-WORD</div>
                  </div>
                  <div className="absolute top-2 left-2 rounded-full bg-[var(--db-panel)] px-2 py-0.5 text-[9px] font-bold text-[var(--ink)] shadow-sm">
                    FORMAT 9:16
                  </div>
                </div>
                <div className="flex w-3/5 flex-col gap-3">
                  {[
                    { label: "Momen 1", score: 92, bg: "bg-[var(--db-lavender)]" },
                    { label: "Momen 2", score: 87, bg: "bg-[var(--db-mint)]" },
                    { label: "Momen 3", score: 84, bg: "bg-[var(--db-butter)]" },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className={`rounded-xl ${m.bg} p-3 transition-transform duration-300 hover:-translate-y-0.5`}
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-[var(--ink)]">{m.label}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--db-panel)] px-2 py-0.5 font-bold text-[#EA4C89] shadow-sm">
                          <Flame size={10} /> {m.score}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--db-nav)]">
                        <div
                          className="h-full rounded-full bg-[#EA4C89]"
                          style={{ width: `${m.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between rounded-xl bg-[var(--db-cream)] px-3 py-2.5 text-[11px]">
                    <span className="text-[var(--db-gray)]">Render 3 klip • 9:16</span>
                    <span className="font-bold text-[#EA4C89]">1080p ✓</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-5 -right-4 rounded-2xl border border-[var(--db-line)] bg-[var(--db-panel)] px-4 py-3 shadow-[0_18px_45px_-12px_rgba(13,12,34,0.22)]"
            >
              <div className="text-[10px] text-[var(--db-gray)]">Skor Momen Viral</div>
              <div className="text-xl font-extrabold text-[#EA4C89]">92/100</div>
            </motion.div>
          </motion.div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
          {trust.map((t) => (
            <span
              key={t}
              className="rounded-full bg-[var(--db-cream)] px-4 py-2 text-xs font-medium text-[var(--ink)]"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
