import type { Metadata } from "next";
import Link from "next/link";
import { ClipForgeLogo } from "@/components/clipforge/Logo";

export const metadata: Metadata = {
  title: "Bantuan & Kontak · ClipForge AI",
  description: "Butuh bantuan? Hubungi tim ClipForge AI.",
};

const faqs: { q: string; a: string }[] = [
  {
    q: "Bagaimana cara membuat klip viral?",
    a: "Masuk ke dashboard, tempel link YouTube atau unggah video, lalu klik Buat Proyek. AI otomatis memilih momen terbaik, memotong format 9:16, dan memasang subtitle.",
  },
  {
    q: "Berapa kredit yang saya butuhkan?",
    a: "Satu kredit = satu proyek yang menghasilkan 3 klip. User baru mendapat 5 kredit gratis. Top-up tersedia di halaman Penagihan.",
  },
  {
    q: "Kenapa proyek saya gagal diproses?",
    a: "Proyek yang gagal karena kesalahan sistem akan otomatis mengembalikan kredit Anda. Jika kredit belum kembali, hubungi kami di email di bawah.",
  },
  {
    q: "Video apa saja yang bisa diproses?",
    a: "Link YouTube publik atau file video Anda sendiri (MP4, MOV, MKV, WebM, maks. 500MB). Pastikan Anda memiliki hak atas video yang diproses.",
  },
];

export default function BantuanPage() {
  return (
    <main className="min-h-screen bg-[var(--db-cream)]">
      <header className="border-b border-[var(--db-line)] bg-[var(--db-nav)]">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5 lg:px-8">
          <Link href="/home" aria-label="ClipForge AI">
            <ClipForgeLogo />
          </Link>
          <Link href="/home" className="text-sm font-medium text-[var(--ink)] transition-colors hover:text-[#EA4C89]">
            ← Beranda
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-3xl px-5 py-14 lg:px-8">
        <p className="text-sm font-semibold text-[#EA4C89]">Pusat Bantuan</p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-[var(--ink)]">Bantuan &amp; Kontak</h1>
        <p className="mt-3 leading-relaxed text-[var(--db-gray)]">
          Ada pertanyaan atau kendala? Tim kami siap membantu. Cara tercepat adalah mengirim email —
          biasanya kami balas dalam 1×24 jam.
        </p>

        <div className="mt-8 rounded-2xl border border-[var(--db-line)] bg-[var(--db-panel)] p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[var(--ink)]">Hubungi Kami</h2>
          <p className="mt-1 text-sm text-[var(--db-gray)]">Email dukungan resmi kami:</p>
          <a
            href="mailto:support@forgeai.web.id"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#0D0C22] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#EA4C89]"
          >
            support@forgeai.web.id
          </a>
        </div>

        <div className="mt-10 space-y-6">
          <h2 className="text-2xl font-extrabold tracking-tight text-[var(--ink)]">Pertanyaan Umum</h2>
          {faqs.map((f) => (
            <section key={f.q} className="rounded-2xl border border-[var(--db-line)] bg-[var(--db-panel)] p-5">
              <h3 className="font-bold text-[var(--ink)]">{f.q}</h3>
              <p className="mt-2 leading-relaxed text-[var(--db-gray)]">{f.a}</p>
            </section>
          ))}
        </div>
      </article>

      <footer className="border-t border-[var(--db-line)] bg-[var(--db-panel)] py-6 text-center text-xs text-[var(--db-gray)]">
        © 2026 ClipForge AI ·{" "}
        <Link href="/bantuan" className="hover:text-[#EA4C89]">
          Bantuan
        </Link>{" "}
        ·{" "}
        <Link href="/terms" className="hover:text-[#EA4C89]">
          Syarat Layanan
        </Link>{" "}
        ·{" "}
        <Link href="/privacy" className="hover:text-[#EA4C89]">
          Kebijakan Privasi
        </Link>
      </footer>
    </main>
  );
}
