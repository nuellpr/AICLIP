"use client";
import { Clock3, Scissors, TrendingDown } from "lucide-react";
import { Reveal } from "./Reveal";

export function ProblemSolution() {
  return (
    <section className="mx-auto max-w-[1160px] px-4 sm:px-6 py-12 sm:py-16">
      <Reveal>
        <div className="rounded-[28px] border border-white/[0.07] bg-white/[0.02] p-6 sm:p-8 backdrop-blur">
          <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div>
              <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-[11px] font-black tracking-widest text-white/50">PROBLEM → SOLUTION</div>
              <h2 className="mt-3 text-[28px] font-black leading-tight tracking-tighter sm:text-[34px] text-white">
                Editing manual <span className="text-white/40">makan jam.</span> KlipChip <span className="bg-gradient-to-r from-cyan-300 to-lime-300 bg-clip-text text-transparent">makan detik.</span>
              </h2>
              <p className="mt-3 text-sm leading-6 text-white/55">Kamu upload podcast 1 jam, AI cari momen emas, crop wajah tetap di tengah, dan burn caption kata-per-kata. Tidak perlu timeline.</p>
              <div className="mt-6 grid gap-3">
                {[
                  { icon: Clock3, t: "8 jam → 3 menit", d: "Cari highlight manual capek. AI scan transkrip faster-whisper." },
                  { icon: Scissors, t: "Crop 9:16 otomatis", d: "Face-tracking, bukan crop tengah buta." },
                  { icon: TrendingDown, t: "Caption yang nahan watch-time", d: "Gaya Hormozi pop-up, sinkron kata, tanpa gosong." },
                ].map((i) => (
                  <div key={i.t} className="flex gap-3 rounded-2xl border border-white/5 bg-black/20 px-4 py-3">
                    <div className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-white text-black"><i.icon className="h-4 w-4" /></div>
                    <div>
                      <div className="text-sm font-bold text-white">{i.t}</div>
                      <div className="text-xs leading-5 text-white/50">{i.d}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { k: "Sebelum", items: ["Nonton ulang 60 menit", "Catat timestamp manual", "Crop & caption di CapCut", "Upload satu-per-satu"], bad: true },
                { k: "Sesudah KlipChip", items: ["Paste link YouTube", "AI pilih 8-15 klip", "9:16 + caption jadi", "Download ZIP / post"], bad: false },
              ].map((col) => (
                <div key={col.k} className={`rounded-[20px] border p-5 ${col.bad ? "border-white/5 bg-white/[0.02]" : "border-cyan-400/20 bg-gradient-to-b from-cyan-400/[0.08] to-lime-400/[0.06] shadow-[0_0_30px_rgba(34,211,238,0.12)]"}`}>
                  <div className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-black tracking-widest ${col.bad ? "bg-white/10 text-white/60" : "bg-white text-black"}`}>{col.k}</div>
                  <ul className="mt-4 space-y-2.5">
                    {col.items.map((t) => (
                      <li key={t} className="flex gap-2 text-sm text-white/70">
                        <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${col.bad ? "bg-white/25" : "bg-lime-400 shadow-[0_0_8px_rgba(163,230,53,0.8)]"}`} />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
              <div className="sm:col-span-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-3 text-center text-xs font-bold tracking-wide text-white/60">
                Pipeline: <span className="text-white">download → transcribe → highlight → crop → burn caption</span>
              </div>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
