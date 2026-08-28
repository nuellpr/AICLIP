import type { Metadata } from "next";
import Link from "next/link";
import { ClipForgeLogo } from "@/components/clipforge/Logo";

export const metadata: Metadata = {
  title: "Syarat Layanan · ClipForge AI",
  description: "Syarat layanan penggunaan ClipForge AI.",
};

const sections: { h: string; p: string[] }[] = [
  {
    h: "1. Penerimaan Syarat",
    p: [
      "Dengan mengakses atau menggunakan ClipForge AI (\"Layanan\"), Anda menyetujui Syarat Layanan ini. Jika Anda tidak menyetujui syarat ini, mohon untuk tidak menggunakan Layanan.",
    ],
  },
  {
    h: "2. Deskripsi Layanan",
    p: [
      "ClipForge AI adalah layanan yang mengubah video panjang (tautan YouTube atau file unggahan Anda) menjadi klip pendek siap unggah menggunakan pemrosesan otomatis berbasis AI, termasuk pemotongan momen terbaik, subtitle, dan efek suara.",
    ],
  },
  {
    h: "3. Akun Pengguna",
    p: [
      "Anda bertanggung jawab menjaga kerahasiaan akun Anda dan seluruh aktivitas yang terjadi melalui akun tersebut. Anda harus memberikan informasi yang akurat dan diperbarui.",
    ],
  },
  {
    h: "4. Kredit dan Pembayaran",
    p: [
      "Penggunaan Layanan berbasis kredit. Satu kredit menghasilkan satu proyek yang menghasilkan beberapa klip. Kredit yang sudah dipakai untuk proyek yang selesai tidak dapat dikembalikan. Kredit akan dikembalikan secara otomatis apabila proyek gagal diproses karena kesalahan sistem kami.",
      "Harga dan paket dapat berubah sewaktu-waktu dengan pemberitahuan di halaman harga. Pembayaran diproses melalui mitra pembayaran pihak ketiga.",
    ],
  },
  {
    h: "5. Konten Anda dan Hak Cipta",
    p: [
      "Anda menyatakan bahwa Anda memiliki hak atau izin yang sah atas setiap video yang Anda proses melalui Layanan, termasuk kepatuhan terhadap Ketentuan Layanan YouTube dan hak cipta pihak ketiga.",
      "Anda mempertahankan kepemilikan atas konten Anda. Klip hasil pemrosesan adalah milik Anda dan Anda bertanggung jawab penuh atas penggunaannya. Kami tidak menanggung tanggung jawab atas klaim pelanggaran hak cipta yang timbul dari konten yang Anda proses atau unggah.",
    ],
  },
  {
    h: "6. Penggunaan yang Dilarang",
    p: [
      "Anda dilarang menggunakan Layanan untuk: konten yang melanggar hukum, konten yang melanggar hak cipta pihak lain tanpa izin, penyebaran informasi yang menyesatkan, konten kekerasan atau kebencian, serta upaya merekayasa balik, mengganggu, atau membebani sistem kami secara tidak wajar.",
      "Pelanggaran dapat mengakibatkan pembekuan akun dan kredit tanpa pengembalian dana.",
    ],
  },
  {
    h: "7. Batasan Layanan",
    p: [
      "Layanan disediakan \"sebagaimana adanya\". Kami berupaya menjaga ketersediaan Layanan, namun kami tidak menjamin layanan bebas dari gangguan, dan tidak bertanggung jawab atas kerugian tidak langsung yang timbul dari penggunaan Layanan.",
      "Hasil pemrosesan AI bersifat otomatis dan mungkin tidak selalu sempurna. Anda bertanggung jawab memeriksa hasil sebelum mempublikasikannya.",
    ],
  },
  {
    h: "8. Penghentian",
    p: [
      "Kami dapat menangguhkan atau menghentikan akses Anda apabila Anda melanggar syarat ini. Anda dapat berhenti menggunakan Layanan kapan saja dan meminta penghapusan akun beserta datanya.",
    ],
  },
  {
    h: "9. Perubahan Syarat",
    p: [
      "Kami dapat memperbarui Syarat Layanan ini dari waktu ke waktu. Perubahan berlaku sejak dipublikasikan di halaman ini.",
    ],
  },
  {
    h: "10. Kontak",
    p: ["Pertanyaan mengenai syarat ini dapat dikirim melalui email dukungan kami."],
  },
];

export default function TermsPage() {
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
        <h1 className="mt-1 text-4xl font-extrabold tracking-tight text-[var(--ink)]">Syarat Layanan</h1>
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
