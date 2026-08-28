"use client";

import {
  Scissors,
  Zap,
  LayoutGrid,
  Flame,
  Languages,
  Cpu,
  ArrowUpRight,
} from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp } from "./Reveal";

const features = [
  {
    icon: Scissors,
    title: "AI Auto-Clipping",
    desc: "Otomatis memotong video panjang menjadi puluhan klip pendek, bagian paling menarik hingga hook, tanpa perlu riset manual menit per menit.",
    span: "lg:col-span-2",
    grad: "from-cyan-400 to-blue-500",
    glow: "hover:shadow-[0_0_45px_rgba(34,211,238,0.18)]",
    extra: (
      <div className="mt-6 flex items-end gap-1.5" aria-hidden="true">
        {[35, 60, 45, 80, 50, 90, 65, 40, 75, 55, 85, 62, 45, 70].map((h, i) => (
          <motion.div
            key={i}
            className="w-full origin-bottom rounded-t-md bg-gradient-to-t from-cyan-500/25 to-purple-500/45 transition-colors duration-300 group-hover:from-cyan-500/40 group-hover:to-purple-500/65"
            style={{ height: `${h}%` }}
            animate={{ scaleY: [0.45, 1, 0.6, 0.95, 0.45] }}
            transition={{ duration: 2.2 + (i % 5) * 0.3, repeat: Infinity, ease: "easeInOut", delay: i * 0.08 }}
          />
        ))}
      </div>
    ),
  },
  {
    icon: Flame,
    title: "Skor Momen Viral",
    desc: "Setiap momen dinilai 0-100 dari pembicaraan, energi & hook, AI pilih yang paling berpotensi viral.",
    extra: (
      <div className="mt-5 text-center">
        <div className="mx-auto inline-flex items-center gap-1.5 rounded-full border border-amber-400/30 bg-amber-400/10 px-3.5 py-1.5 text-sm font-extrabold text-amber-300">
          <Flame size={14} /> 92/100
        </div>
      </div>
    ),
  },
  {
    icon: Zap,
    title: "Karaoke Subtitle Animasi",
    desc: "Subtitle word-by-word mengikuti suara, lengkap dengan preset Hormozi dan efek karaoke neon.",
  },
  {
    icon: LayoutGrid,
    title: "Beragam Mode Layout 9:16",
    desc: "Auto-reframe mengikuti wajah, plus mode teks dan split-screen, hasil tetap sharp di semua rasio 9:16.",
  },
  {
    icon: Languages,
    title: "Dukungan Bahasa Indonesia",
    desc: "Transcribe & subtitle akurat untuk konten Bahasa Indonesia, 99.4% akurasi word-level.",
  },
  {
    icon: Cpu,
    title: "Multi Model AI Provider",
    desc: "Beberapa model AI terbaik bisa dipilih sesuai kebutuhan, kualitas, kecepatan, atau hemat biaya.",
  },
];

export default function Features() {
  return (
    <section id="fitur" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <div className="mb-4 text-xs font-semibold tracking-[0.2em] text-cyan-300 uppercase">
            Fitur
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            Semua yang Kamu Butuhkan,{" "}
            <span className="text-gradient-blue">Otomatis</span>
          </h2>
          <p className="mt-4 text-slate-400">
            Enam kekuatan utama di balik setiap klip viral buatan ClipForge AI.
          </p>
        </motion.div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
              className={`glass-card group relative flex flex-col overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1.5 ${f.span ?? ""} ${f.glow}`}
            >
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/[0.04] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <div
                className={`relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.grad} text-white shadow-lg transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110`}
              >
                <f.icon size={23} />
              </div>
              <h3 className="relative mt-4 text-lg font-bold text-white">{f.title}</h3>
              <p className="relative mt-2 flex-1 text-sm leading-relaxed text-slate-400">
                {f.desc}
              </p>
              {f.extra && <div className="relative">{f.extra}</div>}

              <ArrowUpRight
                size={18}
                className="absolute top-5 right-5 text-slate-500 opacity-0 transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
