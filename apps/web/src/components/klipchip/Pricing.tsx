"use client";
import Link from "next/link";
import { Check } from "lucide-react";
import { Reveal } from "./Reveal";

export function Pricing() {
  return (
    <section id="harga" className="mx-auto max-w-[1160px] px-4 sm:px-6 py-8">
      <Reveal>
        <div className="text-center">
          <div className="inline-flex rounded-full border border-lime-400/20 bg-lime-400/10 px-3 py-1 text-xs font-black tracking-widest text-lime-200">PRICING</div>
          <h2 className="mt-3 text-[26px] font-black tracking-tighter text-white sm:text-[32px]">Mulai gratis, scale saat butuh</h2>
          <p className="mx-auto mt-2 max-w-[640px] text-sm leading-6 text-white/55">Pilih paket sesuai ritme publish kamu. Semua bisa mulai dari gratis.</p>
        </div>
      </Reveal>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        {[
          { name: "Starter", price: "Rp 0", sub: "/ bulan", cta: "Coba Gratis", featured: false, feats: ["3 klip gratis", "faster-whisper ID • max 30m", "1 gaya caption", "Watermark KlipChip"] },
          { name: "Creator", price: "Rp 149rb", sub: "/ bulan", cta: "Mulai Creator", featured: true, feats: ["150 menit / bulan", "Auto highlight + skor viral", "3 gaya caption + burn-in", "Export 1080×1920 tanpa watermark"] },
          { name: "Pro", price: "Coming Soon", sub: "", cta: "Join Waitlist", featured: false, feats: ["600 menit / bulan", "Batch link & API", "Custom font & brand kit", "Prioritas render"] },
        ].map((p) => (
          <div key={p.name} className={`relative rounded-[24px] border p-6 flex flex-col ${p.featured ? "border-cyan-400/30 bg-gradient-to-b from-cyan-400/10 to-lime-400/10 shadow-[0_0_40px_rgba(34,211,238,0.18)]" : "border-white/10 bg-white/[0.03]"}`}>
            {p.featured && <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-xs font-black tracking-widest text-black">PALING POPULER</div>}
            <div className="text-sm font-black tracking-widest text-white/50">{p.name.toUpperCase()}</div>
            <div className="mt-2 flex items-baseline gap-2"><span className={`text-[28px] font-black tracking-tighter ${p.featured ? "bg-gradient-to-r from-cyan-300 to-lime-300 bg-clip-text text-transparent" : "text-white"}`}>{p.price}</span><span className="text-sm font-bold text-white/40">{p.sub}</span></div>
            <ul className="mt-5 space-y-2.5">
              {p.feats.map((f) => (
                <li key={f} className="flex gap-2 text-sm text-white/70"><span className="mt-0.5 grid h-5 w-5 place-items-center rounded-full bg-lime-400 text-black"><Check className="h-3.5 w-3.5" /></span>{f}</li>
              ))}
            </ul>
            <Link href={p.cta === "Join Waitlist" ? "#cta" : "/login"} className={`mt-6 inline-flex justify-center rounded-full px-5 py-3 text-sm font-black transition ${p.featured ? "bg-white text-black hover:bg-white/90" : "bg-white/10 text-white hover:bg-white/15 border border-white/10"}`}>{p.cta}</Link>
          </div>
        ))}
      </div>
    </section>
  );
}
