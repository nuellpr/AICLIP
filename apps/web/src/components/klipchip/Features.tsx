"use client";
import { motion } from "framer-motion";
import { ScanSearch, Captions, Smartphone, Zap } from "lucide-react";
import { Reveal, stagger, fadeUp } from "./Reveal";

const feats = [
  { icon: ScanSearch, title: "Auto highlight detection", desc: "Skor hook, emosi, dan densitas insight per kalimat. Bukan random cut.", pill: "Skor 0-100" },
  { icon: Captions, title: "Caption otomatis", desc: "Word-by-word, gaya Hormozi / Karaoke. Sinkron sempurna.", pill: "ID + EN" },
  { icon: Smartphone, title: "Crop 9:16 pintar", desc: "Face-tracking + safe-area TikTok/Reels. Blur / fill opsional.", pill: "1080×1920" },
  { icon: Zap, title: "Export cepat", desc: "Render paralel & ZIP. Publish langsung tanpa watermark.", pill: "~40s / clip" },
];

export function Features() {
  return (
    <section id="fitur" className="mx-auto max-w-[1160px] px-4 sm:px-6 py-8">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-black tracking-widest text-white/60">FITUR UNGGULAN</div>
            <h2 className="mt-3 text-[26px] font-black tracking-tighter text-white sm:text-[32px]">Semua yang kamu butuh untuk panen Shorts</h2>
          </div>
          <p className="max-w-[420px] text-sm leading-6 text-white/55">Dirancang untuk kreator yang publish 5-7 klip per hari, bukan sekadar auto-cut.</p>
        </div>
      </Reveal>

      <motion.div variants={stagger} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.18 }} className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {feats.map((f) => (
          <motion.div key={f.title} variants={fadeUp} className="relative overflow-hidden rounded-[22px] border border-white/[0.07] bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 backdrop-blur">
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-400/[0.06] to-lime-400/[0.06] opacity-0 hover:opacity-100 transition" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-white text-black shadow"><f.icon className="h-5 w-5" /></div>
                <span className="rounded-full bg-black border border-white/10 px-2.5 py-1 text-[11px] font-black tracking-wide text-white/80">{f.pill}</span>
              </div>
              <div className="mt-4 text-[15px] font-black text-white">{f.title}</div>
              <div className="mt-1 text-sm leading-6 text-white/55">{f.desc}</div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
