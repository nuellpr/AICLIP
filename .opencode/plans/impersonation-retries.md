# Plan: Impersonation (curl_cffi) + Extractor Retries

## Tujuan
1. Aktifkan TLS impersonation supaya yt-dlp meniru browser Chrome asli → lebih tahan bot-check YouTube.
2. Tambah retry pada ekstraksi yt-dlp → mengurangi kegagalan transien (throttle/jaringan).

## Temuan (verified di VPS)
- yt-dlp VPS = **zipapp Python** (`/usr/bin/env python3`), bukan binary PyInstaller.
  → `pip3 install curl_cffi` akan otomatis terpakai oleh yt-dlp.
- Python 3.12.3 + pip 24.0 tersedia. `curl_cffi` BELUM terpasang.
- Warning saat tes: "extractor specified to use impersonation... no impersonate target is available"
  → web_embedded client memang minta impersonation; hanya kurang curl_cffi.
- Panggilan yt-dlp yang perlu diubah: `apps/worker/src/index.ts:131` dan `:308`.
- `apps/api/src/routes.ts:499` juga memanggil youtubedl (audio), tambah retry untuk konsistensi.

## Langkah

### 1. VPS: install curl_cffi
```
pip3 install -U curl_cffi
```
Verifikasi: `python3 -c "import curl_cffi; print(curl_cffi.__version__)"`

### 2. Kode: impersonation + retries (worker)
File `apps/worker/src/index.ts`, kedua blok options (baris ~107-120 dan ~292-303):
- Tambah `impersonate: 'chrome'` → yt-dlp pakai curl_cffi (explicit, lebih robust daripada rely default).
- Tambah `extractorRetries: 3` → `--extractor-retries 3` (retry fetch format/subtitle).
- Tambah `retries: 3` → `--retries 3` (retry download segment).

Catatan ponytail: nilai 3 dipakai untuk keduanya; hanya komentar singkat ditambahkan, tidak ada abstraksi.

### 3. Kode: retries (api, opsional)
File `apps/api/src/routes.ts` blok options (~488-495): tambah `extractorRetries: 3`.
(Path fallback audio download jarang dipakai, tapi retry murah.)

### 4. Build + deploy
- Local: `pnpm build` / typecheck worker & api.
- Commit + push.
- VPS: `git pull`, `pm2 restart all`.

### 5. Verifikasi
- VPS: tes yt-dlp manual dengan `--impersonate chrome` pada video uji DwTmRFyQ53E:
  - Subtitle: `--skip-download --write-auto-subs --sub-langs id` → harus tetap terdownload.
  - Segment: `--download-sections "*10-15" -f "137+bestaudio[ext=m4a]"` → 1080p tetap jalan.
- Pastikan warning "no impersonate target available" HILANG.
- Cek log pm2 worker tidak ada error baru.

## Risiko / Catatan
- Impersonation menambah overhead kecil per request; tidak signifikan.
- curl_cffi perlu versi Python-compatible (3.12 → wheel tersedia).
- Tidak menyentuh bun 1.4.0 (opsional, terpisah).
- Tidak menyentuh rate limiting (di luar scope).
