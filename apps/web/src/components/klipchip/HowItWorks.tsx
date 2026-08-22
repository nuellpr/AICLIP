"use client";
import { motion } from "framer-motion";
import { Link2, Mic2, Sparkles, Crop, Type } from "lucide-react";
import { Reveal, stagger, fadeUp } from "./Reveal";

const steps = [
  { n: "01", title: "Paste link / upload", desc: "YouTube, Drive, atau file MP4. Kami download otomatis.", icon: Link2 },
  { n: "02", title: "Transcribe faster-whisper", desc: "Transkrip akurat + diarization. Cari hook & punchline.", icon: Mic2 },
  { n: "03", title: "Deteksi highlight AI", desc: "Skor viral per segmen. Pilih 8-15 klip terbaik.", icon: Sparkles },
  { n: "04", title: "Crop 9:16 & burn caption", desc: "Face-track + safe-area. Caption kata-per-kata.", icon: Crop },
];

export function HowItWorks() {
  return (
    <section id="cara-kerja" className="mx-auto max-w-[1160px] px-4 sm:px-6 py-6">
      <Reveal>
        <div className="text-center">
          <div className="inline-flex rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-black tracking-widest text-cyan-200">CARA KERJA</div>
          <h2 className="mx-auto mt-3 max-w-[720px] text-[28px] font-black tracking-tighter sm:text-[38px] text-white">3-4 langkah. Tanpa timeline.</h2>
          <p className="mx-auto mt-2 max-w-[640px] text-sm leading-6 text-white/55">Alur yang sama dipakai kreator podcast & webinar untuk panen Shorts tiap minggu.</p>
        </div>
      </Reveal>

      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }} className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s) => (
          <motion.div key={s.n} variants={fadeUp} className="group relative overflow-hidden rounded-[22px] border border-white/[0.07] bg-white/[0.03] p-5 backdrop-blur hover:border-cyan-400/25 hover:bg-white/[0.05] transition">
            <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-gradient-to-br from-cyan-400/20 to-lime-400/20 blur-2xl opacity-0 group-hover:opacity-100 transition" />
            <div className="flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-white text-black"><s.icon className="h-5 w-5" /></div>
              <span className="text-sm font-black tracking-widest text-white/15">{s.n}</span>
            </div>
            <div className="mt-4 text-[15px] font-black text-white">{s.title}</div>
            <div className="mt-1 text-sm leading-6 text-white/55">{s.desc}</div>
            <div className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-black text-black">
              {s.n === "04" ? <><Type className="h-3.5 w-3.5" /> 1080×1920</> : <>Otomatis</>}
            </div>
          </motion.div>
        ))}
      </motion.div>

      <Reveal delay={0.1}>
        <div className="mt-4 rounded-2xl border border-white/10 bg-gradient-to-r from-cyan-400/10 via-white/[0.02] to-lime-400/10 px-4 py-3 text-center text-xs font-bold tracking-wide text-white/60">
          Tips: aktifkan <span className="text-white">Auto-face tracking</span> untuk pembicara yang banyak bergerak, hasil tetap di tengah frame 9:16.
        </div>
      </Reveal>
    </section>
  );
}
