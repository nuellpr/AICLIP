"use client";

import { Link2, Sparkles, Download, Check, Upload } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp } from "./Reveal";

const steps = [
  {
    n: "01",
    icon: Link2,
    title: "Tempelkan Link Video",
    desc: "Paste link YouTube, podcast atau webinar, AI langsung memprosesnya. Format MP4, M4A & WebM didukung.",
    mock: (
      <div className="rounded-xl border border-white/10 bg-[#0B0D16] p-3">
        <div className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-2.5 text-xs text-slate-400">
          <Link2 size={14} className="text-cyan-300" />
          <span className="truncate">youtube.com/watch?v=9z…</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-500">
          <span>Aktif: YouTube • Podcast • Webinar</span>
          <Upload size={12} />
        </div>
      </div>
    ),
  },
  {
    n: "02",
    icon: Sparkles,
    title: "AI Deteksi Golden Moments",
    desc: "AI memindai seluruh durasi, menilai tiap momen dengan skor viral 0-100, lalu memilih bagian yang paling hook.",
    mock: (
      <div className="rounded-xl border border-white/10 bg-[#0B0D16] p-3">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-slate-400">Mendeteksi momen…</span>
          <span className="font-bold text-cyan-300">78%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
          <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-cyan-400 to-purple-500" />
        </div>
        <div className="mt-2.5 space-y-1.5">
          {[
            { t: "Momen 1 · pembuka menarik", s: 92 },
            { t: "Momen 2 · pertanyaan viral", s: 87 },
          ].map((m) => (
            <div key={m.t} className="flex items-center justify-between rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[10px]">
              <span className="flex min-w-0 items-center gap-1.5 text-slate-300">
                <Check size={11} className="shrink-0 text-emerald-400" />
                <span className="truncate">{m.t}</span>
              </span>
              <span className="font-bold text-amber-300">{m.s}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    n: "03",
    icon: Download,
    title: "Render & Unduh Klip",
    desc: "Klip 9:16 siap diunduh dalam Full HD 1080p dengan subtitle karaoke, langsung upload ke TikTok, Reels & Shorts.",
    mock: (
      <div className="rounded-xl border border-white/10 bg-[#0B0D16] p-3">
        <div className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.04] px-3 py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-emerald-400/15 text-emerald-400">
              <Download size={13} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[11px] font-medium text-slate-200">clip_01_9x16.mp4</div>
              <div className="text-[9px] text-slate-500">1080p • Karaoke • 480 KB</div>
            </div>
          </div>
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-400 text-[10px] font-bold text-black">
            ✓
          </span>
        </div>
        <div className="mt-2 rounded-lg bg-gradient-to-r from-blue-500/15 to-purple-500/15 py-2 text-center text-[10px] font-semibold text-white">
          Unduh Semua Klip
        </div>
      </div>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="cara-kerja" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <div className="mb-4 text-xs font-semibold tracking-[0.2em] text-purple-300 uppercase">
            Cara Kerja
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            Dari Link Panjang ke Klip Viral dalam <span className="text-gradient-blue">3 Langkah</span>
          </h2>
        </motion.div>

        <div className="relative grid gap-6 lg:grid-cols-3 lg:gap-8">
          <div
            className="pointer-events-none absolute top-1/2 left-0 hidden h-px w-full -translate-y-1/2 lg:block"
            style={{
              background:
                "linear-gradient(90deg, rgba(59,130,246,0.35), rgba(168,85,247,0.35), rgba(236,72,153,0.35))",
            }}
            aria-hidden="true"
          />

          {steps.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 32 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: i * 0.12, ease: [0.21, 0.47, 0.32, 0.98] }}
              className="glass-card group relative z-10 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_0_40px_rgba(168,85,247,0.15)]"
            >
              <div className="flex items-center gap-4">
                <span
                  className="bg-gradient-to-br from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-[2.6rem] leading-none font-extrabold text-transparent"
                >
                  {s.n}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 text-cyan-300">
                  <s.icon size={21} />
                </div>
              </div>
              <h3 className="mt-4 text-lg font-bold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.desc}</p>
              <div className="mt-5">{s.mock}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
