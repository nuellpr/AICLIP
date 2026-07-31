{"@context":"https://schema.org","@type":"TechArticle","headline":"AI Clipping API – Ubah Video Panjang Menjadi Klip Pendek｜WayinVideo API","name":"AI Clipping API – Ubah Video Panjang Menjadi Klip Pendek｜WayinVideo API","description":"Kirimkan video dengan panjang berapa pun dan terima klip viral bertenaga AI yang diurutkan berdasarkan potensi viral, masing-masing dengan stempel waktu mulai/akhir, judul, deskripsi, tagar, dan ekspor yang telah dirender secara opsional.","inLanguage":"id","url":"https://wayin.ai/id/api-docs/ai-clipping/","mainEntityOfPage":"https://wayin.ai/id/api-docs/ai-clipping/","image":"https://tools-cms.s3.us-west-2.amazonaws.com/nc/uploads/noco/p3xs6bxbztpq73w/m6f7y5vguwy5li1/ck1k1rwzzf6ra36/og-image-en_vv4Hu.webp","dateModified":"2026-04-01T00:00:00.000Z","author":{"@type":"Organization","name":"WayinVideo Team","url":"https://wayin.ai/"},"publisher":{"@type":"Organization","name":"WayinVideo","url":"https://wayin.ai/","logo":{"@type":"ImageObject","url":"https://d25vgoj2qecagr.cloudfront.net/front/poster.png"}},"articleSection":"APIs","isPartOf":{"@type":"TechArticle","name":"WayinVideo API Documentation","url":"https://wayin.ai/id/api-docs/"}}

---

6:["$","div",null,{"className":"relative min-h-screen bg-[#0d0e0c] text-white","children":[["$","$L20",null,{}],["$","$L21",null,{"utmSource":"api-docs","tools":[{"name":"common.header.tool-item17","link":"/tools/clip-maker/","index":0,"locale":"id"},{"name":"common.header.tool-item16","link":"/tools/ai-video-generator/seedance/","index":1,"locale":"id"},{"name":"common.header.tool-item9","link":"/tools/ai-reframe/","index":3,"locale":"id"},{"name":"common.header.tool-item4","link":"/tools/subtitle-translator/","index":4,"locale":"id"},{"name":"common.header.tool-item15","link":"/tools/youtube-shorts-maker/","index":5,"locale":"id"},{"name":"common.header.tool-item8","link":"/tools/ai-gaming-clip-generator/","index":6,"locale":"id"},{"name":"common.header.tool-item3","link":"/tools/video-translator/","index":7,"locale":"id"},{"name":"common.header.tool-item1","link":"/tools/video-transcript-generator/","index":8,"locale":"id"},{"name":"common.header.tool-item11","link":"/tools/find-moments/","index":9,"locale":"id"},{"name":"common.header.tool-item18","link":"/tools/video-transcript-generator/youtube/","index":10,"locale":"id"},{"name":"common.header.tool-item19","link":"/tools/ai-video-editor/","index":11,"locale":"id"},{"name":"common.header.tool-item14","link":"/tools/ai-video-generator/","index":12,"locale":"id"},{"name":"common.header.tool-item2","link":"/tools/video-summarizer/","index":13,"locale":"id"},{"name":"common.header.tool-item5","link":"/tools/auto-subtitle-generator/","index":14,"locale":"id"},{"name":"common.header.tool-item6","link":"/tools/auto-caption-generator/","index":15,"locale":"id"},{"name":"common.header.tool-item10","link":"/tools/video-to-text/","index":16,"locale":"id"},{"name":"common.header.tool-item13","link":"/tools/long-video-to-short-video/","index":17,"locale":"id"},{"name":"common.header.tool-item12","link":"/tools/youtube-thumbnail-maker/","index":18,"locale":"id"}],"lang":"id","languages":["en","zh-tw","pt","es","id","fr","de","ja"],"logoPath":"logo-dark-v2.svg"}],["$","main",null,{"className":"pt-24 md:pt-[120px] max-w-[1420px] mx-auto","children":[["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"$22"}}],["$","script",null,{"type":"application/ld+json","dangerouslySetInnerHTML":{"__html":"{\"@context\":\"https://schema.org\",\"@type\":\"BreadcrumbList\",\"itemListElement\":[{\"@type\":\"ListItem\",\"position\":1,\"name\":\"WayinVideo\",\"item\":\"https://wayin.ai/\"},{\"@type\":\"ListItem\",\"position\":2,\"name\":\"API Docs\",\"item\":\"https://wayin.ai/id/api-docs/\"},{\"@type\":\"ListItem\",\"position\":3,\"name\":\"AI Clipping API\",\"item\":\"https://wayin.ai/id/api-docs/ai-clipping/\"}]}"}}],"$L23"]}],"$L24"]}]


---

<h2 id="ai-clipping-api">AI Clipping API</h2>
<p>Kirimkan video dengan panjang berapa pun dan terima semua klip viral yang diurutkan berdasarkan potensi viral. Setiap klip menyertakan stempel waktu awal/akhir yang terdeteksi otomatis, judul, deskripsi, dan tagar yang dihasilkan AI. API ini bekerja untuk semua konten mulai dari video pendek hingga video berdurasi berjam-jam. Jika ekspor diaktifkan, respons juga menyertakan tautan unduhan video yang telah dirender untuk setiap klip, dengan opsi auto-reframe yang menjaga subjek utama tetap di tengah dan overlay Animated Caption untuk video format pendek yang lebih menarik.</p>
<p>Anda dapat mempublikasikan klip yang dibuat oleh AI Clipping langsung ke akun media sosial yang terhubung. Lihat <a href="/api-docs/social-media-publishing/">Social Media Publishing API</a> untuk menghubungkan akun dan membuat tugas publikasi.</p>
<h2 id="sumber-video-yang-didukung">Sumber Video yang Didukung</h2>
<p>API menerima URL dari platform berikut: YouTube, Vimeo, Dailymotion, Kick, Twitch, TikTok, Facebook, Zoom, Rumble, dan lainnya.</p>
<p>Anda juga dapat membuat klip dari <a href="/api-docs/upload/">file video lokal yang Anda unggah</a> — unggah lokal memerlukan <a href="/pricing/">langganan <strong>Standard</strong> atau lebih tinggi</a>.</p>
<hr>
<h2 id="kirim-tugas-klipping">Kirim Tugas Klipping</h2>
<p>Kirimkan tugas AI clipping baru dari URL video.</p>
<pre><code>POST https://wayinvideo-api.wayin.ai/api/v2/clips
</code></pre>
<h3 id="body-permintaan">Body Permintaan</h3>
<p>Saat merender klip, Anda dapat mengaktifkan fitur seperti <strong>Animated Caption</strong>, <strong>AI Reframe</strong>, dan overlay teks <strong>AI Hook</strong> opsional. Dengan AI Reframe, sistem mendeteksi subjek utama dalam frame, menjaga subjek tersebut tetap di tengah, mengoptimalkan crop untuk rasio aspek yang dipilih, dan memilih layout paling sesuai berdasarkan struktur scene. Fitur-fitur ini dikontrol oleh parameter yang namanya diawali dengan <code>enable_</code> (lihat tabel di bawah).</p>

















































































































































<table><thead><tr><th>Parameter</th><th>Tipe</th><th>Wajib</th><th>Default</th><th>Deskripsi</th></tr></thead><tbody><tr><td><code>video_url</code></td><td>string</td><td>Ya</td><td>—</td><td>URL video sumber. Untuk file yang diunggah secara lokal, gunakan identifier file yang dikembalikan oleh <a href="/api-docs/upload/">Upload API</a>.</td></tr><tr><td><code>project_name</code></td><td>string</td><td>Tidak</td><td><code>""</code></td><td>Nama kustom untuk tugas ini</td></tr><tr><td><code>source_lang</code></td><td>string</td><td>Tidak</td><td><code>null</code></td><td>Bahasa sumber video (lihat <a href="/api-docs/supported-languages/">Bahasa yang Didukung</a>). Jika <code>null</code>, sistem mendeteksi bahasa asli secara otomatis.</td></tr><tr><td><code>target_lang</code></td><td>string</td><td>Tidak</td><td><code>null</code></td><td>Bahasa target untuk konten output termasuk judul klip, deskripsi, dan subtitel (lihat <a href="/api-docs/supported-languages/">Bahasa yang Didukung</a>). Jika <code>null</code>, bahasa output mengikuti <code>source_lang</code>.</td></tr><tr><td><code>target_duration</code></td><td>string</td><td>Tidak</td><td><code>DURATION_0_90</code></td><td>Rentang durasi yang diharapkan untuk setiap klip output. Nilai yang diizinkan: <code>DURATION_0_30</code> (0–30 dtk), <code>DURATION_0_90</code> (0–90 dtk), <code>DURATION_30_60</code> (30–60 dtk), <code>DURATION_60_90</code> (60–90 dtk), <code>DURATION_90_180</code> (90–180 dtk), <code>DURATION_180_300</code> (180–300 dtk).</td></tr><tr><td><code>limit</code></td><td>number</td><td>Tidak</td><td><code>null</code></td><td>Jumlah maksimum klip yang dikembalikan, diurutkan dari skor viral tertinggi ke terendah. Jika <code>null</code> atau dihilangkan, semua klip dikembalikan.</td></tr><tr><td><code>enable_export</code></td><td>boolean</td><td>Tidak</td><td><code>false</code></td><td>Lihat di bawah. Jika <code>false</code>, hanya rentang waktu klip, judul, dan deskripsi yang dikembalikan (tanpa rendering); jika <code>true</code>, klip dirender segera dan setiap klip menyertakan tautan ekspor. Anda juga dapat mengekspor nanti dengan gaya berbeda melalui bagian Ekspor Klip yang Ada.</td></tr><tr><td><code>resolution</code></td><td>string</td><td>Tidak</td><td><code>SD_480</code></td><td>Resolusi output: <code>SD_480</code>, <code>HD_720</code>, <code>FHD_1080</code>, <code>QHD_2K</code>, <code>UHD_4K</code>. Hanya digunakan saat <code>enable_export</code> adalah <code>true</code>.</td></tr><tr><td><code>enable_caption</code></td><td>boolean</td><td>Tidak</td><td><code>false</code></td><td>Apakah akan menambahkan Animated Caption saat rendering. Hanya digunakan saat <code>enable_export</code> adalah <code>true</code>. Jika <code>true</code>, <code>caption_display</code> dan <code>cc_style_tpl</code> berlaku; jika <code>false</code>, ekspor tidak memiliki Animated Caption.</td></tr><tr><td><code>caption_display</code></td><td>string</td><td>Tidak</td><td><code>original</code></td><td>Mode subtitel: <code>both</code>, <code>original</code>, <code>translation</code>. Hanya digunakan saat <code>enable_export</code> dan <code>enable_caption</code> keduanya <code>true</code>.</td></tr><tr><td><code>cc_style_tpl</code></td><td>string</td><td>Tidak</td><td><code>temp-7</code></td><td>ID template gaya subtitel (lihat <a href="/api-docs/subtitles-style/">Gaya Subtitel</a>). Hanya digunakan saat <code>enable_export</code> dan <code>enable_caption</code> keduanya <code>true</code>.</td></tr><tr><td><code>enable_ai_hook</code></td><td>boolean</td><td>Tidak</td><td><code>false</code></td><td>Apakah akan menambahkan hook teks yang menarik perhatian dan dihasilkan secara otomatis di awal atau akhir setiap klip yang dirender. Hanya digunakan saat <code>enable_export</code> adalah <code>true</code>. Jika <code>true</code>, <code>ai_hook_script_style</code> dan <code>ai_hook_position</code> berlaku; jika <code>false</code>, tidak ada AI hook yang ditambahkan.</td></tr><tr><td><code>ai_hook_script_style</code></td><td>string</td><td>Tidak</td><td><code>serious</code></td><td>Gaya teks hook yang dihasilkan. Nilai yang diizinkan: <code>serious</code>, <code>casual</code>, <code>informative</code>, <code>conversational</code>, <code>humorous</code>, <code>parody</code>, <code>inspirational</code>, <code>dramatic</code>, <code>empathetic</code>, <code>persuasive</code>, <code>neutral</code>, <code>excited</code>, <code>calm</code>. Hanya digunakan saat <code>enable_export</code> dan <code>enable_ai_hook</code> keduanya <code>true</code>.</td></tr><tr><td><code>ai_hook_position</code></td><td>string</td><td>Tidak</td><td><code>beginning</code></td><td>Posisi teks hook yang dihasilkan. Nilai yang diizinkan: <code>beginning</code>, <code>end</code>. Hanya digunakan saat <code>enable_export</code> dan <code>enable_ai_hook</code> keduanya <code>true</code>.</td></tr><tr><td><code>enable_ai_reframe</code></td><td>boolean</td><td>Tidak</td><td><code>false</code></td><td>Aktifkan AI Reframe. Hanya digunakan saat <code>enable_export</code> adalah <code>true</code>. Jika <code>true</code>, <code>ratio</code> wajib diisi; jika <code>false</code>, video diekspor dengan rasio aspek aslinya tidak berubah.</td></tr><tr><td><code>ratio</code></td><td>string</td><td>Ya jika <code>enable_ai_reframe</code> adalah <code>true</code></td><td>—</td><td>Rasio aspek: <code>RATIO_9_16</code>, <code>RATIO_1_1</code>, <code>RATIO_4_5</code>, <code>RATIO_16_9</code>. Hanya digunakan saat <code>enable_export</code> adalah <code>true</code>, dan wajib saat <code>enable_ai_reframe</code> adalah <code>true</code>.</td></tr><tr><td><code>reframe_layout</code></td><td>string</td><td>Tidak</td><td><code>Auto</code></td><td>Layout AI Reframe. Hanya digunakan saat <code>enable_export</code> dan <code>enable_ai_reframe</code> keduanya <code>true</code>. Default <code>Auto</code>: model memilih layout terbaik untuk frame tersebut (hilangkan field ini atau berikan string kosong untuk perilaku yang sama). Jika diatur ke nilai lain yang diizinkan untuk <code>ratio</code> yang dipilih, reframe menggunakan layout tetap tersebut. Lihat nilai layout Reframe.</td></tr><tr><td><code>enable_more_results</code></td><td>boolean</td><td>Tidak</td><td><code>false</code></td><td>Jika <code>true</code>, model menghasilkan lebih banyak klip. Hanya tersedia dengan langganan <strong>Enterprise</strong> (<a href="https://wayin.ai/wayinvideo/settings/plan" rel="nofollow noopener noreferrer" target="_blank">Paket Langganan</a>).</td></tr><tr><td><code>enable_express_mode</code></td><td>boolean</td><td>Tidak</td><td><code>false</code></td><td>Jika <code>true</code>, mengaktifkan <strong>Express Mode</strong>: <strong>Kredit API</strong> yang dibebankan untuk tugas berkurang setengah dibanding tarif standar. Hanya tersedia dengan langganan <strong>Enterprise</strong> (<a href="https://wayin.ai/wayinvideo/settings/plan" rel="nofollow noopener noreferrer" target="_blank">Paket Langganan</a>).</td></tr></tbody></table>
<h3 id="nilai-layout-reframe">Nilai layout Reframe</h3>
<p>Nilai <code>reframe_layout</code> yang diizinkan tergantung pada <code>ratio</code>. <code>Auto</code> selalu diizinkan (default); menghilangkan field ini atau memberikan string kosong memiliki perilaku yang sama. Berikan nama layout <strong>persis</strong> seperti di bawah (peka huruf besar/kecil dan spasi).</p>

























<table><thead><tr><th><code>ratio</code></th><th>Nilai <code>reframe_layout</code> yang diizinkan</th></tr></thead><tbody><tr><td><code>RATIO_16_9</code></td><td><code>Auto</code>, <code>Full</code>, <code>Fit</code>, <code>Grid 4</code>, <code>Split 2</code>, <code>Trio</code>, <code>PiP</code>, <code>OTS</code>, <code>Screen First</code></td></tr><tr><td><code>RATIO_9_16</code></td><td><code>Auto</code>, <code>Full</code>, <code>Fit</code>, <code>Grid 4</code>, <code>Split 2</code>, <code>Trio</code>, <code>PiP</code>, <code>Screen First</code>, <code>Gameplay A</code>, <code>Gameplay B</code></td></tr><tr><td><code>RATIO_1_1</code></td><td><code>Auto</code>, <code>Full</code>, <code>Fit</code>, <code>Grid 4</code>, <code>Trio</code></td></tr><tr><td><code>RATIO_4_5</code></td><td><code>Auto</code>, <code>Full</code>, <code>Fit</code>, <code>Grid 4</code>, <code>Split 2</code>, <code>Trio</code>, <code>PiP</code>, <code>Screen First</code>, <code>Gameplay A</code>, <code>Gameplay B</code></td></tr></tbody></table>
<p><strong>Perilaku <code>enable_export</code></strong></p>
<ul>
<li>Jika <code>enable_export</code> kosong atau <code>false</code>, API hanya mengembalikan rentang waktu klip, judul, deskripsi, dan metadata terkait. Tidak ada rendering yang dilakukan, dan tidak ada tautan ekspor dalam hasil. Parameter <code>ratio</code>, <code>reframe_layout</code>, <code>resolution</code>, <code>caption_display</code>, <code>enable_caption</code>, <code>cc_style_tpl</code>, <code>enable_ai_hook</code>, <code>ai_hook_script_style</code>, <code>ai_hook_position</code>, dan <code>enable_ai_reframe</code> tidak berpengaruh saat pembuatan tugas. Anda dapat merender klip yang dipilih nanti dengan endpoint bagian Ekspor Klip yang Ada.</li>
<li>Jika <code>enable_export</code> adalah <code>true</code>, parameter tersebut berlaku, setiap klip dirender segera, dan hasil menyertakan tautan unduhan untuk setiap klip. Karena setiap klip dirender, pemrosesan mungkin membutuhkan waktu lebih lama.</li>
</ul>
<div class="tabs" data-labels="Dengan ekspor|Tanpa ekspor" data-group="export-mode"></div>
<p>Body permintaan mengatur <code>enable_export</code> ke <code>true</code>. Klip dirender; setiap klip menyertakan <code>export_link</code>.</p>
<p><strong>Permintaan</strong></p>
<pre><code class="language-bash">curl -X POST https://wayinvideo-api.wayin.ai/api/v2/clips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-wayinvideo-api-version: v2" \
  -d '{
    "video_url": "https://www.youtube.com/watch?v=example",
    "project_name": "sample project name",
    "target_duration": "DURATION_30_60",
    "enable_export": true,
    "resolution": "HD_720",
    "enable_caption": true,
    "enable_ai_reframe": true,
    "ratio": "RATIO_9_16"
  }'
</code></pre>
<p><strong>Respons pengiriman</strong></p>
<pre><code class="language-json">{
  "data": {
    "id": "proj_xyz789",
    "name": "sample project name",
    "status": "CREATED"
  }
}
</code></pre>
<div class="tab-divider"></div>
<p>Body permintaan menghilangkan <code>enable_export</code> atau mengaturnya ke <code>false</code>. Hanya rentang waktu klip, judul, deskripsi, dan tagar yang dikembalikan; tidak ada rendering, tidak ada tautan ekspor.</p>
<p><strong>Permintaan</strong></p>
<pre><code class="language-bash">curl -X POST https://wayinvideo-api.wayin.ai/api/v2/clips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-wayinvideo-api-version: v2" \
  -d '{
    "video_url": "https://www.youtube.com/watch?v=example",
    "project_name": "sample project name",
    "target_duration": "DURATION_30_60"
  }'
</code></pre>
<p><strong>Respons pengiriman</strong></p>
<pre><code class="language-json">{
  "data": {
    "id": "proj_abc123",
    "name": "sample project name",
    "status": "CREATED"
  }
}
</code></pre>
<div class="tabs-end"></div>

























<table><thead><tr><th>Field</th><th>Tipe</th><th>Deskripsi</th></tr></thead><tbody><tr><td><code>id</code></td><td>string</td><td>Identifier tugas unik</td></tr><tr><td><code>name</code></td><td>string</td><td>Nama tugas</td></tr><tr><td><code>status</code></td><td>string</td><td>Status pemrosesan: <code>CREATED</code>, <code>QUEUED</code>, <code>ONGOING</code>, <code>SUCCEEDED</code>, <code>FAILED</code></td></tr></tbody></table>
<hr>
<h2 id="contoh">Contoh</h2>
<p>Skenario AI clipping yang umum. Ganti <code>YOUR_API_KEY</code> dengan kunci dari <a href="https://wayin.ai/wayinvideo/api-dashboard" rel="nofollow noopener noreferrer" target="_blank">API Dashboard</a>.</p>
<h3 id="membuat-klip-viral-dari-video-youtube">Membuat klip viral dari video YouTube</h3>
<pre><code class="language-bash">curl -X POST https://wayinvideo-api.wayin.ai/api/v2/clips \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-wayinvideo-api-version: v2" \
  -H "Content-Type: application/json" \
  -d '{"video_url": "https://www.youtube.com/watch?v=EXAMPLE"}'
</code></pre>
<h3 id="membuat-klip-rekaman-webinar-menjadi-shorts-vertikal-916-dengan-caption">Membuat klip rekaman webinar menjadi shorts vertikal 9:16 dengan caption</h3>
<pre><code class="language-bash">curl -X POST https://wayinvideo-api.wayin.ai/api/v2/clips \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-wayinvideo-api-version: v2" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://www.youtube.com/watch?v=EXAMPLE",
    "target_duration": "DURATION_30_60",
    "enable_export": true,
    "resolution": "HD_720",
    "enable_caption": true,
    "enable_ai_reframe": true,
    "ratio": "RATIO_9_16"
  }'
</code></pre>
<h3 id="membuat-klip-podcast-menjadi-shorts-dengan-peringkat-teratas">Membuat klip podcast menjadi shorts dengan peringkat teratas</h3>
<p>Berguna untuk konten panjang ketika Anda hanya menginginkan klip viral dengan skor tertinggi.</p>
<pre><code class="language-bash">curl -X POST https://wayinvideo-api.wayin.ai/api/v2/clips \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-wayinvideo-api-version: v2" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://www.youtube.com/watch?v=EXAMPLE",
    "limit": 5,
    "target_duration": "DURATION_60_90",
    "enable_export": true,
    "resolution": "HD_720",
    "enable_caption": true,
    "enable_ai_reframe": true,
    "ratio": "RATIO_9_16"
  }'
</code></pre>
<hr>
<h2 id="ambil-hasil-klipping">Ambil Hasil Klipping</h2>
<p>Ambil status tugas dan klip. Lakukan polling pada endpoint ini hingga <code>status</code> menjadi <code>SUCCEEDED</code>.</p>
<blockquote>
<p><strong>Hasil bertahap:</strong> Saat <code>status</code> adalah <code>ONGOING</code>, setiap panggilan mengembalikan klip yang sudah dihasilkan sejauh ini — Anda dapat mulai memproses hasil parsial segera. Saat <code>status</code> berubah menjadi <code>SUCCEEDED</code>, respons berisi seluruh kumpulan klip.</p>
</blockquote>
<pre><code>GET https://wayinvideo-api.wayin.ai/api/v2/clips/results/{id}
</code></pre>
<h3 id="parameter-path">Parameter Path</h3>

















<table><thead><tr><th>Parameter</th><th>Tipe</th><th>Wajib</th><th>Deskripsi</th></tr></thead><tbody><tr><td><code>id</code></td><td>string</td><td>Ya</td><td>ID tugas yang dikembalikan oleh endpoint pengiriman</td></tr></tbody></table>
<h3 id="contoh-permintaan">Contoh Permintaan</h3>
<pre><code class="language-bash">curl -X GET https://wayinvideo-api.wayin.ai/api/v2/clips/results/proj_abc123 \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-wayinvideo-api-version: v2"
</code></pre>
<div class="tabs" data-labels="Dengan ekspor|Tanpa ekspor" data-group="export-mode"></div>
<p>Saat tugas dikirim dengan <strong><code>enable_export: true</code></strong>, setiap klip menyertakan <code>export_link</code> untuk video yang telah dirender:</p>
<pre><code class="language-json">{
  "data": {
    "id": "proj_xyz789",
    "name": "sample project name",
    "status": "SUCCEEDED",
    "expire_at": 1741824000000,
    "cost_usage": 120.0,
    "clips": [
      {
        "idx": 0,
        "title": "sample title",
        "begin_ms": 15000,
        "end_ms": 75000,
        "thumbnail": "https://cdn.example.com/thumb/clip_001.jpg",
        "tags": ["insight", "analysis"],
        "desc": "sample description",
        "score": 81,
        "export_link": "https://cdn.example.com/export/clip_001.mp4"
      },
      {
        "idx": 1,
        "title": "sample title 2",
        "begin_ms": 120000,
        "end_ms": 195000,
        "thumbnail": "https://cdn.example.com/thumb/clip_002.jpg",
        "tags": ["tips", "summary"],
        "desc": "sample description",
        "score": 76,
        "export_link": "https://cdn.example.com/export/clip_002.mp4"
      }
    ]
  }
}
</code></pre>
<div class="tab-divider"></div>
<p>Saat tugas dikirim <strong>tanpa</strong> <code>enable_export</code> (atau dengan <code>enable_export: false</code>), klip tidak menyertakan <code>export_link</code>:</p>
<pre><code class="language-json">{
  "data": {
    "id": "proj_abc123",
    "name": "sample project name",
    "status": "SUCCEEDED",
    "expire_at": 1741824000000,
    "cost_usage": 120.0,
    "clips": [
      {
        "idx": 0,
        "title": "sample title",
        "begin_ms": 15000,
        "end_ms": 75000,
        "thumbnail": "https://cdn.example.com/thumb/clip_001.jpg",
        "tags": ["insight", "analysis"],
        "desc": "sample description",
        "score": 81
      },
      {
        "idx": 1,
        "title": "sample title 2",
        "begin_ms": 120000,
        "end_ms": 195000,
        "thumbnail": "https://cdn.example.com/thumb/clip_002.jpg",
        "tags": ["tips", "summary"],
        "desc": "sample description",
        "score": 76
      }
    ]
  }
}
</code></pre>
<div class="tabs-end"></div>
<h3 id="field-respons">Field Respons</h3>













































<table><thead><tr><th>Field</th><th>Tipe</th><th>Deskripsi</th></tr></thead><tbody><tr><td><code>id</code></td><td>string</td><td>Identifier tugas unik</td></tr><tr><td><code>name</code></td><td>string</td><td>Nama tugas</td></tr><tr><td><code>status</code></td><td>string</td><td><code>CREATED</code>, <code>QUEUED</code>, <code>ONGOING</code>, <code>SUCCEEDED</code>, <code>FAILED</code></td></tr><tr><td><code>error_message</code></td><td>string</td><td>Alasan error (hanya ada saat <code>status</code> adalah <code>FAILED</code>)</td></tr><tr><td><code>expire_at</code></td><td>integer</td><td>Stempel waktu kedaluwarsa dalam milidetik (epoch). Setelah waktu ini, tugas kedaluwarsa dan hasil tidak dapat lagi diambil melalui endpoint hasil. Periode kedaluwarsa tergantung pada paket langganan Anda. Lihat halaman <a href="https://wayin.ai/wayinvideo/settings/plan" rel="nofollow noopener noreferrer" target="_blank">Paket Langganan</a> untuk detailnya.</td></tr><tr><td><code>cost_usage</code></td><td>number</td><td>Kredit API yang digunakan untuk permintaan ini</td></tr><tr><td><code>clips</code></td><td>array</td><td>Daftar objek klip (lihat di bawah). Saat <code>status</code> adalah <code>ONGOING</code>, ini berisi klip yang sudah dihasilkan sejauh ini (hasil parsial); saat <code>status</code> adalah <code>SUCCEEDED</code>, ini berisi semua klip (hasil akhir).</td></tr></tbody></table>
<h3 id="objek-klip">Objek Klip</h3>























































<table><thead><tr><th>Field</th><th>Tipe</th><th>Deskripsi</th></tr></thead><tbody><tr><td><code>idx</code></td><td>integer</td><td>Indeks klip (berbasis 0, diurutkan berdasarkan potensi viral)</td></tr><tr><td><code>title</code></td><td>string</td><td>Judul klip yang dihasilkan AI</td></tr><tr><td><code>begin_ms</code></td><td>number</td><td>Waktu mulai dalam milidetik</td></tr><tr><td><code>end_ms</code></td><td>number</td><td>Waktu berakhir dalam milidetik</td></tr><tr><td><code>thumbnail</code></td><td>string</td><td>URL gambar thumbnail</td></tr><tr><td><code>tags</code></td><td>string[]</td><td>Tagar yang dihasilkan AI</td></tr><tr><td><code>desc</code></td><td>string</td><td>Deskripsi yang dihasilkan AI</td></tr><tr><td><code>score</code></td><td>number</td><td>Skor potensi viral (0–100, semakin tinggi semakin baik)</td></tr><tr><td><code>export_link</code></td><td>string</td><td>URL unduhan video yang telah dirender (saat <code>enable_export</code> adalah true). Tautan baru dibuat setiap kali Anda memanggil endpoint hasil. Setiap tautan kedaluwarsa setelah 24 jam — harap unduh video sebelum kedaluwarsa. Jika tautan telah kedaluwarsa, panggil kembali endpoint hasil untuk mendapatkan tautan baru.</td></tr></tbody></table>
<hr>
<h2 id="ekspor-ulang-klip-yang-ada">Ekspor Ulang Klip yang Ada</h2>
<p>Jika Anda ingin merender klip nanti atau mengekspornya ulang dengan gaya subtitel berbeda, rasio aspek, AI hook, overlay, atau pengaturan ekspor lainnya, gunakan <a href="/api-docs/clips-export/">Clips Export API</a>.</p>
<p>Untuk proyek AI Clipping, berikan <code>id</code> tugas yang dikembalikan oleh <code>POST /api/v2/clips</code> sebagai <code>project_id</code> dalam permintaan ekspor.</p>
<hr>
<h2 id="faq">FAQ</h2>
<h3 id="berapa-panjang-video-maksimum">Berapa panjang video maksimum?</h3>
<p>Tidak ada batasan panjang yang tegas — API ini dirancang untuk konten berdurasi berjam-jam seperti podcast, livestream gaming, dan webinar. Batas ukuran file hanya berlaku untuk <a href="/api-docs/upload/">unggahan lokal</a>; sumber berbasis URL tidak dibatasi.</p>
<h3 id="bagaimana-klip-diurutkan">Bagaimana klip diurutkan?</h3>
<p>Setiap klip diberi skor berdasarkan potensi viral — kelengkapan narasi, kekuatan hook, puncak emosi, dan sinyal engagement. Gunakan parameter <code>limit</code> untuk hanya menyimpan klip dengan skor tertinggi (top-N).</p>
<h3 id="bisakah-saya-mendapatkan-klip-tanpa-merendernya">Bisakah saya mendapatkan klip tanpa merendernya?</h3>
<p>Bisa. Hilangkan <code>enable_export</code> (atau atur ke <code>false</code>) untuk hanya menerima stempel waktu, judul, deskripsi, dan tag. Render klip yang dipilih nanti menggunakan <a href="/api-docs/clips-export/">Clips Export API</a>.</p>
<h3 id="rasio-aspek-apa-saja-yang-didukung-ai-reframe">Rasio aspek apa saja yang didukung AI Reframe?</h3>
<p><code>RATIO_9_16</code> (TikTok / Reels / Shorts), <code>RATIO_1_1</code> (feed Instagram), <code>RATIO_4_5</code> (portrait Instagram), dan <code>RATIO_16_9</code> (landscape). Lihat nilai layout Reframe untuk opsi layout per rasio.</p>
<h3 id="dari-platform-apa-saja-saya-dapat-membuat-klip">Dari platform apa saja saya dapat membuat klip?</h3>
<p>YouTube, Vimeo, Dailymotion, Kick, Twitch, TikTok, Facebook, Zoom, Rumble, dan lainnya, ditambah file yang diunggah secara lokal (<code>mp4</code>, <code>mov</code>, <code>webm</code>, <code>avi</code>).</p>

---


## AI Clipping API

Kirimkan video dengan panjang berapa pun dan terima semua klip viral yang diurutkan berdasarkan potensi viral. Setiap klip menyertakan stempel waktu awal/akhir yang terdeteksi otomatis, judul, deskripsi, dan tagar yang dihasilkan AI. API ini bekerja untuk semua konten mulai dari video pendek hingga video berdurasi berjam-jam. Jika ekspor diaktifkan, respons juga menyertakan tautan unduhan video yang telah dirender untuk setiap klip, dengan opsi auto-reframe yang menjaga subjek utama tetap di tengah dan overlay Animated Caption untuk video format pendek yang lebih menarik.

Anda dapat mempublikasikan klip yang dibuat oleh AI Clipping langsung ke akun media sosial yang terhubung. Lihat [Social Media Publishing API](/api-docs/social-media-publishing/) untuk menghubungkan akun dan membuat tugas publikasi.

## Sumber Video yang Didukung

API menerima URL dari platform berikut: YouTube, Vimeo, Dailymotion, Kick, Twitch, TikTok, Facebook, Zoom, Rumble, dan lainnya.

Anda juga dapat membuat klip dari [file video lokal yang Anda unggah](/api-docs/upload/) — unggah lokal memerlukan [langganan **Standard** atau lebih tinggi](/pricing/).

---

## Kirim Tugas Klipping

Kirimkan tugas AI clipping baru dari URL video.

```
POST https://wayinvideo-api.wayin.ai/api/v2/clips
```

### Body Permintaan

Saat merender klip, Anda dapat mengaktifkan fitur seperti **Animated Caption**, **AI Reframe**, dan overlay teks **AI Hook** opsional. Dengan AI Reframe, sistem mendeteksi subjek utama dalam frame, menjaga subjek tersebut tetap di tengah, mengoptimalkan crop untuk rasio aspek yang dipilih, dan memilih layout paling sesuai berdasarkan struktur scene. Fitur-fitur ini dikontrol oleh parameter yang namanya diawali dengan `enable_` (lihat tabel di bawah).

| Parameter | Tipe | Wajib | Default | Deskripsi |
|-----------|------|-------|---------|-----------|
| `video_url` | string | Ya | — | URL video sumber. Untuk file yang diunggah secara lokal, gunakan identifier file yang dikembalikan oleh [Upload API](/api-docs/upload/). |
| `project_name` | string | Tidak | `""` | Nama kustom untuk tugas ini |
| `source_lang` | string | Tidak | `null` | Bahasa sumber video (lihat [Bahasa yang Didukung](/api-docs/supported-languages/)). Jika `null`, sistem mendeteksi bahasa asli secara otomatis. |
| `target_lang` | string | Tidak | `null` | Bahasa target untuk konten output termasuk judul klip, deskripsi, dan subtitel (lihat [Bahasa yang Didukung](/api-docs/supported-languages/)). Jika `null`, bahasa output mengikuti `source_lang`. |
| `target_duration` | string | Tidak | `DURATION_0_90` | Rentang durasi yang diharapkan untuk setiap klip output. Nilai yang diizinkan: `DURATION_0_30` (0–30 dtk), `DURATION_0_90` (0–90 dtk), `DURATION_30_60` (30–60 dtk), `DURATION_60_90` (60–90 dtk), `DURATION_90_180` (90–180 dtk), `DURATION_180_300` (180–300 dtk). |
| `limit` | number | Tidak | `null` | Jumlah maksimum klip yang dikembalikan, diurutkan dari skor viral tertinggi ke terendah. Jika `null` atau dihilangkan, semua klip dikembalikan. |
| `enable_export` | boolean | Tidak | `false` | Lihat di bawah. Jika `false`, hanya rentang waktu klip, judul, dan deskripsi yang dikembalikan (tanpa rendering); jika `true`, klip dirender segera dan setiap klip menyertakan tautan ekspor. Anda juga dapat mengekspor nanti dengan gaya berbeda melalui bagian Ekspor Klip yang Ada. |
| `resolution` | string | Tidak | `SD_480` | Resolusi output: `SD_480`, `HD_720`, `FHD_1080`, `QHD_2K`, `UHD_4K`. Hanya digunakan saat `enable_export` adalah `true`. |
| `enable_caption` | boolean | Tidak | `false` | Apakah akan menambahkan Animated Caption saat rendering. Hanya digunakan saat `enable_export` adalah `true`. Jika `true`, `caption_display` dan `cc_style_tpl` berlaku; jika `false`, ekspor tidak memiliki Animated Caption. |
| `caption_display` | string | Tidak | `original` | Mode subtitel: `both`, `original`, `translation`. Hanya digunakan saat `enable_export` dan `enable_caption` keduanya `true`. |
| `cc_style_tpl` | string | Tidak | `temp-7` | ID template gaya subtitel (lihat [Gaya Subtitel](/api-docs/subtitles-style/)). Hanya digunakan saat `enable_export` dan `enable_caption` keduanya `true`. |
| `enable_ai_hook` | boolean | Tidak | `false` | Apakah akan menambahkan hook teks yang menarik perhatian dan dihasilkan secara otomatis di awal atau akhir setiap klip yang dirender. Hanya digunakan saat `enable_export` adalah `true`. Jika `true`, `ai_hook_script_style` dan `ai_hook_position` berlaku; jika `false`, tidak ada AI hook yang ditambahkan. |
| `ai_hook_script_style` | string | Tidak | `serious` | Gaya teks hook yang dihasilkan. Nilai yang diizinkan: `serious`, `casual`, `informative`, `conversational`, `humorous`, `parody`, `inspirational`, `dramatic`, `empathetic`, `persuasive`, `neutral`, `excited`, `calm`. Hanya digunakan saat `enable_export` dan `enable_ai_hook` keduanya `true`. |
| `ai_hook_position` | string | Tidak | `beginning` | Posisi teks hook yang dihasilkan. Nilai yang diizinkan: `beginning`, `end`. Hanya digunakan saat `enable_export` dan `enable_ai_hook` keduanya `true`. |
| `enable_ai_reframe` | boolean | Tidak | `false` | Aktifkan AI Reframe. Hanya digunakan saat `enable_export` adalah `true`. Jika `true`, `ratio` wajib diisi; jika `false`, video diekspor dengan rasio aspek aslinya tidak berubah. |
| `ratio` | string | Ya jika `enable_ai_reframe` adalah `true` | — | Rasio aspek: `RATIO_9_16`, `RATIO_1_1`, `RATIO_4_5`, `RATIO_16_9`. Hanya digunakan saat `enable_export` adalah `true`, dan wajib saat `enable_ai_reframe` adalah `true`. |
| `reframe_layout` | string | Tidak | `Auto` | Layout AI Reframe. Hanya digunakan saat `enable_export` dan `enable_ai_reframe` keduanya `true`. Default `Auto`: model memilih layout terbaik untuk frame tersebut (hilangkan field ini atau berikan string kosong untuk perilaku yang sama). Jika diatur ke nilai lain yang diizinkan untuk `ratio` yang dipilih, reframe menggunakan layout tetap tersebut. Lihat nilai layout Reframe. |
| `enable_more_results` | boolean | Tidak | `false` | Jika `true`, model menghasilkan lebih banyak klip. Hanya tersedia dengan langganan **Enterprise** ([Paket Langganan](https://wayin.ai/wayinvideo/settings/plan)). |
| `enable_express_mode` | boolean | Tidak | `false` | Jika `true`, mengaktifkan **Express Mode**: **Kredit API** yang dibebankan untuk tugas berkurang setengah dibanding tarif standar. Hanya tersedia dengan langganan **Enterprise** ([Paket Langganan](https://wayin.ai/wayinvideo/settings/plan)). |

### Nilai layout Reframe

Nilai `reframe_layout` yang diizinkan tergantung pada `ratio`. `Auto` selalu diizinkan (default); menghilangkan field ini atau memberikan string kosong memiliki perilaku yang sama. Berikan nama layout **persis** seperti di bawah (peka huruf besar/kecil dan spasi).

| `ratio` | Nilai `reframe_layout` yang diizinkan |
|---------|---------------------------------------|
| `RATIO_16_9` | `Auto`, `Full`, `Fit`, `Grid 4`, `Split 2`, `Trio`, `PiP`, `OTS`, `Screen First` |
| `RATIO_9_16` | `Auto`, `Full`, `Fit`, `Grid 4`, `Split 2`, `Trio`, `PiP`, `Screen First`, `Gameplay A`, `Gameplay B` |
| `RATIO_1_1` | `Auto`, `Full`, `Fit`, `Grid 4`, `Trio` |
| `RATIO_4_5` | `Auto`, `Full`, `Fit`, `Grid 4`, `Split 2`, `Trio`, `PiP`, `Screen First`, `Gameplay A`, `Gameplay B` |

**Perilaku `enable_export`**

- Jika `enable_export` kosong atau `false`, API hanya mengembalikan rentang waktu klip, judul, deskripsi, dan metadata terkait. Tidak ada rendering yang dilakukan, dan tidak ada tautan ekspor dalam hasil. Parameter `ratio`, `reframe_layout`, `resolution`, `caption_display`, `enable_caption`, `cc_style_tpl`, `enable_ai_hook`, `ai_hook_script_style`, `ai_hook_position`, dan `enable_ai_reframe` tidak berpengaruh saat pembuatan tugas. Anda dapat merender klip yang dipilih nanti dengan endpoint bagian Ekspor Klip yang Ada.
- Jika `enable_export` adalah `true`, parameter tersebut berlaku, setiap klip dirender segera, dan hasil menyertakan tautan unduhan untuk setiap klip. Karena setiap klip dirender, pemrosesan mungkin membutuhkan waktu lebih lama.

<div class="tabs" data-labels="Dengan ekspor|Tanpa ekspor" data-group="export-mode"></div>

Body permintaan mengatur `enable_export` ke `true`. Klip dirender; setiap klip menyertakan `export_link`.

**Permintaan**

```bash
curl -X POST https://wayinvideo-api.wayin.ai/api/v2/clips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-wayinvideo-api-version: v2" \
  -d '{
    "video_url": "https://www.youtube.com/watch?v=example",
    "project_name": "sample project name",
    "target_duration": "DURATION_30_60",
    "enable_export": true,
    "resolution": "HD_720",
    "enable_caption": true,
    "enable_ai_reframe": true,
    "ratio": "RATIO_9_16"
  }'
```

**Respons pengiriman**

```json
{
  "data": {
    "id": "proj_xyz789",
    "name": "sample project name",
    "status": "CREATED"
  }
}
```

<div class="tab-divider"></div>

Body permintaan menghilangkan `enable_export` atau mengaturnya ke `false`. Hanya rentang waktu klip, judul, deskripsi, dan tagar yang dikembalikan; tidak ada rendering, tidak ada tautan ekspor.

**Permintaan**

```bash
curl -X POST https://wayinvideo-api.wayin.ai/api/v2/clips \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-wayinvideo-api-version: v2" \
  -d '{
    "video_url": "https://www.youtube.com/watch?v=example",
    "project_name": "sample project name",
    "target_duration": "DURATION_30_60"
  }'
```

**Respons pengiriman**

```json
{
  "data": {
    "id": "proj_abc123",
    "name": "sample project name",
    "status": "CREATED"
  }
}
```

<div class="tabs-end"></div>

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | string | Identifier tugas unik |
| `name` | string | Nama tugas |
| `status` | string | Status pemrosesan: `CREATED`, `QUEUED`, `ONGOING`, `SUCCEEDED`, `FAILED` |

---

## Contoh

Skenario AI clipping yang umum. Ganti `YOUR_API_KEY` dengan kunci dari [API Dashboard](https://wayin.ai/wayinvideo/api-dashboard).

### Membuat klip viral dari video YouTube

```bash
curl -X POST https://wayinvideo-api.wayin.ai/api/v2/clips \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-wayinvideo-api-version: v2" \
  -H "Content-Type: application/json" \
  -d '{"video_url": "https://www.youtube.com/watch?v=EXAMPLE"}'
```

### Membuat klip rekaman webinar menjadi shorts vertikal 9:16 dengan caption

```bash
curl -X POST https://wayinvideo-api.wayin.ai/api/v2/clips \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-wayinvideo-api-version: v2" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://www.youtube.com/watch?v=EXAMPLE",
    "target_duration": "DURATION_30_60",
    "enable_export": true,
    "resolution": "HD_720",
    "enable_caption": true,
    "enable_ai_reframe": true,
    "ratio": "RATIO_9_16"
  }'
```

### Membuat klip podcast menjadi shorts dengan peringkat teratas

Berguna untuk konten panjang ketika Anda hanya menginginkan klip viral dengan skor tertinggi.

```bash
curl -X POST https://wayinvideo-api.wayin.ai/api/v2/clips \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-wayinvideo-api-version: v2" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://www.youtube.com/watch?v=EXAMPLE",
    "limit": 5,
    "target_duration": "DURATION_60_90",
    "enable_export": true,
    "resolution": "HD_720",
    "enable_caption": true,
    "enable_ai_reframe": true,
    "ratio": "RATIO_9_16"
  }'
```

---

## Ambil Hasil Klipping

Ambil status tugas dan klip. Lakukan polling pada endpoint ini hingga `status` menjadi `SUCCEEDED`.

> **Hasil bertahap:** Saat `status` adalah `ONGOING`, setiap panggilan mengembalikan klip yang sudah dihasilkan sejauh ini — Anda dapat mulai memproses hasil parsial segera. Saat `status` berubah menjadi `SUCCEEDED`, respons berisi seluruh kumpulan klip.

```
GET https://wayinvideo-api.wayin.ai/api/v2/clips/results/{id}
```

### Parameter Path

| Parameter | Tipe | Wajib | Deskripsi |
|-----------|------|-------|-----------|
| `id` | string | Ya | ID tugas yang dikembalikan oleh endpoint pengiriman |

### Contoh Permintaan

```bash
curl -X GET https://wayinvideo-api.wayin.ai/api/v2/clips/results/proj_abc123 \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-wayinvideo-api-version: v2"
```

<div class="tabs" data-labels="Dengan ekspor|Tanpa ekspor" data-group="export-mode"></div>

Saat tugas dikirim dengan **`enable_export: true`**, setiap klip menyertakan `export_link` untuk video yang telah dirender:

```json
{
  "data": {
    "id": "proj_xyz789",
    "name": "sample project name",
    "status": "SUCCEEDED",
    "expire_at": 1741824000000,
    "cost_usage": 120.0,
    "clips": [
      {
        "idx": 0,
        "title": "sample title",
        "begin_ms": 15000,
        "end_ms": 75000,
        "thumbnail": "https://cdn.example.com/thumb/clip_001.jpg",
        "tags": ["insight", "analysis"],
        "desc": "sample description",
        "score": 81,
        "export_link": "https://cdn.example.com/export/clip_001.mp4"
      },
      {
        "idx": 1,
        "title": "sample title 2",
        "begin_ms": 120000,
        "end_ms": 195000,
        "thumbnail": "https://cdn.example.com/thumb/clip_002.jpg",
        "tags": ["tips", "summary"],
        "desc": "sample description",
        "score": 76,
        "export_link": "https://cdn.example.com/export/clip_002.mp4"
      }
    ]
  }
}
```

<div class="tab-divider"></div>

Saat tugas dikirim **tanpa** `enable_export` (atau dengan `enable_export: false`), klip tidak menyertakan `export_link`:

```json
{
  "data": {
    "id": "proj_abc123",
    "name": "sample project name",
    "status": "SUCCEEDED",
    "expire_at": 1741824000000,
    "cost_usage": 120.0,
    "clips": [
      {
        "idx": 0,
        "title": "sample title",
        "begin_ms": 15000,
        "end_ms": 75000,
        "thumbnail": "https://cdn.example.com/thumb/clip_001.jpg",
        "tags": ["insight", "analysis"],
        "desc": "sample description",
        "score": 81
      },
      {
        "idx": 1,
        "title": "sample title 2",
        "begin_ms": 120000,
        "end_ms": 195000,
        "thumbnail": "https://cdn.example.com/thumb/clip_002.jpg",
        "tags": ["tips", "summary"],
        "desc": "sample description",
        "score": 76
      }
    ]
  }
}
```

<div class="tabs-end"></div>

### Field Respons

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `id` | string | Identifier tugas unik |
| `name` | string | Nama tugas |
| `status` | string | `CREATED`, `QUEUED`, `ONGOING`, `SUCCEEDED`, `FAILED` |
| `error_message` | string | Alasan error (hanya ada saat `status` adalah `FAILED`) |
| `expire_at` | integer | Stempel waktu kedaluwarsa dalam milidetik (epoch). Setelah waktu ini, tugas kedaluwarsa dan hasil tidak dapat lagi diambil melalui endpoint hasil. Periode kedaluwarsa tergantung pada paket langganan Anda. Lihat halaman [Paket Langganan](https://wayin.ai/wayinvideo/settings/plan) untuk detailnya. |
| `cost_usage` | number | Kredit API yang digunakan untuk permintaan ini |
| `clips` | array | Daftar objek klip (lihat di bawah). Saat `status` adalah `ONGOING`, ini berisi klip yang sudah dihasilkan sejauh ini (hasil parsial); saat `status` adalah `SUCCEEDED`, ini berisi semua klip (hasil akhir). |

### Objek Klip

| Field | Tipe | Deskripsi |
|-------|------|-----------|
| `idx` | integer | Indeks klip (berbasis 0, diurutkan berdasarkan potensi viral) |
| `title` | string | Judul klip yang dihasilkan AI |
| `begin_ms` | number | Waktu mulai dalam milidetik |
| `end_ms` | number | Waktu berakhir dalam milidetik |
| `thumbnail` | string | URL gambar thumbnail |
| `tags` | string[] | Tagar yang dihasilkan AI |
| `desc` | string | Deskripsi yang dihasilkan AI |
| `score` | number | Skor potensi viral (0–100, semakin tinggi semakin baik) |
| `export_link` | string | URL unduhan video yang telah dirender (saat `enable_export` adalah true). Tautan baru dibuat setiap kali Anda memanggil endpoint hasil. Setiap tautan kedaluwarsa setelah 24 jam — harap unduh video sebelum kedaluwarsa. Jika tautan telah kedaluwarsa, panggil kembali endpoint hasil untuk mendapatkan tautan baru. |

---

## Ekspor Ulang Klip yang Ada

Jika Anda ingin merender klip nanti atau mengekspornya ulang dengan gaya subtitel berbeda, rasio aspek, AI hook, overlay, atau pengaturan ekspor lainnya, gunakan [Clips Export API](/api-docs/clips-export/).

Untuk proyek AI Clipping, berikan `id` tugas yang dikembalikan oleh `POST /api/v2/clips` sebagai `project_id` dalam permintaan ekspor.


---

## FAQ

### Berapa panjang video maksimum?

Tidak ada batasan panjang yang tegas — API ini dirancang untuk konten berdurasi berjam-jam seperti podcast, livestream gaming, dan webinar. Batas ukuran file hanya berlaku untuk [unggahan lokal](/api-docs/upload/); sumber berbasis URL tidak dibatasi.

### Bagaimana klip diurutkan?

Setiap klip diberi skor berdasarkan potensi viral — kelengkapan narasi, kekuatan hook, puncak emosi, dan sinyal engagement. Gunakan parameter `limit` untuk hanya menyimpan klip dengan skor tertinggi (top-N).

### Bisakah saya mendapatkan klip tanpa merendernya?

Bisa. Hilangkan `enable_export` (atau atur ke `false`) untuk hanya menerima stempel waktu, judul, deskripsi, dan tag. Render klip yang dipilih nanti menggunakan [Clips Export API](/api-docs/clips-export/).

### Rasio aspek apa saja yang didukung AI Reframe?

`RATIO_9_16` (TikTok / Reels / Shorts), `RATIO_1_1` (feed Instagram), `RATIO_4_5` (portrait Instagram), dan `RATIO_16_9` (landscape). Lihat nilai layout Reframe untuk opsi layout per rasio.

### Dari platform apa saja saya dapat membuat klip?

YouTube, Vimeo, Dailymotion, Kick, Twitch, TikTok, Facebook, Zoom, Rumble, dan lainnya, ditambah file yang diunggah secara lokal (`mp4`, `mov`, `webm`, `avi`).


---


## Integrasi Codex

Codex dapat menggunakan **WayinVideo Skill** sebagai workspace assistant untuk pemahaman video, AI clipping, dan persiapan konten short-form.

Alih-alih berpindah dari coding environment ke tool video terpisah, Anda dapat meminta Codex menjalankan workflow WayinVideo saat Anda mengerjakan script, pipeline konten, tool publikasi sosial, atau logika otomatisasi. Skill menyediakan aksi video; WayinVideo API menangani pemrosesan di belakang layar.

Ini sangat berguna untuk workflow yang dipimpin developer, seperti:

- membuat script otomatisasi konten,
- menguji pipeline YouTube-to-clips,
- menyiapkan klip untuk alur publikasi media sosial,
- mengekstrak timestamp untuk editorial tool,
- mengubah URL video menjadi structured data untuk app atau CMS.

---

## Ringkasan Setup

Setup terdiri dari tiga bagian:

1. Download package WayinVideo Skill dari ClawHub.
2. Minta Codex menginstal file ZIP yang sudah di-download.
3. Berikan API key WayinVideo saat Codex memintanya.

Sebelum menjalankan tugas video, pastikan akun WayinVideo Anda memiliki API Units yang tersedia. Anda dapat membuat API key dan membeli API Units di [WayinVideo API Dashboard](https://wayin.ai/wayinvideo/api-dashboard).

> Perlakukan API key seperti secret. Jangan commit ke repository, jangan tempelkan di shared logs, dan jangan expose di client-side code.

---

## Instal di Codex

### 1. Download Skill ZIP

Buka halaman WayinVideo Skill:

[https://clawhub.ai/wayinvideo/video-understanding-and-ai-clipping](https://clawhub.ai/wayinvideo/video-understanding-and-ai-clipping)

Download package ke komputer Anda. Simpan path file ZIP karena Codex akan membutuhkan path tersebut saat instalasi.

### 2. Minta Codex Menginstalnya

Di Codex, kirim prompt instalasi dengan path file yang sudah di-download:

```text
Please install the WayinVideo skill package located at [the path of downloaded zip file].
```

Contoh:

```text
Please install the WayinVideo skill package located at /Users/example/Downloads/wayinvideo-video-understanding-and-ai-clipping.zip.
```

### 3. Hubungkan API Key

Saat setup Skill meminta credentials, masukkan API key WayinVideo dari:

[https://wayin.ai/wayinvideo/api-dashboard](https://wayin.ai/wayinvideo/api-dashboard)

Jika saldo API Units Anda kosong, beli API Units Package sebelum menjalankan tugas video pertama.

### 4. Reload Codex jika Diperlukan

Beberapa environment Codex mungkin meminta reload atau restart setelah Skill baru diinstal. Ikuti prompt jika muncul, lalu mulai request baru dengan `/wayinvideo`.

---

## Request Codex Pertama

Setelah setup, coba request singkat yang memberi Codex URL video dan tujuan output yang jelas:

```text
/wayinvideo Generate 6 clip candidates from this YouTube video for TikTok and YouTube Shorts. Include start/end timestamps, a short title, why each clip works, and suggested hashtags: [a youtube video link]
```

Ganti `[a youtube video link]` dengan URL video sumber Anda.

Codex akan merutekan request melalui WayinVideo Skill dan mengembalikan ide klip, timestamp, atau output klip yang dibuat sesuai prompt dan pengaturan akun Anda.

---

## Pola Prompt untuk Codex

Gunakan prompt yang menjelaskan video sumber, channel target, dan output persis yang Anda inginkan.

### Membuat Antrean Klip

```text
/wayinvideo Use AI Clipping on this video and return the strongest short clips. For each clip, include the start time, end time, title, description, and score: https://www.youtube.com/watch?v=example
```

### Mengekstrak Momen untuk Halaman Produk

```text
/wayinvideo Use Find Moments to locate every part where the speaker discusses product benefits or customer objections. Return timestamps and a one-sentence reason for each match: https://www.youtube.com/watch?v=example
```

### Menyiapkan Caption Sosial

```text
/wayinvideo Clip this video into vertical short-form ideas for social posting. Prioritize moments with a strong hook, clear takeaway, or surprising statement: https://www.youtube.com/watch?v=example
```

### Membuat Ringkasan untuk CMS

```text
/wayinvideo Find the best educational moments in this video and summarize each one with its timestamp, topic, and recommended clip title: https://www.youtube.com/watch?v=example
```

---

## Ide Workflow Codex

| Workflow | Cara Codex Menggunakan Skill |
| -------- | ---------------------------- |
| Otomatisasi konten | Membuat clip metadata yang dapat disalin ke script, queue, atau CMS records. |
| Publikasi sosial | Menyiapkan clip titles, descriptions, hashtags, dan content plans yang siap digunakan akun sosial. |
| Review editorial | Menemukan timestamps yang layak ditinjau sebelum klip diekspor atau dipublikasikan. |
| Riset produk | Menemukan momen saat speaker membahas features, comparisons, objections, atau use cases. |
| Dokumentasi | Mengubah video walkthroughs menjadi summaries, highlights, dan structured notes. |

---

## Referensi API yang Berguna

Skill adalah cara termudah untuk mulai di dalam Codex, tetapi referensi API berikut berguna saat Anda ingin membuat atau men-debug custom workflow:

| Kebutuhan | Dokumentasi API |
| --------- | --------------- |
| Menghasilkan klip dari video panjang | [AI Clipping API](/api-docs/ai-clipping/) |
| Mencari momen tepat dengan prompt | [Find Moments API](/api-docs/find-moments/) |
| Membuat structured summaries dan timeline highlights | [Video Summarization API](/api-docs/video-summarization/) |
| Mengekstrak transcripts dengan timing dan speaker labels | [Video Transcription API](/api-docs/video-transcription/) |
| Mengekspor klip terpilih dengan render settings | [Clips Export API](/api-docs/clips-export/) |
| Mempublikasikan klip ke akun sosial terhubung | [Social Media Publishing API](/api-docs/social-media-publishing/) |
| Meninjau API Units dan perilaku billing | [Pricing](/api-docs/pricing/) |

Untuk referensi Skill lengkap, lihat [Video Understanding & AI Clipping Skill](/api-docs/skills-video-understanding-and-ai-clipping/).

---

## Troubleshooting

### `/wayinvideo` Tidak Tersedia

Pastikan instalasi ZIP selesai dengan sukses. Jika Codex meminta reload atau restart, lakukan itu sebelum mencoba command lagi.

### Codex Meminta API Key Lagi

Masukkan API key WayinVideo yang aktif dari [API Dashboard](https://wayin.ai/wayinvideo/api-dashboard). Jika Anda merotasi atau menghapus key, gunakan active key terbaru.

### Request Gagal Karena API Units

Periksa saldo API Units Anda di [WayinVideo API Dashboard](https://wayin.ai/wayinvideo/api-dashboard). Tambahkan API Units Package sebelum mengirim tugas video lain jika saldo kosong.


---


## Integrasi Claude Code

Gunakan **WayinVideo Skill** dengan Claude Code untuk menjalankan workflow pemahaman video dan AI clipping dari prompt bahasa alami.

Setelah instalasi, Anda dapat meminta Claude Code menganalisis video, menemukan momen short-form terbaik, membuat ide klip, dan menyiapkan output untuk platform seperti TikTok, YouTube Shorts, Instagram Reels, dan lainnya.

Integrasi ini berguna saat Anda ingin bekerja secara percakapan, bukan menulis API requests secara manual. Claude Code menangani workflow Skill, sementara WayinVideo API melakukan pemrosesan video.

---

## Yang Dapat Anda Lakukan

- Memotong momen terbaik dari video panjang untuk posting sosial.
- Menemukan momen spesifik dalam video menggunakan instruksi bahasa alami.
- Membuat ringkasan, highlight, judul, deskripsi, dan tag.
- Menggunakan kemampuan WayinVideo API di dalam Claude Code atau Claude Desktop.
- Mengubah link video publik menjadi workflow konten short-form tanpa membuat API requests secara manual.

---

## Sebelum Mulai

Anda memerlukan:

1. Claude Code atau Claude Desktop sudah terinstal.
2. API key WayinVideo dari [WayinVideo API Dashboard](https://wayin.ai/wayinvideo/api-dashboard).
3. API Units di saldo akun Anda. Sebelum menggunakan API, beli API Units Package dari dashboard agar akun memiliki API Units yang tersedia.

> Jaga API key Anda tetap pribadi. Jangan tempelkan ke repository publik, transcript bersama, atau client-side code.

---

## Menginstal WayinVideo Skill

### Step 1: Download Skill Package

Kunjungi halaman WayinVideo Skills:

[https://clawhub.ai/wayinvideo/video-understanding-and-ai-clipping](https://clawhub.ai/wayinvideo/video-understanding-and-ai-clipping)

Download skill package. File ZIP akan tersimpan di mesin lokal Anda.

### Step 2: Instal Skill di Claude Code

Buka Claude Code dan masukkan prompt berikut:

```text
install the skill from [the path of downloaded zip file]
```

Ganti `[the path of downloaded zip file]` dengan path lokal ke file ZIP yang Anda download.

Contoh:

```text
install the skill from /Users/example/Downloads/wayinvideo-video-understanding-and-ai-clipping.zip
```

### Step 3: Masukkan WayinVideo API Key

Setelah instalasi selesai, Claude Code akan meminta Anda memasukkan API key WayinVideo.

Anda bisa mendapatkan API key di sini:

[https://wayin.ai/wayinvideo/api-dashboard](https://wayin.ai/wayinvideo/api-dashboard)

Sebelum menggunakan Skill, pastikan akun Anda memiliki API Units yang tersedia. Jika saldo kosong, beli API Units Package dari dashboard terlebih dahulu.

### Step 4: Restart Claude Desktop Jika Diminta

Jika Anda menggunakan Claude Desktop, aplikasi mungkin meminta restart setelah menginstal Skill.

Ikuti instruksi aplikasi dan restart jika diminta. Setelah restart, WayinVideo Skill siap digunakan.

---

## Coba Prompt Pertama Anda

Setelah Skill terinstal, Anda dapat memulai dengan prompt seperti:

```text
Use /wayinvideo to clip the best moments from this video. I want to post them on TikTok: [a youtube video link]
```

Ganti `[a youtube video link]` dengan URL video yang ingin diproses.

Claude Code akan menggunakan WayinVideo Skill untuk mengirim dan memproses video, lalu mengembalikan rekomendasi klip atau klip yang dibuat sesuai permintaan Anda.

---

## Contoh Prompt Lainnya

### Membuat Kandidat Klip untuk TikTok

```text
Use /wayinvideo to find 5 high-energy moments from this YouTube video for TikTok. Include titles, descriptions, and hashtags: https://www.youtube.com/watch?v=example
```

### Menemukan Momen Demo Produk

```text
Use /wayinvideo to find moments where the speaker explains the product features. Return timestamps and short descriptions: https://www.youtube.com/watch?v=example
```

### Meringkas Video Panjang

```text
Use /wayinvideo to summarize this video and list the most important highlights: https://www.youtube.com/watch?v=example
```

### Membuat Klip untuk Publikasi Sosial

```text
Use /wayinvideo to create short clips from this video for YouTube Shorts and TikTok. Prefer vertical clips and include captions: https://www.youtube.com/watch?v=example
```

---

## Dokumentasi Terkait

Untuk contoh lain dan dokumentasi Skill lengkap, lihat:

[Video Understanding & AI Clipping Skill](/api-docs/skills-video-understanding-and-ai-clipping/)

Dokumentasi API berikut juga dapat membantu:

| Tujuan | Dokumentasi |
| ------ | ----------- |
| Mengubah video panjang menjadi klip pendek | [AI Clipping API](/api-docs/ai-clipping/) |
| Menemukan momen dengan instruksi bahasa alami | [Find Moments API](/api-docs/find-moments/) |
| Membuat ringkasan video terstruktur | [Video Summarization API](/api-docs/video-summarization/) |
| Membuat transkrip dengan stempel waktu | [Video Transcription API](/api-docs/video-transcription/) |
| Merender atau mengekspor ulang klip terpilih | [Clips Export API](/api-docs/clips-export/) |
| Mempublikasikan klip ke akun media sosial | [Social Media Publishing API](/api-docs/social-media-publishing/) |
| Memahami billing dan API Units | [Pricing](/api-docs/pricing/) |

---

## Troubleshooting

### Claude Code Tidak Mengenali `/wayinvideo`

Pastikan instalasi Skill selesai dengan sukses. Jika Anda menggunakan Claude Desktop dan diminta restart, restart aplikasi lalu coba lagi.

### Claude Code Meminta API Key Lagi

Masukkan API key WayinVideo dari [API Dashboard](https://wayin.ai/wayinvideo/api-dashboard). Jika Anda baru merotasi key, gunakan key yang baru.

### API Request Gagal Karena API Units

Periksa saldo API Units Anda di [WayinVideo API Dashboard](https://wayin.ai/wayinvideo/api-dashboard). Jika saldo kosong, beli API Units Package sebelum menggunakan API.


---


## Integrasi Workflow Video n8n

Gunakan **n8n** untuk membangun workflow WayinVideo yang ramah developer dengan HTTP request, transformasi JavaScript kustom, scheduled jobs, webhook, database, dan infrastruktur self-hosted.

n8n cocok saat Anda ingin kontrol lebih besar atas credential, perilaku retry, storage, kode kustom, dan workflow pemrosesan video berskala besar.

Dengan WayinVideo API dan n8n, Anda dapat membangun otomatisasi video self-hosted untuk pipeline YouTube ke klip, pemrosesan file privat, operasi konten terjadwal, polling berbasis database, dan integrasi CMS kustom.

> WayinVideo tidak memerlukan node n8n khusus. Anda dapat terhubung melalui node **HTTP Request** menggunakan API key WayinVideo Anda.

---

## Apa yang Bisa Diotomatisasi dengan n8n

- **Workflow YouTube ke klip**: Pantau RSS feed atau record channel, lalu hasilkan klip pendek dengan judul, deskripsi, hashtag, score, dan export link.
- **Pemrosesan video privat**: Upload file lokal dengan [Upload API](/api-docs/upload/) dan jalankan clipping, ringkasan, transkripsi, atau pencarian momen.
- **Polling terjadwal**: Gunakan workflow Cron untuk memproses video dalam antrean dan mengecek tugas yang belum selesai dari waktu ke waktu.
- **Transformasi kustom**: Gunakan Function node untuk membentuk ulang ringkasan, transkrip, dan metadata klip sebelum disimpan.
- **Integrasi sistem internal**: Kirim hasil ke database, tool CMS, webhook, Slack, Google Sheets, atau aplikasi review internal.

---

## Cara Kerjanya

Sebagian besar workflow n8n mengikuti pola ini:

1. **Trigger**: Mulai dengan Cron node, Webhook node, RSS trigger, storage event, atau database query.
2. **Submit**: Gunakan node HTTP Request untuk memanggil endpoint WayinVideo API.
3. **Store**: Simpan task `id` yang dikembalikan di database, sheet, atau workflow item.
4. **Poll**: Gunakan scheduled runs atau loop logic untuk memanggil result endpoint hingga `status` menjadi `SUCCEEDED` atau `FAILED`.
5. **Transform**: Gunakan Function node untuk membentuk ulang metadata klip, ringkasan, transkrip, atau export link.
6. **Deliver**: Kirim hasil ke CMS, database, Slack, Google Sheets, antrean review sosial, atau webhook internal.

Kami merekomendasikan polling setiap **30 detik** saat mengecek status tugas.

---

## Contoh: Pipeline YouTube RSS ke Klip Sosial

Workflow ini menggunakan [AI Clipping API](/api-docs/ai-clipping/) untuk mengubah video YouTube baru menjadi output klip pendek untuk review atau publikasi.

Trigger:
YouTube RSS feed atau pengecekan terjadwal untuk video baru.

Langkah:
1. Deteksi URL video YouTube baru
2. Kirim ke [AI Clipping API](/api-docs/ai-clipping/) dengan `enable_export` disetel ke `true`
3. Poll hingga `status` menjadi `SUCCEEDED`
4. Gunakan Function node untuk memformat judul klip, deskripsi, hashtag, score, dan nilai `export_link`
5. Tulis hasilnya ke Google Sheets, database, atau antrean review media sosial

Cocok untuk:
Creator tools, tim media, dan sistem konten internal yang membutuhkan pipeline berulang dari video panjang ke video pendek.

### Submit Request

```bash
curl -X POST https://wayinvideo-api.wayin.ai/api/v2/clips \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-wayinvideo-api-version: v2" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://www.youtube.com/watch?v=example",
    "enable_export": true,
    "resolution": "HD_720",
    "enable_caption": true,
    "enable_ai_reframe": true,
    "ratio": "RATIO_9_16"
  }'
```

---

## Contoh: Upload File, Find Moments, dan Simpan Hasil

Workflow ini menggunakan [Upload API](/api-docs/upload/) untuk file privat dan [Find Moments API](/api-docs/find-moments/) untuk mencari video dengan kueri bahasa natural.

Trigger:
File baru di cloud storage atau formulir upload internal.

Langkah:
1. Minta upload URL dari [Upload API](/api-docs/upload/)
2. Upload file lokal ke pre-signed URL
3. Berikan `identity` yang dikembalikan sebagai `video_url` ke [Find Moments API](/api-docs/find-moments/)
4. Poll hingga hasil siap
5. Simpan momen yang cocok, timestamp, judul, deskripsi, dan hashtag di CMS atau database Anda

Cocok untuk:
Tim yang mengelola file video privat, bukan URL video publik.

### Find Moments Request

```bash
curl -X POST https://wayinvideo-api.wayin.ai/api/v2/clips/find-moments \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-wayinvideo-api-version: v2" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "file_abc123",
    "query": "product demo moments",
    "enable_export": false
  }'
```

---

## Contoh: Job Video Intelligence Terjadwal

Workflow ini dapat menggunakan [AI Clipping API](/api-docs/ai-clipping/), [Find Moments API](/api-docs/find-moments/), [Video Summarization API](/api-docs/video-summarization/), atau [Video Transcription API](/api-docs/video-transcription/) tergantung tipe tugas dalam antrean.

Trigger:
Jadwal Cron.

Langkah:
1. Baca record video pending dari database atau sheet
2. Kirim setiap record ke endpoint WayinVideo yang tepat
3. Simpan task ID dan status
4. Poll tugas yang belum selesai pada scheduled run berikutnya
5. Beri tahu tim Anda saat ringkasan, transkrip, atau klip sudah siap

Cocok untuk:
Tim engineering yang menginginkan otomatisasi andal dan dapat dilanjutkan tanpa menjalankan custom worker service.

### Result Check

```bash
curl -X GET https://wayinvideo-api.wayin.ai/api/v2/clips/results/proj_abc123 \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-wayinvideo-api-version: v2"
```

---

## API yang Direkomendasikan

| Tujuan Workflow | API |
|-----------------|-----|
| Mengubah video panjang menjadi klip pendek | [AI Clipping API](/api-docs/ai-clipping/) |
| Menemukan momen spesifik dengan kueri bahasa natural | [Find Moments API](/api-docs/find-moments/) |
| Menghasilkan overview video terstruktur dan highlight timeline | [Video Summarization API](/api-docs/video-summarization/) |
| Mengekstrak transkrip dengan timing dan label pembicara | [Video Transcription API](/api-docs/video-transcription/) |
| Mengupload file video atau audio lokal sebelum diproses | [Upload API](/api-docs/upload/) |
| Merender atau mengekspor ulang klip terpilih | [Clips Export API](/api-docs/clips-export/) |

---

## Praktik Terbaik

- Simpan API key Anda di credential n8n atau environment variable yang terlindungi.
- Simpan task ID di persistent storage jika polling terjadi lintas beberapa workflow execution.
- Gunakan Function node untuk menormalkan hasil sebelum menulis ke CMS, database, atau spreadsheet.
- Tambahkan jalur retry dan failure untuk respons `FAILED` serta request timeout.
- Untuk antrean besar, gunakan polling berbasis Cron daripada membiarkan satu workflow execution terbuka terlalu lama.
- Jika workflow membutuhkan akses klip jangka panjang, salin file `export_link` ke storage Anda sendiri setelah ekspor.

---

## FAQ

### Apakah WayinVideo punya node n8n native?

Anda dapat menghubungkan WayinVideo API ke n8n melalui node **HTTP Request**. Node n8n khusus tidak diperlukan.

### Bisakah n8n mengotomatiskan clipping video YouTube?

Bisa. Gunakan RSS, jadwal, database, atau webhook trigger untuk mendeteksi URL YouTube, kirim ke [AI Clipping API](/api-docs/ai-clipping/), lalu simpan klip dan export link yang dikembalikan.

### Bisakah n8n memproses file video privat?

Bisa. Upload file terlebih dahulu dengan [Upload API](/api-docs/upload/), lalu berikan `identity` yang dikembalikan sebagai `video_url` ke AI Clipping, Find Moments, Video Summarization, atau Video Transcription.

### Apa cara terbaik untuk polling tugas WayinVideo di n8n?

Untuk workflow kecil, Anda dapat melakukan polling dalam eksekusi yang sama. Untuk antrean yang lebih besar, gunakan polling berbasis Cron dan penyimpanan tugas persisten agar workflow tetap dapat dilanjutkan dan andal.


---


## Integrasi Otomatisasi Video Zapier

Gunakan **Zapier** untuk menghubungkan WayinVideo API dengan aplikasi seperti Google Sheets, Google Drive, YouTube, Zoom, Slack, Gmail, Airtable, Notion, dan HubSpot.

Zapier cocok untuk workflow no-code yang ringan, saat sebuah event bisnis perlu memicu tugas pemrosesan video: merangkum rekaman baru, mentranskripsi meeting, membuat kandidat klip dari video YouTube, atau mengirim highlight ke tim Anda.

Dengan WayinVideo API dan Webhooks by Zapier, Anda dapat membangun workflow otomatisasi video AI untuk operasi konten, repurposing podcast, tindak lanjut webinar, rekap meeting, review klip sosial, dan antrean riset video.

> WayinVideo tidak memerlukan aplikasi Zapier khusus. Anda dapat terhubung melalui **Webhooks by Zapier** menggunakan API key WayinVideo Anda.

---

## Apa yang Bisa Diotomatisasi dengan Zapier

- **YouTube ke klip AI**: Deteksi upload baru di channel dan hasilkan kandidat klip dengan judul, deskripsi, hashtag, timestamp, dan viral score.
- **Ringkasan rekaman Zoom**: Ubah rekaman webinar atau meeting menjadi ringkasan terstruktur dan highlight timeline.
- **Antrean video Google Sheets**: Proses baris berisi URL video dan tulis hasilnya kembali ke spreadsheet yang sama.
- **Workflow transkripsi**: Kirim URL video atau audio ke [Video Transcription API](/api-docs/video-transcription/) dan simpan transkrip di Airtable, Notion, atau CMS.
- **Workflow review klip**: Hasilkan metadata klip terlebih dahulu, lalu biarkan tim Anda memilih klip mana yang akan diekspor dengan [Clips Export API](/api-docs/clips-export/).

---

## Cara Kerjanya

Sebagian besar workflow Zapier mengikuti pola ini:

1. **Trigger**: Baris baru, file, pengiriman formulir, video, atau rekaman meeting memulai Zap.
2. **Submit**: Webhooks by Zapier mengirim HTTP request ke endpoint WayinVideo API.
3. **Wait / Poll**: Zapier mengecek result endpoint hingga `status` menjadi `SUCCEEDED` atau `FAILED`.
4. **Route**: Zapier mengirim ringkasan, transkrip, metadata klip, atau export link ke aplikasi lain.

Kami merekomendasikan polling setiap **30 detik** saat mengecek status tugas.

---

## Contoh: Meringkas Video dari Google Sheets

Workflow ini menggunakan [Video Summarization API](/api-docs/video-summarization/) untuk mengubah URL video di spreadsheet menjadi ringkasan terstruktur dan highlight timeline.

Trigger:
Baris baru di Google Sheets dengan kolom `video_url`.

Langkah:
1. Gunakan Webhooks by Zapier untuk memanggil [Video Summarization API](/api-docs/video-summarization/) dengan `POST /api/v2/summaries`
2. Simpan task `id` yang dikembalikan di baris yang sama
3. Tambahkan delay atau langkah follow-up terjadwal
4. Panggil `GET /api/v2/summaries/results/{id}` hingga tugas mencapai `SUCCEEDED`
5. Tulis `summary`, `tags`, dan `highlights` kembali ke Google Sheets

Cocok untuk:
Tim editorial, peneliti konten, dan marketer yang menyimpan antrean video di spreadsheet.

### Submit Request

```bash
curl -X POST https://wayinvideo-api.wayin.ai/api/v2/summaries \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-wayinvideo-api-version: v2" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://www.youtube.com/watch?v=example"
  }'
```

### Poll Request

```bash
curl -X GET https://wayinvideo-api.wayin.ai/api/v2/summaries/results/sum_proj_001 \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-wayinvideo-api-version: v2"
```

---

## Contoh: Mengubah Rekaman Zoom menjadi Rekap Tim

Workflow ini menggunakan [Video Summarization API](/api-docs/video-summarization/) untuk mengubah rekaman meeting, webinar, atau panggilan pelanggan menjadi rekap yang siap dibagikan ke tim.

Trigger:
Rekaman cloud Zoom baru.

Langkah:
1. Kirim URL rekaman ke [Video Summarization API](/api-docs/video-summarization/)
2. Poll result endpoint hingga `status` menjadi `SUCCEEDED`
3. Kirim ringkasan dan highlight timeline ke Slack
4. Simpan hasilnya di Notion, Airtable, HubSpot, atau Google Sheet

Cocok untuk:
Rekap webinar, panggilan pelanggan, meeting internal, wawancara, dan sesi pelatihan.

---

## Contoh: Membuat Kandidat Klip dari Video YouTube Baru

Workflow ini menggunakan [AI Clipping API](/api-docs/ai-clipping/) untuk mendeteksi kandidat klip pendek sebelum tim Anda memilih apa yang akan diekspor atau dipublikasikan.

Trigger:
Video YouTube baru di sebuah channel.

Langkah:
1. Kirim URL YouTube ke [AI Clipping API](/api-docs/ai-clipping/)
2. Atur `enable_export` ke `false` jika Anda hanya memerlukan timestamp dan metadata klip
3. Poll result endpoint hingga tugas selesai
4. Kirim judul klip, deskripsi, timestamp, hashtag, dan score ke Airtable atau Google Sheets untuk direview

Cocok untuk:
Kreator dan tim sosial yang ingin memiliki antrean review sebelum merender atau memublikasikan klip.

### Submit Request

```bash
curl -X POST https://wayinvideo-api.wayin.ai/api/v2/clips \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-wayinvideo-api-version: v2" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://www.youtube.com/watch?v=example",
    "enable_export": false
  }'
```

---

## API yang Direkomendasikan

| Tujuan Workflow | API |
|-----------------|-----|
| Mengubah video panjang menjadi klip pendek | [AI Clipping API](/api-docs/ai-clipping/) |
| Menemukan momen spesifik dengan kueri bahasa natural | [Find Moments API](/api-docs/find-moments/) |
| Menghasilkan overview video terstruktur dan highlight timeline | [Video Summarization API](/api-docs/video-summarization/) |
| Mengekstrak transkrip dengan timing dan label pembicara | [Video Transcription API](/api-docs/video-transcription/) |
| Mengupload file video atau audio lokal sebelum diproses | [Upload API](/api-docs/upload/) |
| Merender atau mengekspor ulang klip terpilih | [Clips Export API](/api-docs/clips-export/) |

---

## Praktik Terbaik

- Simpan API key Anda di connection atau secret fields Zapier. Jangan menaruhnya di template Zap publik.
- Segera simpan task `id` yang dikembalikan agar retry tidak kehilangan jejak tugas yang sedang berjalan.
- Gunakan delay Zapier atau langkah follow-up terjadwal agar polling tidak terlalu sering.
- Selalu tangani status `SUCCEEDED` dan `FAILED`.
- Gunakan `enable_export: false` saat tim Anda hanya membutuhkan timestamp dan metadata untuk review. Ekspor klip terpilih nanti dengan [Clips Export API](/api-docs/clips-export/).

---

## FAQ

### Apakah WayinVideo punya aplikasi Zapier native?

Anda dapat menghubungkan WayinVideo API ke Zapier melalui **Webhooks by Zapier**. Aplikasi Zapier khusus tidak diperlukan.

### Bisakah Zapier meringkas video YouTube dengan WayinVideo?

Bisa. Gunakan trigger YouTube atau baris Google Sheets yang berisi URL YouTube, kirim ke [Video Summarization API](/api-docs/video-summarization/), lalu tulis ringkasan dan highlight yang dihasilkan kembali ke aplikasi pilihan Anda.

### Bisakah Zapier membuat klip pendek dari video panjang?

Bisa. Kirim URL video ke [AI Clipping API](/api-docs/ai-clipping/). Anda dapat mengembalikan metadata klip saja untuk review, atau mengaktifkan ekspor untuk merender klip pendek yang dapat diunduh.

### Seberapa sering Zapier sebaiknya mengecek status tugas?

Kami merekomendasikan pengecekan status tugas setiap **30 detik**. Simpan task `id` agar setiap langkah polling dapat mengambil hasil yang tepat.


---


## Integrasi Otomatisasi Video Make

Gunakan **Make** untuk membangun workflow WayinVideo tingkat lanjut dengan branching logic, iterator, router, filter, retry, dan pemetaan data multi-step.

Make cocok saat otomatisasi Anda perlu memproses banyak video, merutekan tugas sukses dan gagal secara berbeda, atau menjalankan WayinVideo API yang berbeda berdasarkan campaign, bahasa, sumber, atau tipe konten.

Dengan WayinVideo API dan modul HTTP Make, Anda dapat membuat skenario otomatisasi video untuk batch AI clipping, repurposing webinar, ringkasan terlokalisasi, antrean review konten, dan pipeline video ke CMS.

> WayinVideo tidak memerlukan aplikasi Make khusus. Anda dapat terhubung melalui modul **HTTP** Make menggunakan API key WayinVideo Anda.

---

## Apa yang Bisa Diotomatisasi dengan Make

- **Batch video clipping**: Pantau folder Google Drive, kirim setiap video ke [AI Clipping API](/api-docs/ai-clipping/), lalu route klip yang selesai ke storage atau antrean review.
- **Repurposing webinar**: Hasilkan ringkasan, highlight, dan klip pendek dari rekaman webinar dengan [Video Summarization API](/api-docs/video-summarization/) dan [AI Clipping API](/api-docs/ai-clipping/).
- **Workflow video multibahasa**: Gunakan `target_lang` untuk membuat ringkasan, transkrip, dan metadata klip yang terlokalisasi.
- **Workflow ekspor**: Render klip terpilih nanti dengan pengaturan caption, reframe, dan ekspor kustom melalui [Clips Export API](/api-docs/clips-export/).

---

## Cara Kerjanya

Sebagian besar skenario Make mengikuti pola ini:

1. **Trigger**: File baru, record, webhook payload, atau skenario terjadwal memulai workflow.
2. **Submit**: Modul HTTP mengirim request ke endpoint WayinVideo API.
3. **Store**: Simpan task `id` yang dikembalikan untuk polling berikutnya.
4. **Poll**: Gunakan pengecekan terjadwal, loop, atau desain skenario untuk memanggil result endpoint hingga tugas mencapai `SUCCEEDED` atau `FAILED`.
5. **Route**: Gunakan router dan filter untuk mengirim hasil yang selesai, kegagalan, dan jalur retry ke modul yang berbeda.

Kami merekomendasikan polling setiap **30 detik** saat mengecek status tugas.

---

## Contoh: Memproses Video dari Google Drive secara Batch

Workflow ini menggunakan [Upload API](/api-docs/upload/) untuk file lokal dan [AI Clipping API](/api-docs/ai-clipping/) untuk menghasilkan klip video pendek secara batch.

Trigger:
File baru di folder Google Drive.

Langkah:
1. Pantau folder untuk file video baru
2. Jika perlu, upload setiap file melalui [Upload API](/api-docs/upload/)
3. Gunakan Iterator untuk mengirim setiap video ke [AI Clipping API](/api-docs/ai-clipping/)
4. Simpan setiap task `id` yang dikembalikan
5. Poll setiap tugas dan route hasil yang selesai ke langkah berikutnya
6. Simpan klip, metadata, dan nilai `export_link` ke Google Drive, Airtable, atau CMS Anda

Cocok untuk:
Agensi, studio konten, dan tim yang memproses banyak video secara batch.

### Submit Request

```bash
curl -X POST https://wayinvideo-api.wayin.ai/api/v2/clips \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-wayinvideo-api-version: v2" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://www.youtube.com/watch?v=example",
    "enable_export": true,
    "resolution": "HD_720",
    "enable_caption": true,
    "enable_ai_reframe": true,
    "ratio": "RATIO_9_16"
  }'
```

---

## Contoh: Merutekan Konten Webinar Berdasarkan Hasil

Workflow ini menggunakan [Video Summarization API](/api-docs/video-summarization/) untuk rekap webinar dan secara opsional dapat mengirim rekaman yang sama ke [AI Clipping API](/api-docs/ai-clipping/) untuk klip pendek.

Trigger:
URL rekaman webinar baru dari formulir, CRM, atau folder storage.

Langkah:
1. Kirim rekaman ke [Video Summarization API](/api-docs/video-summarization/)
2. Poll hasilnya
3. Route tugas yang sukses ke Slack, HubSpot, Notion, atau Google Sheets
4. Route tugas yang gagal ke log error dan beri tahu pemilik workflow
5. Secara opsional, kirim video yang sama ke [AI Clipping API](/api-docs/ai-clipping/) untuk klip pendek

Cocok untuk:
Tim marketing B2B yang mengubah webinar menjadi catatan sales, ringkasan, dan klip sosial.

### Result Check

```bash
curl -X GET https://wayinvideo-api.wayin.ai/api/v2/summaries/results/sum_proj_001 \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-wayinvideo-api-version: v2"
```

Saat respons berisi `status: "SUCCEEDED"`, lanjutkan ke modul downstream. Saat respons berisi `status: "FAILED"`, periksa `error_message` jika ada dan route skenario ke langkah retry, alert, atau review manual.

---

## Contoh: Menghasilkan Output Terlokalisasi

Workflow ini menggunakan `target_lang` dengan [Video Summarization API](/api-docs/video-summarization/), [Video Transcription API](/api-docs/video-transcription/), atau [AI Clipping API](/api-docs/ai-clipping/) untuk membuat output terlokalisasi.

Trigger:
Video baru ditambahkan ke antrean campaign.

Langkah:
1. Buat daftar bahasa target untuk campaign
2. Gunakan Iterator untuk mengirim video yang sama satu kali per `target_lang`
3. Hasilkan ringkasan, transkrip, atau metadata klip untuk setiap locale
4. Route setiap hasil ke workspace regional, sheet, atau antrean review yang tepat

Cocok untuk:
Tim konten global yang membutuhkan ringkasan video, transkrip, atau deskripsi klip multibahasa.

### Localized Summary Request

```bash
curl -X POST https://wayinvideo-api.wayin.ai/api/v2/summaries \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "x-wayinvideo-api-version: v2" \
  -H "Content-Type: application/json" \
  -d '{
    "video_url": "https://www.youtube.com/watch?v=example",
    "source_lang": "en",
    "target_lang": "ja"
  }'
```

---

## API yang Direkomendasikan

| Tujuan Workflow | API |
|-----------------|-----|
| Mengubah video panjang menjadi klip pendek | [AI Clipping API](/api-docs/ai-clipping/) |
| Menemukan momen spesifik dengan kueri bahasa natural | [Find Moments API](/api-docs/find-moments/) |
| Menghasilkan overview video terstruktur dan highlight timeline | [Video Summarization API](/api-docs/video-summarization/) |
| Mengekstrak transkrip dengan timing dan label pembicara | [Video Transcription API](/api-docs/video-transcription/) |
| Mengupload file video atau audio lokal sebelum diproses | [Upload API](/api-docs/upload/) |
| Merender atau mengekspor ulang klip terpilih | [Clips Export API](/api-docs/clips-export/) |

---

## Praktik Terbaik

- Simpan API key Anda di connection Make atau protected variable.
- Simpan task ID di data store, sheet, atau database jika skenario berjalan lintas beberapa eksekusi.
- Gunakan router untuk status `SUCCEEDED`, `ONGOING`, dan `FAILED`.
- Jaga ukuran batch tetap cukup kecil untuk menghindari timeout platform dan membuat retry lebih mudah dikelola.
- Untuk klip yang diekspor, salin file `export_link` ke storage Anda sendiri jika workflow membutuhkan akses jangka panjang.

---

## FAQ

### Apakah WayinVideo punya aplikasi Make native?

Anda dapat menghubungkan WayinVideo API ke Make melalui modul **HTTP**. Aplikasi Make khusus tidak diperlukan.

### Bisakah Make memproses video secara batch dengan WayinVideo?

Bisa. Gunakan iterator Make untuk mengirim beberapa video ke WayinVideo, simpan setiap task `id`, dan poll hasilnya sebelum merutekan tugas yang sukses ke modul berikutnya.

### Bisakah Make menangani tugas pemrosesan video yang gagal?

Bisa. Gunakan router dan filter untuk memisahkan respons `SUCCEEDED`, `ONGOING`, dan `FAILED`. Untuk tugas yang gagal, periksa `error_message` jika ada dan route skenario ke retry, alert, atau review manual.

### Bisakah Make membuat ringkasan video multibahasa?

Bisa. Kirim video yang sama dengan nilai `target_lang` berbeda untuk menghasilkan ringkasan, transkrip, atau metadata klip terlokalisasi bagi tim regional.


---

23:["$","div",null,{"className":"-mt-6 md:-mt-10","children":["$","$L25",null,{"docHtml":"$26","docTitle":"AI Clipping API","docUpdatedAt":"April 1, 2026","currentSlug":"ai-clipping","categories":[{"name":"Memulai","docs":[{"slug":"introduction","title":"Pengenalan","category":"Memulai","sortOrder":100,"badge":"$undefined","excerpt":"Gambaran umum WayinVideo API dan kemampuan utamanya.","contents":"$27","updatedAt":"March 10, 2026","seo":{"title":"Pengenalan - Dokumentasi WayinVideo API","description":"WayinVideo API untuk pemrosesan video panjang yang cepat dan andal. Ubah podcast, webinar, livestream, tutorial, video ecommerce, dan lainnya menjadi klip, ringkasan, transkrip, dan momen yang dapat dicari.","keywords":"wayinvideo api, api video panjang, api pemrosesan video, api klipping ai, api ringkasan video, api transkripsi video, api temukan momen"}},{"slug":"quickstart","title":"Panduan Cepat","category":"Memulai","sortOrder":200,"badge":"$undefined","excerpt":"Mulai menggunakan WayinVideo API dalam hitungan menit.","contents":"$28","updatedAt":"March 10, 2026","seo":{"title":"Panduan Cepat – Kirim Tugas Pemahaman & Klipping Video Pertama Anda｜WayinVideo API","description":"Panduan cepat langkah demi langkah untuk WayinVideo API — dapatkan kunci API, kirim tugas klipping video, polling hasil, dan integrasikan AI Clipping, Summarization, Transcription, atau Find Moments.","keywords":""}},{"slug":"authentication","title":"Autentikasi","category":"Memulai","sortOrder":300,"badge":"$undefined","excerpt":"Pelajari cara mengautentikasi permintaan API Anda.","contents":"$29","updatedAt":"March 10, 2026","seo":{"title":"Autentikasi API – Pengaturan Bearer Token & Kunci API｜WayinVideo API","description":"Autentikasi permintaan WayinVideo API dengan Bearer token dan header x-wayinvideo-api-version. Mencakup cara membuat dan menyimpan kunci API Anda dengan aman.","keywords":""}}]},{"name":"APIs","docs":[{"slug":"ai-clipping","title":"AI Clipping API","category":"APIs","sortOrder":400,"badge":"$undefined","excerpt":"Kirimkan video panjang dan terima klip viral bertenaga AI dengan stempel waktu, judul, deskripsi, dan tagar.","contents":"$2a","updatedAt":"April 1, 2026","seo":{"title":"AI Clipping API – Ubah Video Panjang Menjadi Klip Pendek｜WayinVideo API","description":"Kirimkan video dengan panjang berapa pun dan terima klip viral bertenaga AI yang diurutkan berdasarkan potensi viral, masing-masing dengan stempel waktu mulai/akhir, judul, deskripsi, tagar, dan ekspor yang telah dirender secara opsional.","keywords":"api ai clipping, api klipping video, video panjang ke klip pendek, api generator klip viral, api video pendek, api stempel waktu klip, wayinvideo ai clipping"}},{"slug":"find-moments","title":"Find Moments API","category":"APIs","sortOrder":500,"badge":"$undefined","excerpt":"Identifikasi dan ekstrak momen-momen kunci dari video menggunakan kueri bahasa alami.","contents":"$2b","updatedAt":"April 1, 2026","seo":{"title":"Find Moments API – Cari Video Panjang dengan Bahasa Alami｜WayinVideo API","description":"Deskripsikan momen dalam bahasa alami (\"reaksi lucu\", \"demo produk\") dan API akan mengekstrak klip yang cocok dengan stempel waktu, judul, dan deskripsi dari video dengan panjang berapa pun.","keywords":"api find moments, api pencarian video, pencarian video panjang, api highlight video, pencarian video bahasa alami, ekstraksi momen kunci, api stempel waktu klip, wayinvideo api"}},{"slug":"clips-export","title":"Clips Export API","category":"APIs","sortOrder":550,"badge":"$undefined","excerpt":"Ekspor atau ekspor ulang klip yang ada dari AI Clipping dan Find Moments dengan gaya subtitel dan pengaturan render baru.","contents":"$2c","updatedAt":"April 1, 2026","seo":{"title":"Clips Export API - Dokumentasi WayinVideo API","description":"Gunakan WayinVideo Clips Export API untuk merender atau mengekspor ulang klip dengan gaya subtitel berbeda, rasio aspek, AI hook, dan pengaturan ekspor video format pendek.","keywords":"api ekspor klip, api ekspor video, ekspor ulang klip, ekspor gaya subtitel, ekspor rasio aspek, ekspor ai clipping, ekspor find moments, wayinvideo api"}},{"slug":"video-summarization","title":"Video Summarization API","category":"APIs","sortOrder":600,"badge":"$undefined","excerpt":"Hasilkan ringkasan video bertenaga AI, tagar, dan highlight timeline.","contents":"$2d","updatedAt":"March 16, 2026","seo":{"title":"Video Summarization API – Ringkasan AI & Highlight Timeline｜WayinVideo API","description":"Hasilkan ringkasan AI terstruktur, tagar, dan highlight timeline untuk video panjang — podcast, webinar, kuliah, tutorial. Bekerja pada URL YouTube, Vimeo, TikTok dan file lokal.","keywords":"api ringkasan video, ringkasan video ai, ringkasan video panjang, ringkasan podcast, ringkasan webinar, api ringkasan youtube, api highlight timeline, wayinvideo api"}},{"slug":"video-transcription","title":"Video Transcription API","category":"APIs","sortOrder":700,"badge":"$undefined","excerpt":"Ekstrak transkrip tingkat kata dengan diarisasi pembicara (label pembicara) dari konten video atau audio.","contents":"$2e","updatedAt":"March 16, 2026","seo":{"title":"Video Transcription API – Diarisasi Pembicara & Stempel Waktu Tingkat Kata｜WayinVideo API","description":"Transkripsikan video panjang, podcast, webinar, dan rapat dengan stempel waktu tingkat kata dan diarisasi pembicara. Mendukung URL YouTube, Vimeo, TikTok, Zoom dan unggahan file lokal.","keywords":"api transkripsi video, api transkripsi audio, api diarisasi pembicara, api transkrip, transkrip tingkat kata, transkripsi podcast, transkripsi rapat, wayinvideo api"}},{"slug":"upload","title":"Upload API","category":"APIs","sortOrder":800,"badge":"$undefined","excerpt":"Unggah file video atau audio lokal untuk AI Clipping, Summarization, Transcription, dan Find Moments.","contents":"$2f","updatedAt":"April 1, 2026","seo":{"title":"Unggah File Lokal untuk AI Clipping, Summarization & Transcription｜WayinVideo","description":"Unggah file video atau audio lokal ke WayinVideo untuk AI Clipping, Summarization, Transcription, dan Find Moments. Mengembalikan ID file yang dapat Anda berikan sebagai video_url ke endpoint pemrosesan apa pun.","keywords":"upload local video for ai, upload audio for ai processing, wayinvideo upload api, video file upload api, audio file upload api, presigned url upload, file upload for ai clipping, file upload for transcription"}},{"slug":"ai-for-stream-videos","title":"AI for Stream Videos","category":"APIs","sortOrder":900,"badge":"New","externalUrl":"https://wayin.ai/solutions/stream","excerpt":"WayinVideo AI powers Live Stream Understanding and Clipping for stream videos.","contents":"","updatedAt":"","seo":{"title":"","description":"","keywords":""}}]},{"name":"API","docs":[{"slug":"social-media-publishing","title":"Social Media Publishing API","category":"API","sortOrder":560,"badge":"New","excerpt":"Hubungkan akun media sosial, jadwalkan posting, dan publikasikan klip buatan AI ke YouTube, TikTok, Instagram, Facebook, X / Twitter, LinkedIn, dan lainnya.","contents":"$30","updatedAt":"June 14, 2026","seo":{"title":"Social Media Publishing API untuk Video Clips｜WayinVideo API","description":"Publikasikan klip video buatan AI ke YouTube, TikTok, Instagram, Facebook, X / Twitter, dan LinkedIn. Hubungkan akun sosial dengan OAuth, lihat daftar akun, jadwalkan posting, dan buat tugas publikasi dengan API WayinVideo.","keywords":"social media publishing api, video publishing api, api publikasi video clips, youtube shorts upload api, tiktok publishing api, instagram reels publishing api, social oauth api, api jadwal posting sosial, wayinvideo api"}}]},{"name":"Agent Skills","docs":[{"slug":"skills-video-understanding-and-ai-clipping","title":"Video Understanding & AI Clipping Skill","category":"Agent Skills","sortOrder":840,"badge":"$undefined","excerpt":"Gunakan satu WayinVideo skill di OpenClaw untuk menangani AI clipping, find moments, ringkasan video, dan transkripsi video dari satu instalasi.","contents":"$31","updatedAt":"April 3, 2026","seo":{"title":"Video Understanding & AI Clipping Skill untuk OpenClaw - Dokumentasi WayinVideo API","description":"Instal WayinVideo Video Understanding & AI Clipping Skill untuk OpenClaw untuk mengklip, menemukan momen, meringkas, dan mentranskripsikan video dengan satu integrasi.","keywords":""}},{"slug":"skills-ai-clipping","title":"AI Clipping Skill","category":"Agent Skills","sortOrder":850,"badge":"$undefined","excerpt":"Gunakan WayinVideo AI Clipping Skill di OpenClaw untuk secara otomatis menghasilkan klip pendek viral dari video panjang.","contents":"$32","updatedAt":"March 19, 2026","seo":{"title":"AI Clipping Skill untuk OpenClaw - Dokumentasi WayinVideo API","description":"Instal WayinVideo AI Clipping Skill untuk OpenClaw guna mengubah video panjang menjadi video pendek secara otomatis dengan klip yang dipilih AI.","keywords":""}},{"slug":"skills-find-moments","title":"Find Moments Skill","category":"Agent Skills","sortOrder":860,"badge":"$undefined","excerpt":"Gunakan WayinVideo Find Moments Skill di OpenClaw untuk menemukan momen-momen tepat dalam video panjang menggunakan kueri bahasa alami.","contents":"$33","updatedAt":"March 27, 2026","seo":{"title":"Find Moments Skill untuk OpenClaw - Dokumentasi WayinVideo API","description":"Instal WayinVideo Find Moments Skill untuk OpenClaw guna mencari video panjang dengan prompt bahasa alami.","keywords":""}}]},{"name":"Integration","docs":[{"slug":"codex-integration","title":"Codex","category":"Integration","sortOrder":878,"badge":"New","excerpt":"Instal WayinVideo Skill di Codex untuk mengubah URL video menjadi klip, ringkasan, timestamp, dan konten sosial siap publikasi dari coding workspace Anda.","contents":"$34","updatedAt":"June 14, 2026","seo":{"title":"Integrasi Codex Video Clipping dengan WayinVideo Skill","description":"Instal WayinVideo Skill di Codex untuk menjalankan AI video clipping, pemahaman video, transkripsi, ringkasan, dan workflow social publishing dari coding workspace Anda menggunakan API key WayinVideo.","keywords":"codex video clipping, codex wayinvideo skill, codex video understanding, codex ai video workflow, codex youtube clips, codex tiktok clips, wayinvideo codex integration, developer video automation"}},{"slug":"claude-code-integration","title":"Claude Code","category":"Integration","sortOrder":879,"badge":"New","excerpt":"Instal WayinVideo Skill di Claude Code atau Claude Desktop untuk memotong, memahami, meringkas, mentranskrip, dan menggunakan ulang video dengan prompt bahasa alami.","contents":"$35","updatedAt":"June 14, 2026","seo":{"title":"Claude Code Video Clipping Skill untuk WayinVideo API","description":"Instal WayinVideo Skill di Claude Code atau Claude Desktop untuk menjalankan AI video clipping, pemahaman video, ringkasan, transkripsi, dan workflow klip media sosial dengan prompt bahasa alami.","keywords":"claude code video clipping, claude code wayinvideo skill, claude desktop video clipping, claude code video understanding, ai video clipping claude, claude youtube clips, claude tiktok clips, wayinvideo claude code"}},{"slug":"n8n-integration","title":"Workflow n8n","category":"Integration","sortOrder":880,"badge":"$undefined","excerpt":"Hubungkan WayinVideo API dengan n8n untuk membangun workflow video AI self-hosted untuk clipping, ringkasan, transkripsi, Find Moments, dan pemrosesan terjadwal.","contents":"$36","updatedAt":"May 25, 2026","seo":{"title":"Integrasi Workflow Video n8n｜WayinVideo API","description":"Bangun otomatisasi video self-hosted di n8n dengan WayinVideo API. Gunakan node HTTP Request, Cron, Webhook, dan Function untuk AI clipping, ringkasan video, transkripsi, Find Moments, dan ekspor klip.","keywords":"workflow video n8n, n8n video workflow, n8n video automation, n8n ai clipping, n8n video api, n8n ringkasan video, n8n transcription workflow, n8n youtube clips workflow, wayinvideo n8n integration"}},{"slug":"zapier-integration","title":"Workflow Zapier","category":"Integration","sortOrder":881,"badge":"$undefined","excerpt":"Hubungkan WayinVideo API dengan Zapier untuk mengotomatiskan workflow YouTube, Zoom, Google Sheets, AI clipping, ringkasan video, dan transkripsi.","contents":"$37","updatedAt":"May 25, 2026","seo":{"title":"Integrasi Otomatisasi Video Zapier｜WayinVideo API","description":"Otomatiskan workflow video di Zapier dengan WayinVideo API. Gunakan Webhooks by Zapier untuk AI clipping, ringkasan video, transkripsi, video YouTube, rekaman Zoom, dan antrean Google Sheets.","keywords":"otomatisasi video zapier, zapier video automation, zapier video api, zapier ai clipping, zapier ringkasan video, zapier transcription workflow, otomatisasi video youtube zapier, ringkasan rekaman zoom, wayinvideo zapier integration"}},{"slug":"make-integration","title":"Workflow Make","category":"Integration","sortOrder":882,"badge":"$undefined","excerpt":"Hubungkan WayinVideo API dengan Make untuk membangun skenario otomatisasi video tingkat lanjut untuk AI clipping, ringkasan webinar, pemrosesan batch, dan output multibahasa.","contents":"$38","updatedAt":"May 25, 2026","seo":{"title":"Integrasi Otomatisasi Video Make｜WayinVideo API","description":"Bangun otomatisasi video tingkat lanjut di Make dengan WayinVideo API. Gunakan modul HTTP, router, filter, dan iterator untuk AI clipping, ringkasan webinar, transkripsi, Find Moments, ekspor klip, dan workflow multibahasa.","keywords":"otomatisasi video make, make video automation, make video api, make ai clipping, make ringkasan video, make http module video workflow, make webhook video workflow, make batch video processing, wayinvideo make integration"}}]},{"name":"Referensi","docs":[{"slug":"pricing","title":"Penagihan","category":"Referensi","sortOrder":900,"badge":"$undefined","excerpt":"Pahami akses API, unit, harga, dan penagihan.","contents":"$39","updatedAt":"March 10, 2026","seo":{"title":"Harga API - Dokumentasi WayinVideo API","description":"Pelajari harga WayinVideo API, Kredit API, penagihan, dan persyaratan akses.","keywords":""}},{"slug":"status-codes","title":"Kode Status","category":"Referensi","sortOrder":950,"badge":"$undefined","excerpt":"Kode status HTTP dan format respons untuk WayinVideo API.","contents":"$3a","updatedAt":"March 13, 2026","seo":{"title":"Kode Status - Dokumentasi WayinVideo API","description":"Referensi kode status HTTP WayinVideo API, arti error, dan panduan pemecahan masalah.","keywords":""}},{"slug":"rate-limits","title":"Batas Laju","category":"Referensi","sortOrder":1000,"badge":"$undefined","excerpt":"Pahami batas laju dan batas konkurensi untuk WayinVideo API.","contents":"\n## Batas Laju\n\nUntuk memastikan stabilitas sistem dan penggunaan yang adil bagi semua pengembang, WayinVideo menerapkan batas laju dan batas konkurensi pada permintaan API.\n\n## Batas Laju Permintaan\n\n| Jenis Batas | Nilai |\n|-------------|-------|\n| Permintaan per menit | 15 |\n\nJika Anda melampaui batas laju, API mengembalikan kode status HTTP `429 Too Many Requests`.\n\n## Batas Konkurensi\n\n| Jenis Batas | Nilai |\n|-------------|-------|\n| Maksimum proyek yang berjalan bersamaan | 5 |\n\nAnda dapat memiliki hingga **5** proyek yang berjalan secara bersamaan. Mengirimkan tugas baru ketika Anda sudah memiliki 5 proyek aktif akan menghasilkan respons `429`.\n\n## Contoh Respons 429\n\n```json\n{\n  \"timestamp\": \"2026-03-10T15:52:01.610+00:00\",\n  \"status\": 429,\n  \"error\": \"Too Many Requests\",\n  \"path\": \"/api/v2/clips/results/prjxxx\"\n}\n```\n\n> Jika Anda memerlukan batas yang lebih tinggi, silakan hubungi kami di [wayinvideo@wayin.ai](mailto:wayinvideo@wayin.ai).\n","updatedAt":"March 10, 2026","seo":{"title":"Batas Laju - Dokumentasi WayinVideo API","description":"Pelajari batas laju, batas konkurensi, dan panduan pembatasan permintaan WayinVideo API.","keywords":""}},{"slug":"subtitles-style","title":"Gaya Subtitel","category":"Referensi","sortOrder":1100,"badge":"$undefined","excerpt":"Template gaya subtitel yang tersedia untuk AI Clipping dan Find Moments.","contents":"\n## Gaya Subtitel\n\nSaat menggunakan API [AI Clipping](/api-docs/ai-clipping/) atau [Find Moments](/api-docs/find-moments/) dengan subtitel diaktifkan, Anda dapat menentukan template gaya subtitel melalui parameter `cc_style_tpl`.\n\n## Penggunaan\n\nBerikan ID gaya sebagai nilai `cc_style_tpl` saat mengirimkan tugas:\n\n```bash\ncurl -X POST https://wayinvideo-api.wayin.ai/api/v2/clips \\\n  -H \"Content-Type: application/json\" \\\n  -H \"Authorization: Bearer YOUR_API_KEY\" \\\n  -H \"x-wayinvideo-api-version: v2\" \\\n  -d '{\"video_url\": \"https://www.youtube.com/watch?v=example\", \"enable_caption\": true, \"cc_style_tpl\": \"STYLE_ID\"}'\n```\n\n## Gaya yang Tersedia\n\n{{SUBTITLE_STYLES_TABLE}}\n\n> **Catatan:** Gambar pratinjau menunjukkan rendering perkiraan. Hasil aktual mungkin berbeda. Jika tidak ada `cc_style_tpl` yang ditentukan, gaya teks default akan diterapkan.\n","updatedAt":"April 1, 2026","seo":{"title":"Template Gaya Subtitel untuk Ekspor Klip AI｜WayinVideo API","description":"ID template gaya subtitel (cc_style_tpl) untuk digunakan dengan AI Clipping dan Find Moments API — termasuk gaya animated caption, word-focus, dan box-highlight.","keywords":""}},{"slug":"supported-languages","title":"Bahasa yang Didukung","category":"Referensi","sortOrder":1200,"badge":"$undefined","excerpt":"Daftar bahasa yang didukung dan kode ISO 639-nya.","contents":"$3b","updatedAt":"March 10, 2026","seo":{"title":"Bahasa yang Didukung untuk Transkripsi & Penerjemahan Video｜WayinVideo API","description":"Daftar lengkap bahasa dan kode ISO 639 yang didukung oleh WayinVideo API untuk transkripsi, penerjemahan, teks, dan ringkasan video multibahasa.","keywords":""}}]}],"locale":"id","languages":["en","zh-tw","pt","es","id","fr","de","ja"]}]}]


---

a:{"metadata":[["$","title","0",{"children":"AI Clipping API – Ubah Video Panjang Menjadi Klip Pendek｜WayinVideo API"}],["$","meta","1",{"name":"description","content":"Kirimkan video dengan panjang berapa pun dan terima klip viral bertenaga AI yang diurutkan berdasarkan potensi viral, masing-masing dengan stempel waktu mulai/akhir, judul, deskripsi, tagar, dan ekspor yang telah dirender secara opsional."}],["$","meta","2",{"name":"keywords","content":"api ai clipping, api klipping video, video panjang ke klip pendek, api generator klip viral, api video pendek, api stempel waktu klip, wayinvideo ai clipping"}],["$","meta","3",{"name":"referrer","content":"no-referrer-when-downgrade"}],["$","meta","4",{"name":"publisher","content":"WayinVideo"}],["$","meta","5",{"name":"robots","content":"index, follow"}],["$","meta","6",{"name":"author","content":"WayinVideo Team"}],["$","meta","7",{"name":"title","content":"AI Clipping API – Ubah Video Panjang Menjadi Klip Pendek｜WayinVideo API"}],["$","link","8",{"rel":"canonical","href":"https://wayin.ai/id/api-docs/ai-clipping/"}],["$","link","9",{"rel":"alternate","hrefLang":"en","href":"https://wayin.ai/api-docs/ai-clipping/"}],["$","link","10",{"rel":"alternate","hrefLang":"zh-TW","href":"https://wayin.ai/zh-tw/api-docs/ai-clipping/"}],["$","link","11",{"rel":"alternate","hrefLang":"pt","href":"https://wayin.ai/pt/api-docs/ai-clipping/"}],["$","link","12",{"rel":"alternate","hrefLang":"es","href":"https://wayin.ai/es/api-docs/ai-clipping/"}],["$","link","13",{"rel":"alternate","hrefLang":"id","href":"https://wayin.ai/id/api-docs/ai-clipping/"}],["$","link","14",{"rel":"alternate","hrefLang":"fr","href":"https://wayin.ai/fr/api-docs/ai-clipping/"}],["$","link","15",{"rel":"alternate","hrefLang":"de","href":"https://wayin.ai/de/api-docs/ai-clipping/"}],["$","link","16",{"rel":"alternate","hrefLang":"ja","href":"https://wayin.ai/ja/api-docs/ai-clipping/"}],["$","link","17",{"rel":"alternate","hrefLang":"x-default","href":"https://wayin.ai/api-docs/ai-clipping/"}],["$","meta","18",{"property":"og:title","content":"AI Clipping API – Ubah Video Panjang Menjadi Klip Pendek｜WayinVideo API"}],["$","meta","19",{"property":"og:description","content":"Kirimkan video dengan panjang berapa pun dan terima klip viral bertenaga AI yang diurutkan berdasarkan potensi viral, masing-masing dengan stempel waktu mulai/akhir, judul, deskripsi, tagar, dan ekspor yang telah dirender secara opsional."}],["$","meta","20",{"property":"og:url","content":"https://wayin.ai/id/api-docs/ai-clipping/"}],["$","meta","21",{"property":"og:site_name","content":"WayinVideo"}],["$","meta","22",{"property":"og:locale","content":"id_ID"}],["$","meta","23",{"property":"og:image","content":"https://tools-cms.s3.us-west-2.amazonaws.com/nc/uploads/noco/p3xs6bxbztpq73w/m6f7y5vguwy5li1/ck1k1rwzzf6ra36/og-image-en_vv4Hu.webp"}],["$","meta","24",{"property":"og:locale:alternate","content":"en_US"}],["$","meta","25",{"property":"og:locale:alternate","content":"zh_TW"}],["$","meta","26",{"property":"og:locale:alternate","content":"pt_PT"}],["$","meta","27",{"property":"og:locale:alternate","content":"es_ES"}],["$","meta","28",{"property":"og:locale:alternate","content":"fr_FR"}],["$","meta","29",{"property":"og:locale:alternate","content":"de_DE"}],["$","meta","30",{"property":"og:locale:alternate","content":"ja_JP"}],["$","meta","31",{"property":"og:type","content":"article"}],["$","meta","32",{"name":"twitter:card","content":"summary_large_image"}],["$","meta","33",{"name":"twitter:title","content":"AI Clipping API – Ubah Video Panjang Menjadi Klip Pendek｜WayinVideo API"}],["$","meta","34",{"name":"twitter:description","content":"Kirimkan video dengan panjang berapa pun dan terima klip viral bertenaga AI yang diurutkan berdasarkan potensi viral, masing-masing dengan stempel waktu mulai/akhir, judul, deskripsi, tagar, dan ekspor yang telah dirender secara opsional."}],["$","meta","35",{"name":"twitter:image","content":"https://tools-cms.s3.us-west-2.amazonaws.com/nc/uploads/noco/p3xs6bxbztpq73w/m6f7y5vguwy5li1/ck1k1rwzzf6ra36/og-image-en_vv4Hu.webp"}],"$L3d","$L3e"],"error":null,"digest":"$undefined"}
