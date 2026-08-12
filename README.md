# AICLIP (IndoFinity Tools Streaming Indonesia) 🇮🇩

Aplikasi SaaS AI Video Clipper otomatis untuk mengubah video panjang YouTube (podcast, wawancara, vlog) menjadi klip pendek viral vertikal (9:16) untuk TikTok, Instagram Reels, dan YouTube Shorts.

## ✨ Fitur Utama

- 🎯 **AI Golden Moment Finder**: Otomatis menganalisis transkrip VTT & audio menggunakan LLM (OpenAI, Gemini, Groq, Anthropic) untuk mendeteksi klip paling berpotensi viral.
- 🪝 **AI Hook Intro Generator**: Membuat intro video 3–5 detik otomatis dengan animasi teks hook dan suara AI TTS Bahasa Indonesia (`edge-tts` / `gtts`).
- 🎯 **Active Speaker Tracking (MediaPipe + OpenCV)**: Melacak gerakan bibir (lip gap variance) secara otomatis untuk mengarahkan crop vertikal (9:16) tepat ke pembicara yang sedang aktif pada podcast/interview multi-orang.
- 🎙️ **Karaoke Animated Captions**: Subtitle word-by-word ala CapCut/Shorts dengan 13+ gaya animasi (karaoke highlight, pop, grow, bounce, typewriter, box highlight) dan sync presisi tinggi via Whisper (`base` model).
- ⚡ **GPU Hardware Acceleration**: Auto-detect enkoder GPU (**NVIDIA NVENC**, **AMD AMF**, **Intel QSV**, **Apple VideoToolbox**) untuk rendering video hingga 5–10x lebih cepat.
- 🖼️ **Watermark & Logo Support**: Kustomisasi logo watermark (posisi, ukuran, dan opacity).
- 📱 **Multi-Layout Re-framing**: Pilihan layout `fit_blur`, `crop_blur`, `split`, `gameplay`, dan `face` (active speaker).
- 🖥️ **Full Web Dashboard**: Tampilan UI modern (Next.js 16 App Router, Tailwind CSS) lengkap dengan manajemen proyek, autentikasi email & Google, dan library klip.

## 🛠️ Arsitektur & Teknologi

- **Frontend**: Next.js (App Router), Tailwind CSS, Lucide Icons
- **Backend API**: Fastify, Zod
- **Worker Engine**: Node.js, BullMQ, Redis, FFmpeg, Python (MediaPipe, OpenCV, Whisper, edge-tts)
- **Database**: SQLite / PostgreSQL via Prisma
- **Monorepo**: Turborepo, pnpm

## 🚀 Cara Menjalankan

### Persyaratan System
- Node.js >= 18
- pnpm >= 9
- Python 3.10+ (dengan `mediapipe`, `opencv-python`, `edge-tts`, `openai-whisper`)
- FFmpeg

### Inisialisasi Database & App
```bash
# Migrasi Database
cd packages/database
npx prisma generate
npx prisma db push

# Jalankan Monorepo (Web + API + Worker)
cd ../..
pnpm dev
```
- **Web Dashboard**: http://localhost:3000
- **API Server**: http://localhost:3001
- **Worker**: Berjalan di background (Port 3002)

## 📁 Struktur Folder Monorepo

- `apps/web`: Web dashboard & UI Next.js
- `apps/api`: REST API Fastify & Autentikasi
- `apps/worker`: Video render engine, Whisper transcriber, FFmpeg & MediaPipe pipeline
- `packages/database`: Prisma schema & client
- `packages/shared`: Shared types, subtitle parser & helper utilities
