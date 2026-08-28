import type { Metadata } from "next";
import Link from "next/link";
import { ClipForgeLogo } from "@/components/clipforge/Logo";

export const metadata: Metadata = {
  title: "Kebijakan Privasi · ClipForge AI",
  description: "Bagaimana ClipForge AI mengumpulkan, menggunakan, dan melindungi data Anda.",
};

const sections: { h: string; p: string[] }[] = [
  {
    h: "1. Data yang Kami Kumpulkan",
    p: [
      "Data akun: nama, alamat email, dan foto profil saat Anda mendaftar melalui Google atau email. Jika Anda mendaftar melalui Google, kami menerima informasi dasar profil Google Anda.",
      "Konten yang Anda proses: tautan YouTube atau file video yang Anda unggah, serta hasil pemrosesannya (klip, subtitle, transkrip).",
      "Data penggunaan: informasi teknis seperti aktivitas penggunaan Layanan dan catatan transaksi pembayaran.",
    ],
  },
  {
    h: "2. Cara Kami Menggunakan Data",
    p: [
      "Data Anda kami gunakan untuk: menyediakan dan memproses Layanan (memotong video, membuat subtitle, menghasilkan klip), mengelola akun dan kredit, mengirim informasi layanan, serta meningkatkan kualitas Layanan.",
      "Kami tidak menjual data pribadi Anda kepada pihak ketiga.",
    ],
  },
  {
    h: "3. Pemrosesan oleh AI dan Pihak Ketiga",
    p: [
      "Untuk memproses video, Layanan menggunakan model AI dan layanan pihak ketiga (misalnya penyedia model bahasa dan speech-to-text). Bagian dari konten Anda, seperti subtitle atau transkrip, dapat dikirim ke penyedia tersebut semata-mata untuk menghasilkan klip yang Anda minta.",
      "Video Anda juga dapat diproses melalui API resmi YouTube untuk mengambil video dan subtitle sesuai permintaan Anda.",
    ],
  },
  {
    h: "4. Penyimpanan dan Keamanan",
    p: [
      "Data akun disimpan di basis data kami dengan langkah keamanan yang wajar. Hasil render klip disimpan di penyimpanan kami dan dapat diakses melalui tautan yang hanya Anda ketahui.",
      "Kami menyimpan konten hasil render selama akun Anda aktif. Menghapus klip akan menghapus file videonya secara permanen dari penyimpanan kami.",
    ],
  },
  {
    h: "5. Cookies dan Penyimpanan Lokal",
    p: [
      "Kami menggunakan penyimpanan lokal browser untuk menyimpan sesi login Anda dan preferensi tema. Kami tidak menggunakan cookie pelacakan iklan.",
    ],
  },
  {
    h: "6. Hak Anda",
    p: [
      "Anda dapat: mengakses dan memperbarui informasi profil Anda, menghapus klip dan proyek Anda, serta meminta penghapusan akun beserta seluruh data terkait melalui kontak dukungan kami.",
    ],
  },
  {
    h: "7. Privasi Anak",
    p: [
      "Layanan ini tidak ditujukan untuk anak di bawah 13 tahun dan kami tidak sengaja mengumpulkan data mereka.",
    ],
  },
  {
    h: "8. Perubahan Kebijakan",
    p: [
      "Kebijakan ini dapat kami perbarui dari waktu ke waktu. Versi terbaru selalu tersedia di halaman ini.",
    ],
  },
  {
    h: "9. Kontak",
    p: ["Pertanyaan mengenai privasi dapat dikirim ke support@forgeai.web.id."],
  },
];

export default function PrivacyPage() {
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
        <p className="text-sm font-semibold text-[#EA4C89]">Legal</p>
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-[var(--ink)]">Kebijakan Privasi</h1>
        <p className="mt-2 text-sm text-[var(--db-gray)]">Terakhir diperbarui: 29 Agustus 2026</p>

        <div className="mt-10 space-y-8">
          {sections.map((s) => (
            <section key={s.h}>
              <h2 className="text-xl font-bold text-[var(--ink)]">{s.h}</h2>
              {s.p.map((t, i) => (
                <p key={i} className="mt-2 leading-relaxed text-[var(--db-gray)]">
                  {t}
                </p>
              ))}
            </section>
          ))}
        </div>
      </article>

      <footer className="border-t border-[var(--db-line)] bg-[var(--db-panel)] py-6 text-center text-xs text-[var(--db-gray)]">
        © 2026 ClipForge AI ·{" "}
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
