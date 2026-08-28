"use client";

import { ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { fadeUp } from "./Reveal";

const faqs = [
  {
    q: "Video apa saja yang bisa diproses?",
    a: "Konten dari YouTube, podcast, webinar, dan file lokal (MP4, M4A, WebM). Cukup tempelkan link atau unggah file, AI akan memotong dan mengatur subtitle secara otomatis.",
  },
  {
    q: "Apa itu Skor Momen Viral?",
    a: "AI menganalisis seluruh durasi video lalu memberi nilai 0-100 pada tiap momen berdasarkan dorongan emosional, energi pembicara, dan potensi hook. Momen dengan skor tertinggi dijadikan klip.",
  },
  {
    q: "Apakah subtitle mendukung Bahasa Indonesia?",
    a: "Ya. Transkripsi & subtitle word-by-word tersedia dalam Bahasa Indonesia dengan akurasi 99.4%, lengkap dengan preset karaoke dan Hormozi.",
  },
  {
    q: "Format klip yang dihasilkan seperti apa?",
    a: "Video vertikal 9:16 Full HD 1080p dengan auto-reframe yang mengikuti wajah, siap langsung diunggah ke TikTok, Instagram Reels, dan YouTube Shorts tanpa editing tambahan.",
  },
];

export default function Faq() {
  return (
    <section id="faq" className="relative py-24 lg:py-32">
      <div className="mx-auto max-w-3xl px-5 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mb-12 text-center"
        >
          <div className="mb-4 text-xs font-semibold tracking-[0.2em] text-[#EA4C89] uppercase">
            FAQ
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-[#0D0C22] sm:text-4xl">
            Pertanyaan yang Sering Ditanya
          </h2>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((f, i) => (
            <motion.details
              key={f.q}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.4, delay: i * 0.06 }}
              className="group rounded-2xl border border-black/5 bg-white shadow-[0_6px_20px_-8px_rgba(13,12,34,0.08)] transition-colors duration-300 open:border-[#EA4C89] hover:border-black/15"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-6 py-5 text-sm font-semibold text-[#0D0C22] [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown
                  size={18}
                  className="shrink-0 text-[#EA4C89] transition-transform duration-300 group-open:rotate-180"
                />
              </summary>
              <p className="px-6 pb-5 text-sm leading-relaxed text-[#6E6D7A]">{f.a}</p>
            </motion.details>
          ))}
        </div>
      </div>
    </section>
  );
}
