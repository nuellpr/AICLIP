"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Reveal } from "./Reveal";

export function BeforeAfter() {
  const [pos, setPos] = useState(52);
  return (
    <section id="demo" className="mx-auto max-w-[1160px] px-4 sm:px-6 py-8">
      <Reveal>
        <div className="rounded-[28px] border border-white/[0.07] bg-white/[0.02] p-6 sm:p-8 backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="inline-flex rounded-full bg-white px-3 py-1 text-xs font-black tracking-widest text-black">BEFORE / AFTER</div>
              <h2 className="mt-3 text-[26px] font-black tracking-tighter text-white sm:text-[30px]">Dari landscape membosankan → vertikal siap viral</h2>
              <p className="mt-2 max-w-[560px] text-sm leading-6 text-white/55">Geser slider. Kiri: rekaman panjang 16:9. Kanan: hasil KlipChip 9:16 + caption burn-in.</p>
            </div>
            <div className="rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-bold text-white/60">Ganti dengan video kamu di <span className="text-white">/public/tutorial.mp4</span></div>
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
            {/* slider card */}
            <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-black">
              <div className="relative aspect-[16/10] overflow-hidden">
                {/* before */}
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-zinc-900 grid place-items-center">
                  <span className="rounded-full bg-white/10 border border-white/15 px-3 py-1 text-xs font-black tracking-widest text-white/70">16:9 • 00:42 / 61:18</span>
                </div>
                {/* after clip - revealed by slider */}
                <motion.div className="absolute inset-0 overflow-hidden border-l-2 border-white" style={{ width: `${pos}%` }}>
                  <div className="h-full w-full bg-gradient-to-br from-cyan-900/40 via-zinc-900 to-lime-900/30 flex items-center justify-center">
                    <div className="mx-auto w-[46%] rounded-[18px] border border-white/15 bg-black overflow-hidden shadow-xl">
                      <div className="aspect-[9/16] flex flex-col justify-end p-2 gap-1">
                        <div className="rounded-lg bg-black/70 border border-white/10 px-2 py-1.5">
                          <div className="text-[11px] font-black leading-none text-white">Hook: “Yang bikin orang</div>
                          <div className="text-[11px] font-black leading-none text-lime-300">STOP scroll itu 2 detik pertama”</div>
                        </div>
                        <div className="flex justify-between text-[9px] font-black tracking-widest text-white/60"><span>9:16</span><span>CAPTION ON</span></div>
                      </div>
                    </div>
                  </div>
                </motion.div>
                {/* handle */}
                <div className="absolute top-1/2 -translate-y-1/2" style={{ left: `calc(${pos}% - 18px)` }}>
                  <div className="grid h-9 w-9 place-items-center rounded-full bg-white text-black shadow-xl border-2 border-black">↔</div>
                </div>
              </div>
              <input type="range" min={5} max={95} value={pos} onChange={(e) => setPos(Number(e.target.value))} className="absolute bottom-0 left-0 right-0 h-10 opacity-0 cursor-ew-resize" aria-label="Before after slider" />
              <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.03] px-4 py-3 text-xs font-bold text-white/55">
                <span>16:9 long-form</span><span className="text-cyan-300">9:16 KlipChip • burn caption</span>
              </div>
            </div>

            {/* stats */}
            <div className="grid gap-3 content-start">
              {[
                { a: "Watch-time", b: "+42%", d: "vs upload mentah tanpa caption" },
                { a: "CTR thumbnail vertikal", b: "3.1×", d: "dibanding crop manual" },
                { a: "Waktu editing", b: "47 detik", d: "rata-rata untuk video 1 jam" },
              ].map((s) => (
                <div key={s.a} className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4">
                  <div className="text-xs font-black tracking-widest text-white/40">{s.a.toUpperCase()}</div>
                  <div className="mt-1 text-2xl font-black text-white">{s.b} <span className="text-sm font-bold text-white/40">· {s.d}</span></div>
                </div>
              ))}
              <div className="rounded-2xl bg-gradient-to-r from-cyan-400 to-lime-400 p-[1.5px]">
                <div className="rounded-[15px] bg-black px-4 py-3 text-sm font-bold text-white">Pipeline yang sama dipakai untuk <span className="text-cyan-300">download → transcribe → highlight → crop → caption</span></div>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
