# Panduan Login Google OAuth 2.0 - KlipAja / ClipForge AI

Dokumen ini menjelaskan cara mengaktifkan **Login dengan Google** di project AICLIP agar user bisa masuk hanya dengan akun Google (tanpa password).

---

## 1. Ringkasan Alur

```
[User klik "Lanjutkan dengan Google" di /login]
      |
      v
Frontend fetch GET /api/auth/google/url  -->  Backend bangun URL:
https://accounts.google.com/o/oauth2/v2/auth?client_id=...&redirect_uri=https://yourdomain.com/api/auth/callback/google&scope=openid email profile
      |
      v
User pilih akun di Google, Google redirect ke:
https://yourdomain.com/api/auth/callback/google?code=XXXX&state=...
(Rewrites Next.js -> Fastify /api/auth/callback/google)
      |
      v
Backend tukar code -> POST https://oauth2.googleapis.com/token
Dapat id_token + access_token, verifikasi via https://oauth2.googleapis.com/tokeninfo
      |
      v
Backend upsert user (cari by googleId atau email), buat subscription FREE 25 kredit jika baru, sign JWT
Redirect ke: https://yourdomain.com/auth/callback?token=JWT&user={...}
      |
      v
Frontend /auth/callback simpan token ke localStorage (clipforge_token) dan redirect ke /dashboard
```

Alternatif flow **One Tap GIS** juga didukung:
`POST /api/auth/google` dengan `{idToken}` diverifikasi via `tokeninfo` lalu upsert. Cocok untuk popup One Tap jika diaktifkan.

---

## 2. Setup Google Cloud Console (WAJIB)

### 2.1 Buat Project
1. Buka https://console.cloud.google.com/
2. Buat Project baru atau pilih existing
3. Catat Project ID

### 2.2 Konfig OAuth Consent Screen
1. Menu **APIs & Services > OAuth consent screen**
2. User Type: **External** > Create
3. Isi:
   - App name: `KlipAja.id` (atau ClipForge AI)
   - User support email: email kamu
   - Developer contact: email kamu
   - Authorized domains: `forgeai.web.id` (jika production) + `localhost` untuk dev
4. Scopes: tambahkan `.../auth/userinfo.email` dan `.../auth/userinfo.profile` (default `openid email profile` sudah cukup)
5. Test users: tambahkan email pribadi untuk testing sebelum publish

### 2.3 Buat OAuth 2.0 Client ID
1. Menu **APIs & Services > Credentials > Create Credentials > OAuth client ID**
2. Application type: **Web application**
3. Name: `KlipAja Web`
4. **Authorized JavaScript origins**:
   ```
   http://localhost:3000
   https://forgeai.web.id
   https://yourdomain.com
   ```
5. **Authorized redirect URIs** (HARUS PERSIS sama dengan `NEXT_PUBLIC_APP_URL + /api/auth/callback/google`):
   ```
   http://localhost:3000/api/auth/callback/google
   https://forgeai.web.id/api/auth/callback/google
   ```
   > Penting: Jangan lupa `/api/auth/callback/google` - bukan `/auth/callback` saja. Redirect URI web callback (`/auth/callback`) adalah internal, yang didaftarkan ke Google adalah **API callback**.

6. Create -> salin **Client ID** dan **Client Secret**

---

## 3. Konfigurasi Environment

### 3.1 File `.env` (root project)
Salin dari `.env.example`:

```env
NEXT_PUBLIC_APP_URL=http://localhost:3000   # lokal, atau https://forgeai.web.id di prod
APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3001
API_URL=http://localhost:3001

DATABASE_URL="file:./packages/dev.db"
AUTH_SECRET="ganti-dengan-string-random-32-char-minimal"

# GOOGLE OAUTH - ISI DARI CONSOLE
GOOGLE_CLIENT_ID="205226226089-xxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxx"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="205226226089-xxxx.apps.googleusercontent.com"
```

> `NEXT_PUBLIC_*` harus diawali `NEXT_PUBLIC_` agar terbaca di browser.
> `GOOGLE_CLIENT_SECRET` HANYA di server (jangan pakai prefix NEXT_PUBLIC).

### 3.2 Production (Vercel / forgeai.web.id)
Set di dashboard hosting (Vercel Environment Variables):
```
NEXT_PUBLIC_APP_URL=https://forgeai.web.id
APP_URL=https://forgeai.web.id
NEXT_PUBLIC_API_URL=https://forgeai.web.id   # jika API via rewrites, bisa pakai domain sama
API_URL=https://forgeai.web.id

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...  # sama dengan GOOGLE_CLIENT_ID
AUTH_SECRET=...  # generate via `openssl rand -base64 32`
CORS_ORIGIN=https://forgeai.web.id
```

Pastikan `Authorized redirect URIs` di Google Console sudah berisi `https://forgeai.web.id/api/auth/callback/google`.

---

## 4. File yang Telah Diperbaiki

### Backend `apps/api/src/auth.ts`
- **POST /api/auth/google**: sekarang verifikasi `idToken` via `https://oauth2.googleapis.com/tokeninfo` (validasi `aud`, `iss`, `exp`). Fallback unsafe decode hanya di `NODE_ENV !== production` atau jika `ALLOW_INSECURE_GOOGLE_AUTH=true`.
- **GET /api/auth/google/url**: generate URL dengan `access_type=offline`, `prompt=select_account`, `state` random, `include_granted_scopes=true`. Validasi `GOOGLE_CLIENT_ID` kosong -> 500 error jelas.
- **GET /api/auth/callback/google**: tukar `code` -> token, verifikasi `id_token` via tokeninfo, fallback ke `userinfo` via `access_token`, upsert user (cari dulu by `googleId`, lalu `email`), simpan `googleId`+`image`, buat `subscription FREE 25` jika baru, kirim welcome email async, sign JWT, redirect ke `/auth/callback` dengan token.
- Helper `upsertGoogleUser`: handle link akun existing, sync email jika Google ID ditemukan, patch `image`/`name` jika kosong.

### Frontend
- `apps/web/src/app/login/page.tsx`: pakai `Suspense` untuk `useSearchParams`, fetch `getApiUrl('/api/auth/google/url')`, fallback ke client-side URL jika backend gagal, show error `?error=` dari redirect, handle `GOOGLE_CLIENT_ID` kosong dengan warning kuning, tombol loading state.
- `apps/web/src/app/auth/callback/page.tsx`: handle `token+user` dari backend redirect, simpan via `setAuthSession`, redirect ke `/dashboard`, tampilkan error jika `?error=` + link kembali ke login.
- `apps/web/src/lib/auth.ts`: tambah `getStoredToken`, `getAuthHeader`, `isAuthenticated`.
- `apps/web/src/app/dashboard/layout.tsx`: ganti refresh hack `POST /api/auth/google {email}` menjadi `GET /api/auth/me` dengan `Authorization: Bearer <token>`, fetch credits via `getApiUrl`, guard redirect jika tidak ada session.
- `apps/web/next.config.ts`: rewrites sekarang dinamis `NEXT_PUBLIC_API_URL || API_URL || http://127.0.0.1:3001` (strip `/api` suffix) agar jalan di lokal maupun prod.
- `.env.example` & `.env`: dokumentasi lengkap Google vars + `APP_URL`/`NEXT_PUBLIC_APP_URL`.

---

## 5. Cara Menjalankan Lokal

```bash
# 1. Set env
cp .env.example .env
# isi GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, NEXT_PUBLIC_GOOGLE_CLIENT_ID
# Pastikan:
# NEXT_PUBLIC_APP_URL=http://localhost:3000
# NEXT_PUBLIC_API_URL=http://localhost:3001

# 2. DB migrate
pnpm --filter @clipforge/database db:push

# 3. Jalan monorepo
pnpm dev
# Web: http://localhost:3000
# API: http://localhost:3001
# Worker: :3002

# 4. Test login
# Buka http://localhost:3000/login -> klik "Lanjutkan dengan Google"
# Pilih akun -> redirect -> /auth/callback -> /dashboard

# 5. Cek user DB
npx prisma studio --schema=packages/database/prisma/schema.prisma
# atau via sqlite:
# python -c "import sqlite3; ..."

# 6. Test API langsung
curl http://localhost:3001/api/auth/google/url
# harus return {"url":"https://accounts.google.com/..."}
```

### Jika masih `500 GOOGLE_CLIENT_ID belum dikonfigurasi`
- Pastikan `GOOGLE_CLIENT_ID` & `NEXT_PUBLIC_GOOGLE_CLIENT_ID` terisi di `.env` root
- Restart `pnpm dev` (Next.js perlu restart untuk NEXT_PUBLIC)
- Cek `http://localhost:3001/api/auth/google/url` manual

### Jika redirect error `redirect_uri_mismatch`
- Error ini dari Google, artinya `redirect_uri` yang dikirim backend tidak ada di **Authorized redirect URIs** di Console.
- Samakan persis: cek `getGoogleConfig()` -> `redirectUri = APP_URL + /api/auth/callback/google`
- Untuk localhost, harus `http://localhost:3000/api/auth/callback/google` (bukan `127.0.0.1`)
- Update di Console, tunggu 5 menit, coba lagi

### Jika `Gagal menukar kode` / `GOOGLE_CLIENT_SECRET belum dikonfigurasi`
- Pastikan `GOOGLE_CLIENT_SECRET` terisi di `.env` (server only, tanpa NEXT_PUBLIC)
- Restart API (`pnpm --filter clipforge-api dev`)

---

## 6. Keamanan

- `idToken` diverifikasi server-side via Google `tokeninfo` (cek `aud` == `clientId`, `iss` == `accounts.google.com`, `exp` valid)
- `code` ditukar server-side dengan `client_secret` (tidak expose secret ke browser)
- JWT app (`clipforge_token`) expiry 7 hari via `fastify/jwt`
- Password user Google `null` (login cuma via Google), tetapi user bisa tetap register email+password jika ingin
- `googleId` unique di DB, mencegah duplicate linking
- `state` random untuk CSRF (MVP, belum store di cookie - bisa ditingkatkan)
- CORS `*` di dev, set `CORS_ORIGIN=https://yourdomain.com` di prod

### Tingkatkan lagi (opsional):
- Simpan `state` di httpOnly cookie dan validasi di callback
- Tambah `google-auth-library` (JWT verify via JWKs) sebagai pengganti fetch tokeninfo untuk mengurangi latency
- Simpan `refresh_token` jika butuh offline access (saat ini `access_type=offline` sudah minta, tapi belum disimpan)

---

## 7. Alur Data di Database

```prisma
model User {
  id       String @id @default(cuid())
  email    String @unique
  password String? // null untuk Google user
  name     String?
  image    String? // foto profil Google
  googleId String? @unique // sub dari Google
  role     String @default("USER")
}

model Subscription {
  userId String
  plan   String // FREE
  status ACTIVE
  credits Int @default(25)
}
```

Flow:
- User baru Google -> `prisma.user.create({email, name, image, googleId})` + `subscription FREE 25` + welcome email
- User existing email sama tapi `googleId` null -> patch `googleId`+`image`
- User existing via googleId -> langsung login, update `image` jika kosong

---

## 8. Testing

```bash
pnpm --filter clipforge-api test
# 17 tests passed

pnpm --filter web build
# Compiled successfully

# Manual
# - buka /login, klik Google, cek redirect
# - cek localStorage clipforge_token & clipforge_user ada
# - cek /api/auth/me dengan header Authorization: Bearer <token> -> 200
# - logout -> clear storage -> redirect /login
```

---

## 9. Troubleshooting Cepat

| Error | Penyebab | Fix |
|-------|----------|-----|
| `GOOGLE_CLIENT_ID belum dikonfigurasi` | Env kosong | Isi `.env` + restart |
| `redirect_uri_mismatch` | URI di Google Console tidak cocok | Samakan dengan `NEXT_PUBLIC_APP_URL + /api/auth/callback/google` |
| `Gagal menukar kode` | `GOOGLE_CLIENT_SECRET` salah | Cek Console -> Credentials |
| `Token Google tidak valid` | `idToken` expired / aud salah | Pastikan `NEXT_PUBLIC_GOOGLE_CLIENT_ID` sama dengan server `GOOGLE_CLIENT_ID` |
| `The column User.googleId does not exist` | DB belum migrate | `pnpm --filter @clipforge/database db:push` |
| `Rate limit exceeded` di /api/auth/google/url | Terlalu sering klik | Tunggu 1 menit |
| CORS error | `CORS_ORIGIN` salah | Set `*` untuk dev, domain prod untuk production |

---

## 10. Checklist Production

- [ ] Google Console: `Authorized redirect URIs` berisi `https://yourdomain.com/api/auth/callback/google`
- [ ] Env prod terisi `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`, `NEXT_PUBLIC_APP_URL`, `AUTH_SECRET` (random)
- [ ] `DATABASE_URL` pointing ke DB prod (Postgres jika Vercel/Neon, bukan SQLite file)
- [ ] `pnpm --filter @clipforge/database db:push` di prod (atau `prisma migrate deploy`)
- [ ] `pnpm --filter web build` sukses tanpa error Suspense
- [ ] Test login di prod incognito -> redirect ok -> dashboard -> localStorage ada -> `/api/auth/me` 200
- [ ] Cek welcome email terkirim (jika `sendWelcomeEmail` dikonfig)
- [ ] Set `DEMO_MODE=false`, `ALLOW_INSECURE_GOOGLE_AUTH` tidak set di prod

---

Selamat! Sekarang project sudah support **Login dengan Google** yang aman dan siap pakai di lokal maupun production `forgeai.web.id`.

Butuh bantuan tambahan? Hubungi maintainer atau buka issue di repo.
