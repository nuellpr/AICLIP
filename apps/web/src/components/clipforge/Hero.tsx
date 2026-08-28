"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useInView, useMotionValue, useSpring, useTransform, useScroll } from "framer-motion";
import { ArrowRight, Link2, Sparkles, Flame, Play } from "lucide-react";
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
}[] = [
  { label: "Lebih Cepat", raw: "10x", note: "Render paralel" },
  { label: "Akurasi Subtitle", value: 99.4, decimals: 1, suffix: "%", note: "Word-by-word" },
  { label: "Preset Subtitle", value: 5, suffix: "+", note: "Hormozi, karaoke" },
  { label: "Auto Reframe", raw: "9:16", note: "Face tracking" },
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
      className="relative overflow-hidden pt-32 pb-16 lg:pt-40 lg:pb-20"
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute h-[420px] w-[420px] rounded-full bg-purple-500/[0.07] blur-[110px]"
        style={{ left: glowLeft, top: glowTop, translateX: "-50%", translateY: "-50%" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute top-24 -left-24 h-72 w-72 rounded-full bg-cyan-500/[0.09] blur-[100px]"
        style={{ y: orbY1 }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute right-[-6rem] bottom-10 h-80 w-80 rounded-full bg-pink-500/[0.07] blur-[110px]"
        style={{ y: orbY2 }}
      />
      <div className="cf-mesh" aria-hidden="true" />
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage: "radial-gradient(ellipse 70% 55% at 50% 0%, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 70% 55% at 50% 0%, black 30%, transparent 75%)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-5 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-10">
          <motion.div variants={stagger} initial="hidden" animate="show">
            <motion.div
              variants={fadeUp}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-purple-400/30 bg-purple-500/10 px-4 py-1.5 text-xs font-medium text-purple-200"
            >
              <Sparkles size={14} className="text-purple-300" />
              Teknologi Auto-Clipping AI Gen-Z v2.0
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-[2.6rem] leading-[1.08] font-extrabold tracking-tight sm:text-6xl lg:text-[4.2rem]"
            >
              <span className="text-white">Ubah Video Panjang</span>
              <br />
              <span className="text-gradient-blue">
                Menjadi Puluhan
              </span>{" "}
              <span className="text-white">Klip Viral</span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-xl text-lg leading-relaxed text-slate-400"
            >
              ClipForge AI memotong video YouTube, podcast & webinar jadi klip pendek{" "}
              <span className="font-semibold text-slate-200">format 9:16</span> siap
              upload ke TikTok, Reels & Shorts, otomatis tanpa editing manual.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="/login"
                className="cf-cta-pulse group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 px-7 py-3.5 text-base font-semibold text-white transition-transform duration-300 hover:scale-[1.03]"
              >
                Mulai Buat Klip Gratis
                <ArrowRight size={18} className="transition-transform duration-300 group-hover:translate-x-1" />
              </Link>
              <a
                href="#demo"
                className="inline-flex items-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-base font-medium text-slate-200 transition-all duration-300 hover:border-white/35 hover:bg-white/5"
              >
                <Play size={16} className="text-cyan-300" />
                Lihat Demo
              </a>
            </motion.div>

            <motion.div variants={fadeUp} className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {stats.map((s) => (
                <div
                  key={s.label}
                  className="glass-card group rounded-2xl p-4 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_0_30px_rgba(34,211,238,0.15)]"
                >
                  <div className="text-2xl font-extrabold sm:text-[1.7rem]">
                    {s.raw ? (
                      <span className="cf-num">{s.raw}</span>
                    ) : (
                      <Counter value={s.value ?? 0} decimals={s.decimals} suffix={s.suffix} />
                    )}
                  </div>
                  <div className="mt-1 text-[11px] font-medium tracking-wide text-slate-300 uppercase">
                    {s.label}
                  </div>
                  <div className="text-[10px] text-slate-500">{s.note}</div>
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
              className="relative rounded-3xl border border-white/10 bg-white/[0.03] p-4 backdrop-blur-sm"
            >
              <div className="flex items-center justify-between rounded-xl border border-white/10 bg-[#0B0D16] px-4 py-2.5">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Link2 size={14} className="text-cyan-300" />
                  https://youtube.com/watch?v=…
                </div>
                <span className="rounded-full bg-cyan-400/10 px-2.5 py-1 text-[10px] font-semibold text-cyan-300">
                  AUTO-CLIP
                </span>
              </div>

              <div className="mt-3 flex gap-3">
                <div className="relative w-2/5 overflow-hidden rounded-xl">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-600/60 via-purple-600/40 to-cyan-500/50" aria-hidden="true" />
                  <div className="absolute inset-0 flex items-center justify-center" aria-hidden="true">
                    <div className="grid h-12 w-12 place-items-center rounded-full border border-white/20 bg-black/40 backdrop-blur-sm">
                      <Play size={18} className="ml-0.5 text-white" />
                    </div>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#05060B] via-[#05060B]/60 to-transparent p-2.5">
                    <div className="text-[11px] font-bold text-white">
                      "Yang bikin orang <span className="text-cyan-300">STOP scroll…</span>"
                    </div>
                    <div className="text-[9px] text-purple-300">SUBTITLE HORMOZI • WORD-BY-WORD</div>
                  </div>
                  <div className="absolute top-2 left-2 rounded-full border border-white/20 bg-black/60 px-2 py-0.5 text-[9px] font-bold text-white">
                    FORMAT 9:16
                  </div>
                </div>
                <div className="flex w-3/5 flex-col gap-3">
                  {[
                    { label: "Momen 1", score: 92 },
                    { label: "Momen 2", score: 87 },
                    { label: "Momen 3", score: 84 },
                  ].map((m) => (
                    <div
                      key={m.label}
                      className="rounded-xl border border-white/[0.07] bg-white/[0.03] p-3 transition-colors duration-300 hover:border-purple-400/30"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-medium text-slate-200">{m.label}</span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-400/10 px-2 py-0.5 font-bold text-amber-300">
                          <Flame size={10} /> {m.score}
                        </span>
                      </div>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-purple-500"
                          style={{ width: `${m.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-500/15 to-purple-500/15 px-3 py-2.5 text-[11px]">
                    <span className="text-slate-300">Render 3 klip • 9:16</span>
                    <span className="font-bold text-cyan-300">1080p ✓</span>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -top-5 -right-4 rounded-2xl border border-white/10 bg-[#0B0D16]/95 px-4 py-3 shadow-[0_0_40px_rgba(168,85,247,0.25)]"
            >
              <div className="text-[10px] text-slate-400">Skor Momen Viral</div>
              <div className="text-xl font-extrabold text-amber-300">92/100</div>
            </motion.div>
          </motion.div>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-3">
          {trust.map((t) => (
            <span
              key={t}
              className="rounded-full border border-white/[0.08] bg-white/[0.03] px-4 py-2 text-xs font-medium text-slate-300"
            >
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
