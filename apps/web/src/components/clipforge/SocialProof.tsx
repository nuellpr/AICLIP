"use client";

import { Reveal } from "./Reveal";

const stats = [
  { value: "13.2K+", label: "Klip viral dibuat" },
  { value: "3.8K+", label: "Kreator aktif" },
  { value: "178K+", label: "Total views dihasilkan" },
  { value: "98%", label: "Render sukses" },
];

const testimonials = [
  {
    quote:
      "Podcast 1 jam saya jadi 8 klip vertikal lengkap dengan subtitle karaoke. yang biasanya makan waktu semalaman sekarang 15 menit.",
    name: "Rizky P.",
    role: "Podcaster",
  },
  {
    quote:
      "Fitur hook intro-nya gila sih. Klip langsung ada pembukanya tanpa harus edit manual, views Reels saya naik 3x lipat.",
    name: "Dinda A.",
    role: "Content Creator",
  },
  {
    quote:
      "Upload MP4 langsung tanpa perlu YouTube dulu, terus render-nya cepat banget. kredit juga gak hangus kalau render gagal.",
    name: "Bagas W.",
    role: "Gaming Channel",
  },
];

export default function SocialProof() {
  return (
    <section className="relative px-5 py-20 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <Reveal>
          <div className="grid grid-cols-2 gap-6 rounded-[2rem] border border-[var(--db-line)] bg-[var(--db-panel)] p-8 sm:grid-cols-4 sm:p-10">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-3xl font-extrabold tracking-tight text-[#EA4C89] sm:text-4xl">
                  {s.value}
                </div>
                <div className="mt-1 text-xs font-medium text-[var(--db-gray)] sm:text-sm">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal className="mt-16">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-[var(--ink)] sm:text-4xl">
            Dipercaya Kreator{" "}
            <span className="text-[#EA4C89]">Indonesia</span>
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-[var(--db-gray)]">
            Dari podcaster sampai gaming channel &mdash; klip mereka siap upload dalam hitungan menit.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {testimonials.map((t) => (
            <Reveal key={t.name}>
              <figure className="flex h-full flex-col rounded-2xl border border-[var(--db-line)] bg-[var(--db-panel)] p-6">
                <blockquote className="flex-1 text-sm leading-relaxed text-[var(--ink)]/85">
                  &ldquo;{t.quote}&rdquo;
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#EA4C89]/15 text-sm font-bold text-[#EA4C89]">
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-[var(--ink)]">{t.name}</div>
                    <div className="text-xs text-[var(--db-gray)]">{t.role}</div>
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
