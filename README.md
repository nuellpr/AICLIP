# ClipForge AI

Aplikasi SaaS AI video clipping yang mengubah video panjang menjadi klip vertikal untuk TikTok, Shorts, dan Reels.

## Fitur
- 🎯 **AI Auto-Clipping**: AI menganalisis transkrip dan memilih momen paling menarik secara otomatis.
- ⚡ **Real-time Pipeline**: Proses background job dengan real-time progress update.
- 🎨 **Monorepo**: Arsitektur bersih dengan Next.js, Fastify, dan BullMQ.
- 🚀 **Demo Mode**: Dapat dijalankan tanpa API Key OpenAI asli untuk testing UI/UX.

## Teknologi
- **Frontend**: Next.js (App Router), Tailwind CSS v4, Lucide Icons
- **Backend API**: Fastify, Zod
- **Worker**: Node.js, BullMQ, Redis
- **Database**: PostgreSQL, Prisma
- **Monorepo Tooling**: Turborepo, pnpm

## Persyaratan Sistem
- Node.js >= 18
- pnpm >= 9
- Docker & Docker Compose (untuk PostgreSQL dan Redis)

## Cara Instalasi
1. Clone repositori ini.
2. Salin file `.env.example` menjadi `.env`.
   ```bash
   cp .env.example .env
   ```
3. Instal dependencies menggunakan pnpm:
   ```bash
   pnpm install --ignore-scripts
   ```

## Cara Menjalankan (Tanpa Docker)
Aplikasi ini sudah dikonfigurasi menggunakan **SQLite** dan antrean internal, sehingga tidak memerlukan instalasi Docker, PostgreSQL, atau Redis.

Migrasi Database:
```bash
cd packages/database
npx prisma generate
npx prisma db push
```

Jalankan seluruh aplikasi (Web, API, Worker):
```bash
pnpm dev
```
- **Web App**: http://localhost:3000
- **API**: http://localhost:3001
- **Worker**: Berjalan di background (lihat console).

## Batasan MVP
Versi ini merupakan implementasi MVP end-to-end dengan konfigurasi **Demo Mode**:
- Video belum benar-benar di-crop/trim dengan FFmpeg di production (hanya mock proses dengan delay).
- Analisis AI (OpenAI) di-mock untuk menghasilkan 3 klip otomatis demi keamanan testing tanpa kredensial.
- Otentikasi sementara menggunakan user demo statis (`demo@clipforge.ai`).

## Struktur Folder
- `apps/web`: Aplikasi Frontend (Next.js)
- `apps/api`: REST API (Fastify)
- `apps/worker`: Job queue processor (BullMQ)
- `packages/database`: Prisma schema & client
- `packages/shared`: Shared types, schemas & constants

## Rencana Pengembangan Berikutnya
- Integrasi otentikasi penuh dengan NextAuth/Supabase.
- Penggunaan library `fluent-ffmpeg` di `apps/worker` untuk trimming video aktual.
- Integrasi Stripe/Midtrans untuk billing & sistem kredit paket berlangganan.
