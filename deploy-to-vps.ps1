# Deploy ClipForge OAuth + Branding fix ke VPS 103.253.244.248
# Jalankan di PowerShell lokal: C:\Users\Nuel\Downloads\clip\AICLIP> powershell -ExecutionPolicy Bypass -File deploy-to-vps.ps1

$VPS="root@103.253.244.248"
$PATCH="deploy-clipforge-oauth.patch"
$REMOTE_TMP="/tmp/$PATCH"

Write-Host "1. Upload patch ke VPS..." -ForegroundColor Cyan
scp -o ServerAliveInterval=30 $PATCH "${VPS}:$REMOTE_TMP"
if ($LASTEXITCODE -ne 0) { Write-Host "SCP gagal, cek koneksi SSH" -ForegroundColor Red; exit 1 }

Write-Host "2. Patch sudah di $REMOTE_TMP di VPS. Sekarang buka terminal SSH (root@nuel) dan jalankan:" -ForegroundColor Green
Write-Host @"
# --- JALANKAN DI VPS (root@nuel:~#) ---
# cari folder project
pwd; ls -la
find ~ /opt /var/www -maxdepth 4 -name "package.json" 2>/dev/null | grep -i clip
# contoh jika di /root/AICLIP:
cd ~/AICLIP || cd /root/AICLIP || cd /var/www/AICLIP

# backup
cp -r apps/web/src/app/login/page.tsx /tmp/login.bak
cp -r apps/api/src/auth.ts /tmp/auth.bak

# apply patch
git status
git apply $REMOTE_TMP
# jika conflict karena file .env.example LF, coba:
# git apply --reject $REMOTE_TMP
# atau: patch -p1 < $REMOTE_TMP

git diff --stat

# update env di VPS (WAJIB) - edit manual
nano .env
# pastikan ada:
# GOOGLE_CLIENT_ID="xxxx.apps.googleusercontent.com"
# GOOGLE_CLIENT_SECRET="GOCSPX-..."
# NEXT_PUBLIC_GOOGLE_CLIENT_ID="sama dengan atas"
# NEXT_PUBLIC_APP_URL=https://forgeai.web.id
# NEXT_PUBLIC_API_URL=https://forgeai.web.id
# AUTH_SECRET="random 32 char, generate: openssl rand -base64 32"
# DATABASE_URL="file:./packages/dev.db" atau sesuai prod

# migrasi & build
pnpm --filter @clipforge/database db:push
pnpm --filter clipforge-api build
pnpm --filter web build
# atau pnpm build

# restart
pm2 restart all || pm2 list
# atau jika pakai docker:
# docker compose restart
# atau systemd:
# systemctl restart clipforge

# cek log
pm2 logs --lines 50
curl -I https://forgeai.web.id/login
curl http://127.0.0.1:3001/api/auth/google/url | head

"@

Write-Host "Selesai upload. Lanjut paste perintah di atas di terminal SSH kanan." -ForegroundColor Yellow
