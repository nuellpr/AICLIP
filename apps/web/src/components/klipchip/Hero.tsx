"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { KlipChipBadge } from "./Logo";
import { Reveal } from "./Reveal";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="klipchip-mesh" />
      <div className="klipchip-grid absolute inset-0 opacity-[0.35]" />
      {/* subtle glow orbs */}
      <div className="pointer-events-none absolute -top-28 left-1/2 h-[520px] w-[880px] -translate-x-1/2 rounded-full bg-gradient-to-r from-cyan-500/15 to-lime-400/15 blur-[80px]" />

      <div className="relative mx-auto max-w-[1160px] px-4 pb-10 pt-10 sm:px-6 sm:pt-14 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
          {/* copy */}
          <div className="text-center lg:text-left">
            <Reveal>
              <KlipChipBadge />
            </Reveal>

            <Reveal delay={0.08}>
              <h1 className="mt-5 text-[36px] font-black leading-[0.95] tracking-[-0.04em] sm:text-[54px] lg:text-[62px]">
                <span className="text-white">Long video</span>
                <br />
                <span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-lime-300 bg-clip-text text-transparent">jadi Short viral</span>
                <br />
                <span className="text-white/90">dalam detik.</span>
              </h1>
            </Reveal>

            <Reveal delay={0.14}>
              <p className="mx-auto mt-5 max-w-[560px] text-[15px] leading-7 text-white/60 sm:text-[16px] lg:mx-0">
                KlipChip <span className="font-semibold text-white">Instant Clip</span>, ubah podcast, webinar & video panjang jadi klip vertikal 9:16 otomatis. Transcribe <span className="text-white/80">faster-whisper</span> → deteksi highlight → crop AI → burn caption.
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-7 flex flex-col items-center gap-3 sm:flex-row lg:justify-start justify-center">
                <Link href="/login" className="group inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-[15px] font-black text-black hover:bg-white/90 transition">
                  Mulai Sekarang, Gratis
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <a href="#demo" className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-7 py-4 text-sm font-bold text-white backdrop-blur hover:bg-white/[0.08] transition">
                  <Play className="h-4 w-4 fill-white" />
                  Lihat demo 30s
                </a>
              </div>
              <p className="mt-3 text-xs font-medium tracking-wide text-white/40">Tanpa kartu kredit • Export tanpa watermark • 3 clip gratis</p>
            </Reveal>

            {/* trust */}
            <Reveal delay={0.26} className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <span className="text-xs font-bold tracking-widest text-white/30">DIPERCAYA KREATOR:</span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-white/55">PodcastID</span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-white/55">KelasBicara</span>
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs font-semibold text-white/55">WebinarPro</span>
            </Reveal>
          </div>

          {/* mockup */}
          <Reveal delay={0.12} className="relative mx-auto w-full max-w-[520px] lg:mx-0 lg:ml-auto">
            <div className="relative rounded-[28px] border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.02] p-3 shadow-[0_20px_80px_rgba(0,0,0,0.6),0_0_40px_rgba(34,211,238,0.18)] backdrop-blur-xl">
              {/* browser bar */}
              <div className="flex items-center gap-1.5 rounded-t-[18px] bg-black/40 px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
                <span className="ml-3 hidden sm:inline text-xs font-medium text-white/40">youtube.com/watch?v=long-form…</span>
              </div>

              <div className="grid gap-3 bg-black rounded-b-[18px] p-3 sm:grid-cols-[1.45fr_0.85fr]">
                {/* left long */}
                <div className="relative overflow-hidden rounded-2xl bg-zinc-900">
                  <div className="aspect-[16/10] bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                    <span className="text-xs tracking-widest font-bold text-white/25">16:9 LONG FORM</span>
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 rounded-xl bg-black/70 backdrop-blur px-3 py-2 border border-white/10">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-cyan-300"><Sparkles className="h-3.5 w-3.5" /> AI mendeteksi 12 highlight</div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-white/15 overflow-hidden"><motion.div initial={{ width: "0%" }} whileInView={{ width: "78%" }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.4, ease: "easeOut" }} className="h-full bg-gradient-to-r from-cyan-400 to-lime-400" /></div>
                  </div>
                </div>

                {/* right shorts */}
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-1">
                  {[
                    { t: "00:42 · Hook kuat", s: "94", c: "from-cyan-400 to-teal-400" },
                    { t: "04:18 · Story punch", s: "88", c: "from-lime-400 to-cyan-400" },
                    { t: "11:05 · Insight", s: "91", c: "from-cyan-400 to-lime-400" },
                  ].map((k) => (
                    <div key={k.t} className="relative overflow-hidden rounded-2xl bg-zinc-900 border border-white/10">
                      <div className="aspect-[9/12] bg-gradient-to-br from-zinc-800 via-zinc-900 to-black p-2 flex flex-col justify-end">
                        <div className="rounded-lg bg-black/60 backdrop-blur px-2 py-1.5 border border-white/10">
                          <div className="text-[10px] font-black leading-none text-white">{k.t}</div>
                          <div className="mt-1 flex items-center gap-1 text-[10px] font-bold text-white/60">Skor <span className={`bg-gradient-to-r ${k.c} bg-clip-text text-transparent`}>{k.s}</span></div>
                        </div>
                      </div>
                      <div className="absolute inset-x-2 top-2 flex justify-between">
                        <span className="rounded-full bg-black/70 px-2 py-1 text-[9px] font-black tracking-widest text-white border border-white/10">9:16</span>
                        <span className="rounded-full bg-white px-2 py-1 text-[9px] font-black text-black">CAPTION ON</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* floating stat */}
              <motion.div initial={{ y: 8, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.6, duration: 0.6 }} className="absolute -bottom-4 -left-2 sm:-left-6 rounded-2xl border border-white/10 bg-[#0A0B0F] px-4 py-3 shadow-xl">
                <div className="text-[11px] font-bold tracking-widest text-white/40">WAKTU PROSES</div>
                <div className="text-lg font-black text-white">47 detik <span className="text-sm font-bold text-lime-400">• 1h video</span></div>
              </motion.div>
              <motion.div initial={{ y: 8, opacity: 0 }} whileInView={{ y: 0, opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.7, duration: 0.6 }} className="absolute -right-2 -top-3 hidden sm:flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 backdrop-blur">
                <span className="h-2 w-2 rounded-full bg-lime-400 animate-pulse" />
                <span className="text-xs font-black text-cyan-200">faster-whisper • aktif</span>
              </motion.div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
