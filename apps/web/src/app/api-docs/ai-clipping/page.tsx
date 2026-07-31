export default function AIClippingDocsPage() {
  return (
    <article className="prose prose-invert max-w-none">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-4">AI Clipping API</h1>
        <p className="text-xl text-zinc-400 leading-relaxed">
          Kirimkan video dengan panjang berapa pun dan terima klip viral bertenaga AI yang diurutkan berdasarkan potensi viral, masing-masing dengan stempel waktu mulai/akhir, judul, deskripsi, tagar, dan ekspor yang telah dirender secara opsional.
        </p>
      </div>

      <div className="space-y-8">
        <section className="bg-[#111113] border border-zinc-800 rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-white mb-4">Penggunaan</h2>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            API ini bekerja dengan menganalisis video untuk mencari momen-momen yang paling menarik, lalu memotong dan merendernya menjadi video vertikal (Shorts/Reels/TikTok).
          </p>

          <h3 className="text-lg font-semibold text-white mb-3 mt-6">Submit Request (Memulai Tugas)</h3>
          <p className="text-zinc-400 mb-4 text-sm">Gunakan metode <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-200">POST</code> ke endpoint <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-200">/api/v2/clips</code>.</p>
          
          <div className="bg-[#09090b] border border-zinc-800 rounded-lg overflow-hidden mb-8">
            <div className="bg-zinc-900/50 px-4 py-2 border-b border-zinc-800 flex justify-between items-center">
              <span className="text-xs font-medium text-zinc-400">cURL</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <pre className="text-sm text-zinc-300 font-mono leading-relaxed"><code>{`curl -X POST https://wayinvideo-api.wayin.ai/api/v2/clips \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "x-wayinvideo-api-version: v2" \\
  -H "Content-Type: application/json" \\
  -d '{
    "video_url": "https://www.youtube.com/watch?v=example",
    "enable_export": true,
    "resolution": "HD_720",
    "enable_caption": true,
    "enable_ai_reframe": true,
    "ratio": "RATIO_9_16"
  }'`}</code></pre>
            </div>
          </div>

          <h3 className="text-lg font-semibold text-white mb-3">Check Status (Mengecek Hasil)</h3>
          <p className="text-zinc-400 mb-4 text-sm">Gunakan metode <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-200">GET</code> ke endpoint <code className="bg-zinc-800 px-1.5 py-0.5 rounded text-zinc-200">/api/v2/clips/results/{"{id}"}</code>.</p>
          
          <div className="bg-[#09090b] border border-zinc-800 rounded-lg overflow-hidden">
            <div className="bg-zinc-900/50 px-4 py-2 border-b border-zinc-800">
              <span className="text-xs font-medium text-zinc-400">cURL</span>
            </div>
            <div className="p-4 overflow-x-auto">
              <pre className="text-sm text-zinc-300 font-mono leading-relaxed"><code>{`curl -X GET https://wayinvideo-api.wayin.ai/api/v2/clips/results/proj_123 \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "x-wayinvideo-api-version: v2"`}</code></pre>
            </div>
          </div>
          <p className="text-sm text-zinc-400 mt-4">
            <em>Catatan:</em> Kami merekomendasikan melakukan polling pada endpoint ini setiap 30 detik hingga status mengembalikan <code>SUCCEEDED</code> atau <code>FAILED</code>.
          </p>
        </section>

        <section className="bg-[#111113] border border-zinc-800 rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-white mb-4">Integrasi Otomatisasi (Make / Zapier)</h2>
          <p className="text-zinc-400 leading-relaxed mb-4">
            Anda dapat menggunakan <strong>Make</strong> atau alat otomatisasi lain untuk membangun alur kerja tingkat lanjut (workflow). Modul HTTP Make dapat terhubung ke WayinVideo menggunakan API key Anda untuk membuat antrean tugas secara otomatis dari Google Drive, YouTube, atau CRM Anda.
          </p>
          <ul className="list-disc list-inside text-zinc-400 space-y-2">
            <li><strong>Batch video clipping:</strong> Pantau folder Google Drive, kirim video ke API, dan route hasilnya.</li>
            <li><strong>Workflow multibahasa:</strong> Gunakan parameter bahasa untuk metadata klip yang terlokalisasi.</li>
            <li><strong>Antrean review konten:</strong> Matikan <code>enable_export</code> untuk mendapatkan stempel waktu (timestamp) saja, kirim ke Google Sheets untuk disetujui, lalu render dengan Clips Export API.</li>
          </ul>
        </section>
      </div>
    </article>
  );
}
