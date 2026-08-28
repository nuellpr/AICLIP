"use client";

import Link from "next/link";
import { Check, Crown } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { fadeUp } from "./Reveal";

const plans = [
  {
    name: "Paket Standar",
    price: "Rp 30.000",
    period: "/bulan",
    desc: "Untuk kreator yang mulai serius bikin konten viral",
    highlight: true,
    badge: "REKOMENDASI UTAMA",
    cta: "Pilih Paket Standar",
    benefits: [
      "Up to 30 kredit video per bulan",
      "AI Auto-Clipping & Skor Momen Viral",
      "Karaoke Subtitle Bahasa Indonesia",
      "Render 9:16 Full HD 1080p",
      "Tanpa watermark",
    ],
  },
  {
    name: "Paket Pro",
    price: "Rp 50.000",
    period: "/bulan",
    desc: "Untuk kreator yang produksi konten dalam skala besar",
    highlight: false,
    badge: "PALING HEMAT",
    cta: "Pilih Paket Pro",
    benefits: [
      "Up to 100 kredit video per bulan",
      "Semua fitur Paket Standar",
      "Multi Model AI Provider",
      "Render HD premium & prioritas",
      "Dukungan prioritas 1x24 jam",
    ],
  },
];

export default function Pricing() {
  const reduce = useReducedMotion();
  return (
    <section id="harga" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial={reduce ? false : "hidden"}
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <div className="mb-4 text-xs font-semibold tracking-[0.2em] text-pink-300 uppercase">
            Harga
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl">
            Mulai dari <span className="text-gradient-blue">Rp 30 Ribu</span>/bulan
          </h2>
          <p className="mt-4 text-slate-400">
            Lebih murah dari satu gelas kopi per hari, untuk ribuan views tambahan.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={reduce ? false : { opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
              className={`relative rounded-3xl p-[1.5px] ${
                p.highlight
                  ? "bg-gradient-to-b from-blue-400 via-purple-500/60 to-transparent shadow-[0_0_60px_rgba(59,130,246,0.18)]"
                  : "bg-white/[0.08]"
              }`}
            >
              <div
                className={`flex h-full flex-col rounded-[calc(1.5rem-1.5px)] p-8 ${
                  p.highlight ? "bg-[#0B0D16]" : "bg-[#0A0C12]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">
                    {p.name}
                    {p.highlight && <Crown size={15} className="ml-2 inline text-amber-300" />}
                  </h3>
                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-wider ${
                      p.highlight
                        ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white"
                        : "border border-white/15 bg-white/5 text-slate-300"
                    }`}
                  >
                    {p.badge}
                  </span>
                </div>

                <div className="mt-5 flex items-baseline gap-1">
                  <span className={`text-4xl font-extrabold ${p.highlight ? "text-gradient-blue" : "text-slate-200"}`}>
                    {p.price}
                  </span>
                  <span className="text-sm text-slate-400">{p.period}</span>
                </div>
                <p className="mt-2 text-sm text-slate-400">{p.desc}</p>

                <ul className="mt-6 flex-1 space-y-3">
                  {p.benefits.map((b) => (
                    <li key={b} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <span
                        className={`mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full ${
                          p.highlight ? "bg-cyan-400/15 text-cyan-300" : "bg-white/10 text-slate-300"
                        }`}
                      >
                        <Check size={11} />
                      </span>
                      {b}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className="cf-cta-pulse mt-8 block w-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 py-3.5 text-center text-sm font-bold text-white transition-transform duration-300 hover:scale-[1.02]"
                >
                  {p.cta}
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
