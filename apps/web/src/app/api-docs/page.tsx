export default function ApiDocsPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">Pengenalan - Dokumentasi API</h1>
        <p className="text-xl text-zinc-400 leading-relaxed">
          API untuk pemrosesan video panjang yang cepat dan andal. Ubah podcast, webinar, livestream, tutorial, video ecommerce, dan lainnya menjadi klip, ringkasan, transkrip, dan momen yang dapat dicari.
        </p>
      </div>

      <div className="space-y-8">
        <section className="bg-[#111113] border border-zinc-800 rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-white mb-4">AI Clipping API</h2>
          <p className="text-zinc-400 mb-4 leading-relaxed">
            Kirimkan video dengan panjang berapa pun dan terima semua klip viral yang diurutkan berdasarkan potensi viral. Setiap klip menyertakan stempel waktu awal/akhir yang terdeteksi otomatis, judul, deskripsi, dan tagar yang dihasilkan AI.
          </p>
          <p className="text-zinc-400 leading-relaxed">
            API ini bekerja untuk semua konten mulai dari video pendek hingga video berdurasi berjam-jam. Jika ekspor diaktifkan, respons juga menyertakan tautan unduhan video yang telah dirender untuk setiap klip, dengan opsi auto-reframe yang menjaga subjek utama tetap di tengah.
          </p>
        </section>

        <section className="bg-[#111113] border border-zinc-800 rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-white mb-4">Sumber Video yang Didukung</h2>
          <p className="text-zinc-400 leading-relaxed">
            API menerima URL dari platform berikut: YouTube, Vimeo, Dailymotion, Kick, Twitch, TikTok, Facebook, Zoom, Rumble, dan lainnya.
          </p>
        </section>
        
        <section className="bg-[#111113] border border-zinc-800 rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-white mb-4">Batas Laju (Rate Limit)</h2>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            Anda dapat memiliki hingga <strong className="text-white">5</strong> proyek yang berjalan secara bersamaan. Mengirimkan tugas baru ketika Anda sudah memiliki 5 proyek aktif akan menghasilkan respons <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-sm text-zinc-200">429 Too Many Requests</code>.
          </p>
          <div className="bg-[#09090b] border border-zinc-800 rounded-lg overflow-hidden">
            <div className="bg-zinc-900/50 px-4 py-2 border-b border-zinc-800">
              <span className="text-xs font-medium text-zinc-400">Contoh Respons 429</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <pre className="text-sm text-zinc-300 font-mono leading-relaxed"><code>{`{
  "timestamp": "2026-03-10T15:52:01.610+00:00",
  "status": 429,
  "error": "Too Many Requests",
  "path": "/api/v2/clips/results/prjxxx"
}`}</code></pre>
            </div>
          </div>
        </section>
      </div>
    </article>
  );
}
