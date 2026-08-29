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
      <div className="rounded-xl bg-[var(--db-cream)] p-3">
        <div className="flex items-center gap-2 rounded-lg bg-[var(--db-panel)] px-3 py-2.5 text-xs text-[var(--db-gray)] shadow-sm">
          <Link2 size={14} className="text-[#EA4C89]" />
          <span className="truncate">youtube.com/watch?v=9z…</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-[10px] text-[var(--db-gray)]">
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
      <div className="rounded-xl bg-[var(--db-cream)] p-3">
        <div className="flex items-center justify-between text-[10px]">
          <span className="text-[var(--db-gray)]">Mendeteksi momen…</span>
          <span className="font-bold text-[#EA4C89]">78%</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--db-panel)]">
          <div className="h-full w-[78%] rounded-full bg-[#EA4C89]" />
        </div>
        <div className="mt-2.5 space-y-1.5">
          {[
            { t: "Momen 1 · pembuka menarik", s: 92 },
            { t: "Momen 2 · pertanyaan viral", s: 87 },
          ].map((m) => (
            <div key={m.t} className="flex items-center justify-between rounded-lg bg-[var(--db-panel)] px-2.5 py-1.5 text-[10px] shadow-sm">
              <span className="flex min-w-0 items-center gap-1.5 text-[var(--ink)]">
                <Check size={11} className="shrink-0 text-[#EA4C89]" />
                <span className="truncate">{m.t}</span>
              </span>
              <span className="font-bold text-[#EA4C89]">{m.s}</span>
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
      <div className="rounded-xl bg-[var(--db-cream)] p-3">
        <div className="flex items-center justify-between gap-2 rounded-lg bg-[var(--db-panel)] px-3 py-2.5 shadow-sm">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--db-mint)] text-[var(--ink)]">
              <Download size={13} />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[11px] font-medium text-[var(--ink)]">clip_01_9x16.mp4</div>
              <div className="text-[9px] text-[var(--db-gray)]">1080p • Karaoke • 480 KB</div>
            </div>
          </div>
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#EA4C89] text-[10px] font-bold text-white">
            ✓
          </span>
        </div>
        <div className="mt-2 rounded-lg bg-[#0D0C22] py-2 text-center text-[10px] font-semibold text-white">
          Unduh Semua Klip
        </div>
      </div>
    ),
  },
];

export default function HowItWorks() {
  return (
    <section id="cara-kerja" className="relative bg-[var(--db-cream)] py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <div className="mb-4 text-xs font-semibold tracking-[0.2em] text-[#EA4C89] uppercase">
            Cara Kerja
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-5xl">
            Dari Link Panjang ke Klip Viral dalam <span className="text-[#EA4C89]">3 Langkah</span>
          </h2>
        </motion.div>

        <div className="relative grid gap-6 lg:grid-cols-3 lg:gap-8">
          <div
            className="pointer-events-none absolute top-1/2 left-0 hidden h-px w-full -translate-y-1/2 lg:block"
            style={{
              background:
                "linear-gradient(90deg, rgba(234,76,137,0.25), rgba(231,228,249,0.9), rgba(234,76,137,0.25))",
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
              className="glass-card group relative z-10 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-1.5"
            >
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#EA4C89] text-lg font-extrabold text-white">
                  {s.n}
                </span>
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--db-lavender)] text-[var(--ink)]">
                  <s.icon size={21} />
                </div>
              </div>
              <h3 className="mt-4 text-lg font-bold text-[var(--ink)]">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--db-gray)]">{s.desc}</p>
              <div className="mt-5">{s.mock}</div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
