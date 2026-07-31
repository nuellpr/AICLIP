import Link from "next/link";
import { ArrowRight, Video, Scissors, Zap, Share2, Sparkles, CheckCircle2, Play, Star, Flame, Trophy } from "lucide-react";
import { TutorialVideoPlayer } from "@/components/TutorialVideoPlayer";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#060609] text-white selection:bg-cyan-500 selection:text-black relative overflow-hidden">
      {/* Background Mesh Lighting */}
      <div className="mesh-bg"></div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#060609]/70 backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/home" className="flex items-center gap-3">
            <img src="/logo.png" alt="ClipForge AI" className="h-12 w-auto object-contain drop-shadow-[0_0_15px_rgba(34,211,238,0.4)]" />
          </Link>

          <nav className="hidden gap-8 md:flex items-center">
            <Link href="#fitur" className="text-sm font-medium text-gray-300 hover:text-cyan-400 transition-colors">Fitur</Link>
            <Link href="#cara-kerja" className="text-sm font-medium text-gray-300 hover:text-cyan-400 transition-colors">Cara Kerja</Link>
            <Link href="#harga" className="text-sm font-medium text-gray-300 hover:text-cyan-400 transition-colors">Harga</Link>
          </nav>

          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm font-semibold text-gray-300 hover:text-white px-3 py-2 transition-colors">
              Masuk
            </Link>
            <Link href="/dashboard/new" className="gradient-border group inline-block">
              <div className="flex items-center gap-2 rounded-lg bg-black px-6 py-2.5 text-sm font-bold text-white transition-all hover:bg-black/40">
                <Sparkles className="h-4 w-4 text-purple-400 group-hover:text-cyan-400 transition-colors" />
                Coba Gratis Now
              </div>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-20 pb-28 lg:pt-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            {/* Top Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-2 text-xs font-bold text-cyan-400 mb-8 backdrop-blur-md glow-cyan">
              <Sparkles className="h-4 w-4 animate-spin text-purple-400" />
              <span>Teknologi Auto-Clipping AI Gen-Z v2.0</span>
            </div>

            <h1 className="mx-auto max-w-5xl text-5xl font-black tracking-tight sm:text-7xl lg:text-8xl leading-none">
              Ubah Video Panjang Menjadi <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-500 drop-shadow-[0_0_35px_rgba(6,182,212,0.4)]">
                Puluhan Klip Viral
              </span>
            </h1>

            <p className="mx-auto mt-8 max-w-3xl text-lg sm:text-xl text-gray-400 font-normal leading-relaxed">
              Otomatiskan pemotongan podcast, webinar, dan video YouTube Anda. AI kami memilih momen paling menarik, menerapkan subtitle dinamis gaya Hormozi, dan meng-crop format 9:16 siap posting di TikTok, Reels, dan Shorts.
            </p>

            <div className="mt-12 flex flex-col items-center justify-center gap-5 sm:flex-row">
              <Link href="/dashboard/new" className="group flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-600 px-9 py-5 text-lg font-black text-black hover:opacity-95 transition-all shadow-[0_0_30px_rgba(6,182,212,0.5)] hover:scale-105">
                Mulai Buat Klip Gratis
                <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            {/* Stats Showcase Bar */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto border-t border-b border-white/10 py-6 text-center">
              <div>
                <h4 className="text-3xl font-black text-white">10x</h4>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Lebih Cepat</p>
              </div>
              <div>
                <h4 className="text-3xl font-black text-cyan-400">99.4%</h4>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Akurasi Subtitle</p>
              </div>
              <div>
                <h4 className="text-3xl font-black text-purple-400">5+</h4>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Preset Subtitle</p>
              </div>
              <div>
                <h4 className="text-3xl font-black text-pink-400">9:16</h4>
                <p className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Auto Reframe</p>
              </div>
            </div>

            {/* Dashboard Interactive Video Tutorial Showcase */}
            <TutorialVideoPlayer />
          </div>
        </section>

        {/* Workflow Section */}
        <section id="cara-kerja" className="py-24 relative bg-black/40 border-t border-white/5">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl">Cara Kerja 3 Langkah Mudah</h2>
              <p className="mt-4 text-lg text-gray-400">Dari URL YouTube biasa menjadi deretan klip pendek berkualitas tinggi tanpa aplikasi editing yang rumit.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 relative">
              {[
                { step: "01", title: "Tempelkan Link Video", desc: "Masukkan URL video YouTube atau podcast Anda ke kolom generator." },
                { step: "02", title: "AI Deteksi Golden Moments", desc: "Sistem mendeteksi cuplikan paling seru, memotong durasi, dan menyesuaikan layout." },
                { step: "03", title: "Render & Unduh Klip", desc: "Pilih gaya subtitle animasi kesukaan Anda dan unduh video MP4 rasio 9:16 siap rilis." }
              ].map((item, idx) => (
                <div key={idx} className="glass-card rounded-2xl p-8 relative overflow-hidden">
                  <div className="text-6xl font-black text-white/10 mb-4">{item.step}</div>
                  <h3 className="text-2xl font-bold text-white mb-3">{item.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section id="fitur" className="py-28 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-20">
              <h2 className="text-4xl font-black tracking-tight sm:text-5xl">Fitur Didesain Untuk Kreator Top</h2>
              <p className="mt-4 text-lg text-gray-400">Hemat waktu editing ratusan jam setiap minggunya.</p>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                { icon: Scissors, color: "text-cyan-400", title: "AI Auto-Clipping", desc: "Algoritma kecerdasan buatan mendeteksi emosi, hook perkataan, dan klimaks percakapan." },
                { icon: Zap, color: "text-purple-400", title: "Karaoke Subtitle Animasi", desc: "Subtitle bergaya Alex Hormozi dengan efek pop, grow, bounce, dan per kata yang menyala." },
                { icon: Share2, color: "text-pink-400", title: "Beragam Mode Layout 9:16", desc: "Fit + Blur, Crop 1:1, Split Screen, Gameplay, hingga Fokus Wajah Otomatis." },
                { icon: Flame, color: "text-amber-400", title: "Skor Momen Viral", desc: "Setiap klip dilengkapi perkiraan skor potensi viral (80-100) dan alasan analitis." },
                { icon: Trophy, color: "text-emerald-400", title: "Dukungan Bahasa Indonesia", desc: "Dukungan transkripsi Bahasa Indonesia yang akurat dan alami untuk audiens lokal." },
                { icon: Star, color: "text-blue-400", title: "Multi Model AI Provider", desc: "Bisa terhubung dengan Google Gemini 2.0 Flash, OpenAI GPT-4o, Groq, atau Custom LLM." }
              ].map((f, i) => (
                <div key={i} className="glass-card rounded-3xl p-8 hover:border-cyan-500/40 transition-all">
                  <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 border border-white/10 ${f.color}`}>
                    <f.icon className="h-7 w-7" />
                  </div>
                  <h3 className="mb-3 text-2xl font-bold text-white">{f.title}</h3>
                  <p className="text-gray-400 leading-relaxed text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="harga" className="py-24 relative bg-black/50 border-t border-white/10">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <span className="text-xs font-extrabold uppercase tracking-widest text-cyan-400 bg-cyan-500/10 px-4 py-1.5 rounded-full border border-cyan-500/20">
                Pilihan Paket Hemat
              </span>
              <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                Harga Langganan Terjangkau
              </h2>
              <p className="mt-4 text-lg text-gray-400">
                Pilih paket langganan yang sesuai dengan kebutuhan konten harian Anda.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
              {/* Paket Standar (Aktif) */}
              <div className="relative glass-card rounded-3xl p-8 border-2 border-cyan-500/50 shadow-[0_0_40px_rgba(6,182,212,0.2)] flex flex-col justify-between group hover:border-cyan-400 transition-all">
                <div className="absolute -top-4 right-8 bg-gradient-to-r from-cyan-400 to-blue-500 text-black font-extrabold text-xs px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                  Rekomendasi Utama
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white mb-2">Paket Standar</h3>
                  <p className="text-sm text-gray-400 mb-6">Solusi ideal untuk kreator konten harian & pemula.</p>

                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                      Rp 30.000
                    </span>
                    <span className="text-sm font-semibold text-gray-400">/ bulan</span>
                  </div>

                  <ul className="space-y-4 text-sm text-gray-300 mb-8">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0" />
                      <span>Pemotongan AI Otomatis (Auto-Clipping)</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0" />
                      <span>10+ Preset Subtitle Animasi Kata</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0" />
                      <span>Ekspor Video Resolusi 1080x1920 (9:16)</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0" />
                      <span>Fitur Restyle Ganti Subtitle Instan</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-cyan-400 shrink-0" />
                      <span>Tanpa Watermark ClipForge</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/dashboard/new"
                  className="w-full text-center py-4 rounded-xl font-extrabold bg-gradient-to-r from-cyan-400 via-cyan-500 to-blue-600 text-black hover:opacity-90 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  Pilih Paket Standar
                </Link>
              </div>

              {/* Paket Pro (Coming Soon) */}
              <div className="relative glass-card rounded-3xl p-8 border border-white/10 opacity-85 flex flex-col justify-between group hover:border-purple-500/40 transition-all">
                <div className="absolute -top-4 right-8 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-400 text-black font-extrabold text-xs px-4 py-1.5 rounded-full uppercase tracking-wider shadow-md animate-pulse">
                  COMING SOON
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-2xl font-black text-white">Paket Pro</h3>
                    <span className="text-[10px] font-extrabold text-purple-400 bg-purple-500/20 px-2.5 py-0.5 rounded-full border border-purple-500/30 uppercase">
                      Segera Hadir
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 mb-6">Untuk agensi, studio, dan kreator profesional ber-skala besar.</p>

                  <div className="flex items-baseline gap-1 mb-8">
                    <span className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-amber-300">
                      Rp 50.000
                    </span>
                    <span className="text-sm font-semibold text-gray-400">/ bulan</span>
                  </div>

                  <ul className="space-y-4 text-sm text-gray-400 mb-8">
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-purple-400 shrink-0" />
                      <span>Semua Fitur Paket Standar</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-purple-400 shrink-0" />
                      <span>Kualitas Render 4K 60FPS</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-purple-400 shrink-0" />
                      <span>Custom Subtitle Template Builder</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-purple-400 shrink-0" />
                      <span>Prioritas Rendering Antrean Super Cepat</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle2 className="h-5 w-5 text-purple-400 shrink-0" />
                      <span>Dukungan Multi-User Team Work</span>
                    </li>
                  </ul>
                </div>

                <button
                  disabled
                  className="w-full text-center py-4 rounded-xl font-extrabold bg-white/10 text-gray-400 cursor-not-allowed border border-white/10"
                >
                  Segera Hadir (Coming Soon)
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-20 relative">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="glass-panel rounded-3xl p-12 text-center relative overflow-hidden border border-cyan-500/30">
              <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/20 rounded-full blur-[100px] pointer-events-none"></div>
              <h2 className="text-4xl font-black text-white sm:text-5xl">Siap Mengubah Konten Anda Menjadi Viral?</h2>
              <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">Coba sekarang gratis tanpa perlu kartu kredit.</p>
              <div className="mt-10">
                <Link href="/dashboard/new" className="inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-600 px-9 py-5 text-lg font-black text-black hover:opacity-90 transition-all shadow-[0_0_30px_rgba(6,182,212,0.5)]">
                  Mulai Buat Proyek Pertama
                  <ArrowRight className="h-6 w-6" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 bg-[#040406] py-12 text-center text-sm text-gray-500">
        <p>© 2026 ClipForge AI. All rights reserved.</p>
      </footer>
    </div>
  );
}
