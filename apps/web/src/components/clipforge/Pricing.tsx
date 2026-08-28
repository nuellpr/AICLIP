"use client";

import Link from "next/link";
import { Check, Crown } from "lucide-react";
import { motion } from "framer-motion";
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
  return (
    <section id="harga" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-7xl px-5 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mx-auto mb-16 max-w-2xl text-center"
        >
          <div className="mb-4 text-xs font-semibold tracking-[0.2em] text-[#EA4C89] uppercase">
            Harga
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-5xl">
            Mulai dari <span className="text-[#EA4C89]">Rp 30 Ribu</span>/bulan
          </h2>
          <p className="mt-4 text-[var(--db-gray)]">
            Lebih murah dari satu gelas kopi per hari, untuk ribuan views tambahan.
          </p>
        </motion.div>

        <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-2">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.55, delay: i * 0.1, ease: [0.21, 0.47, 0.32, 0.98] }}
              whileHover={{ y: -8 }}
              className={`relative flex h-full flex-col rounded-3xl bg-[var(--db-panel)] p-8 transition-shadow duration-300 hover:shadow-[0_25px_60px_-15px_rgba(13,12,34,0.15)] ${
                p.highlight
                  ? "border-2 border-[#EA4C89] shadow-[0_20px_50px_-15px_rgba(234,76,137,0.25)]"
                  : "border border-[var(--db-line)] shadow-[0_10px_30px_-12px_rgba(13,12,34,0.08)]"
              }`}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-[var(--ink)]">
                  {p.name}
                  {p.highlight && <Crown size={15} className="ml-2 inline text-[#EA4C89]" />}
                </h3>
                <span
                  className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-wider ${
                    p.highlight
                      ? "bg-[#EA4C89] text-white"
                      : "bg-[var(--db-cream)] text-[var(--ink)]"
                  }`}
                >
                  {p.badge}
                </span>
              </div>

              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-extrabold text-[var(--ink)]">
                  {p.price}
                </span>
                <span className="text-sm text-[var(--db-gray)]">{p.period}</span>
              </div>
              <p className="mt-2 text-sm text-[var(--db-gray)]">{p.desc}</p>

              <ul className="mt-6 flex-1 space-y-3">
                {p.benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-[var(--ink)]">
                    <span className="mt-0.5 flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-[#EA4C89] text-white">
                      <Check size={11} />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className={`mt-8 block w-full rounded-full py-3.5 text-center text-sm font-bold text-white transition-all duration-300 hover:scale-[1.02] ${
                  p.highlight
                    ? "cf-cta-pulse bg-[#EA4C89] hover:bg-[#C32361]"
                    : "bg-[#0D0C22] hover:bg-[#EA4C89]"
                }`}
              >
                {p.cta}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
