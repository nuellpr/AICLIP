import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '@clipforge/database';
import { sendWelcomeEmail } from './services/emailService';
import { authenticate } from './guards';

const BCRYPT_ROUNDS = 10;
const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_ROUNDS);

const MAX_FAILED_LOGINS = 10;
const LOCK_MS = 15 * 60 * 1000;
const loginAttempts = new Map<string, { count: number; until: number }>();

function isLoginLocked(key: string): boolean {
  const entry = loginAttempts.get(key);
  if (!entry) return false;
  return entry.until > Date.now();
}

function recordFailedLogin(key: string) {
  const now = Date.now();
  let entry = loginAttempts.get(key);
  if (!entry || (entry.until > 0 && entry.until <= now)) {
    entry = { count: 0, until: 0 };
  }
  entry.count += 1;
  if (entry.count >= MAX_FAILED_LOGINS) {
    entry.until = now + LOCK_MS;
  }
  loginAttempts.set(key, entry);
}

function clearLoginAttempts(key: string) {
  loginAttempts.delete(key);
}

function sanitizeUser(user: any) {
  const { password, ...safe } = user;
  return { ...safe, hasPassword: !!password };
}

// ---------- Google OAuth helpers ----------
function getGoogleConfig() {
  const clientId =
    process.env.GOOGLE_CLIENT_ID ||
    process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
    '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const appUrl =
    (process.env.NEXT_PUBLIC_APP_URL ||
      process.env.APP_URL ||
      process.env.WEB_URL ||
      'http://localhost:3000'
    ).replace(/\/$/, '');
  // redirectUri must exactly match the one registered in Google Cloud Console
  const redirectUri = `${appUrl}/api/auth/callback/google`;
  return { clientId, clientSecret, appUrl, redirectUri };
}

function decodeJwtPayloadUnsafe(idToken: string): any | null {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
    return payload;
  } catch {
    return null;
  }
}

/**
 * Verify Google ID token via Google's tokeninfo endpoint.
 * This validates signature, aud, iss, exp server-side.
 * Returns payload if valid, throws otherwise.
 */
async function verifyGoogleIdToken(idToken: string, expectedAud: string) {
  // Prefer tokeninfo endpoint - Google validates signature & expiry
  const res = await fetch(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    { method: 'GET' }
  );

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Token Google tidak valid: ${text || res.statusText}`);
  }

  const data: any = await res.json();

  // Validate audience
  if (expectedAud && data.aud !== expectedAud) {
    // Allow multiple audiences if clientId contains comma? but strict check
    throw new Error(`Audience tidak cocok. Expected ${expectedAud}, got ${data.aud}`);
  }

  // Validate issuer
  const validIssuers = ['https://accounts.google.com', 'accounts.google.com'];
  if (!validIssuers.includes(data.iss)) {
    throw new Error(`Issuer tidak valid: ${data.iss}`);
  }

  // Validate expiry
  if (data.exp && parseInt(data.exp, 10) * 1000 < Date.now()) {
    throw new Error('ID token sudah kedaluwarsa');
  }

  if (!data.email) {
    throw new Error('Email tidak ditemukan di token Google');
  }

  if (data.email_verified !== 'true' && data.email_verified !== true) {
    // Some flows return string "true"
    // Not fatal but warn
  }

  return {
    email: data.email as string,
    name: (data.name as string) || (data.email as string).split('@')[0],
    picture: (data.picture as string) || null,
    sub: data.sub as string,
    emailVerified: data.email_verified,
    aud: data.aud,
    iss: data.iss,
  };
}

async function fetchGoogleUserInfo(accessToken: string) {
  const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const t = await res.text().catch(() => '');
    throw new Error(`Gagal ambil userinfo Google: ${t || res.statusText}`);
  }
  const data: any = await res.json();
  return {
    email: data.email as string,
    name: (data.name as string) || (data.email as string).split('@')[0],
    picture: (data.picture as string) || null,
    sub: data.id as string,
  };
}

async function upsertGoogleUser(opts: {
  email: string;
  name: string;
  picture: string | null;
  googleId: string | null;
}) {
  const normalizedEmail = opts.email.trim().toLowerCase();
  const { email, name, picture, googleId } = opts;

  // Try by googleId first (most authoritative)
  let user: any = null;
  if (googleId) {
    user = await prisma.user.findUnique({ where: { googleId } });
    // If found by googleId but email changed, sync email if not taken
    if (user && user.email !== normalizedEmail) {
      const emailOwner = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!emailOwner) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { email: normalizedEmail },
        });
      }
    }
  }

  if (!user) {
    user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  }

  if (!user) {
    // Create new user with googleId
    user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name,
        image: picture,
        googleId: googleId || undefined,
      },
    });

    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'FREE',
        status: 'ACTIVE',
        credits: 5,
      },
    });

    sendWelcomeEmail({ toEmail: normalizedEmail, toName: name, credits: 5 }).catch((err) =>
      console.error('[Welcome Email Trigger Error]:', err)
    );

    return user;
  }

  // Existing user: patch missing fields
  const patch: any = {};
  if (googleId && !user.googleId) patch.googleId = googleId;
  if (picture && !user.image) patch.image = picture;
  if (name && !user.name) patch.name = name;

  if (Object.keys(patch).length > 0) {
    user = await prisma.user.update({ where: { id: user.id }, data: patch });
  }

  // Ensure subscription exists
  const sub = await prisma.subscription.findFirst({ where: { userId: user.id } });
  if (!sub) {
    await prisma.subscription.create({
      data: { userId: user.id, plan: 'FREE', status: 'ACTIVE', credits: 5 },
    });
  }

  return user;
}

export default async function authRoutes(server: FastifyInstance) {
  server.post(
    '/auth/register',
    async (request, reply) => {
      const { email, password, name } = request.body as any;

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return reply.code(400).send({ error: 'Email wajib diisi dan valid' });
      }
      if (!password || typeof password !== 'string' || password.length < 8) {
        return reply.code(400).send({ error: 'Password minimal 8 karakter' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (existing) {
        return reply.code(409).send({ error: 'Email sudah terdaftar' });
      }

      const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
      const user = await prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashed,
          name: name || null,
        },
      });

      // Initialize free subscription (5 credits = 5 proyek) for new user
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'FREE',
          status: 'ACTIVE',
          credits: 5,
        },
      });

      const token = server.jwt.sign({ sub: user.id, email: user.email });
      return reply.code(201).send({ token, user: sanitizeUser(user) });
    }
  );

  server.post(
    '/auth/login',
    async (request, reply) => {
      const { email, password } = request.body as any;
      if (!email || !password) {
        return reply.code(400).send({ error: 'Email dan password wajib diisi' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const lockKey = `${normalizedEmail}|${request.ip}`;
      if (isLoginLocked(lockKey)) {
        return reply.code(429).send({ error: 'Terlalu banyak percobaan login. Coba lagi 15 menit lagi.' });
      }

      const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

      const passwordOk = user?.password
        ? await bcrypt.compare(password, user.password)
        : await bcrypt.compare(password, DUMMY_HASH);

      if (!user || !user.password || !passwordOk) {
        recordFailedLogin(lockKey);
        return reply.code(401).send({ error: 'Email atau password salah' });
      }

      clearLoginAttempts(lockKey);
      const token = server.jwt.sign({ sub: user.id, email: user.email });
      return { token, user: sanitizeUser(user) };
    }
  );

  server.get(
    '/auth/me',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { sub } = request.user as any;
      const user = await prisma.user.findUnique({ where: { id: sub } });
      if (!user) {
        return reply.code(404).send({ error: 'User tidak ditemukan' });
      }
      return { user: sanitizeUser(user) };
    }
  );

  // PATCH /api/auth/profile -> update name, image, birthDate, phone, bio
  server.patch(
    '/auth/profile',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { sub } = request.user as any;
      const { name, image, birthDate, phone, bio } = request.body as any;
      const data: any = {};
      if (typeof name === 'string' && name.trim().length > 0) {
        if (name.trim().length < 2) return reply.code(400).send({ error: 'Nama minimal 2 karakter' });
        data.name = name.trim();
      }
      if (image !== undefined) {
        if (image === null || image === '') data.image = null;
        else if (typeof image === 'string' && image.length < 2000000) data.image = image; // allow data URL or https
        else return reply.code(400).send({ error: 'Foto profil tidak valid' });
      }
      if (birthDate !== undefined) {
        if (birthDate === null || birthDate === '') data.birthDate = null;
        else {
          const d = new Date(birthDate);
          if (isNaN(d.getTime())) return reply.code(400).send({ error: 'Tanggal lahir tidak valid (YYYY-MM-DD)' });
          if (d > new Date()) return reply.code(400).send({ error: 'Tanggal lahir tidak boleh di masa depan' });
          data.birthDate = d;
        }
      }
      if (phone !== undefined) {
        if (phone === null || phone === '') data.phone = null;
        else if (typeof phone === 'string' && phone.length <= 20) data.phone = phone.trim();
        else return reply.code(400).send({ error: 'No HP tidak valid' });
      }
      if (bio !== undefined) {
        if (bio === null || bio === '') data.bio = null;
        else if (typeof bio === 'string' && bio.length <= 500) data.bio = bio.trim();
        else return reply.code(400).send({ error: 'Bio maksimal 500 karakter' });
      }
      if (Object.keys(data).length === 0) return reply.code(400).send({ error: 'Tidak ada data untuk diupdate' });
      const updated = await prisma.user.update({ where: { id: sub }, data });
      return { user: sanitizeUser(updated) };
    }
  );

  // POST /api/auth/password -> set/change password
  server.post(
    '/auth/password',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { sub } = request.user as any;
      const { oldPassword, newPassword } = request.body as any;
      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 8) {
        return reply.code(400).send({ error: 'Password baru minimal 8 karakter' });
      }
      const user = await prisma.user.findUnique({ where: { id: sub } });
      if (!user) return reply.code(404).send({ error: 'User tidak ditemukan' });
      if (user.password) {
        if (!oldPassword) return reply.code(400).send({ error: 'Password lama wajib diisi' });
        const ok = await bcrypt.compare(oldPassword, user.password);
        if (!ok) return reply.code(400).send({ error: 'Password lama salah' });
      }
      const hashed = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
      await prisma.user.update({ where: { id: sub }, data: { password: hashed } });
      return { success: true };
    }
  );

  // POST /api/auth/google  -> Google One Tap / GIS ID token verification
  server.post(
    '/auth/google',
    async (request, reply) => {
      const { idToken, accessToken, email: devEmail, name: devName, picture: devPicture } = request.body as any;
      const { clientId } = getGoogleConfig();

      let email: string | null = null;
      let name = 'Google User';
      let picture: string | null = null;
      let googleId: string | null = null;

      // Priority 1: verified idToken via Google tokeninfo
      if (idToken && typeof idToken === 'string') {
        // Try secure verification first
        if (clientId) {
          try {
            const verified = await verifyGoogleIdToken(idToken, clientId);
            email = verified.email;
            name = verified.name;
            picture = verified.picture;
            googleId = verified.sub;
            server.log.info({ email, googleId }, 'Google ID token verified via tokeninfo');
          } catch (err: any) {
            server.log.warn({ err: err.message }, 'Google tokeninfo verification failed, trying unsafe decode');
            // Unsafe decode only allowed when explicitly enabled in non-production
            const allowInsecure = process.env.ALLOW_INSECURE_GOOGLE_AUTH === 'true' && process.env.NODE_ENV !== 'production';
            if (!allowInsecure) {
              return reply.code(401).send({ error: `Verifikasi Google gagal: ${err.message}` });
            }
            const payload = decodeJwtPayloadUnsafe(idToken);
            if (payload?.email) {
              email = payload.email;
              name = payload.name || payload.email.split('@')[0];
              picture = payload.picture || null;
              googleId = payload.sub || null;
            } else {
              return reply.code(401).send({ error: `Token Google tidak valid: ${err.message}` });
            }
          }
        } else {
          // No clientId configured -> refuse login (never use unsafe decode)
          return reply.code(500).send({
            error: 'GOOGLE_CLIENT_ID belum dikonfigurasi di server. Set GOOGLE_CLIENT_ID / NEXT_PUBLIC_GOOGLE_CLIENT_ID di .env',
          });
        }
      }

      // Priority 2: accessToken -> fetch userinfo
      if (!email && accessToken && typeof accessToken === 'string') {
        try {
          const info = await fetchGoogleUserInfo(accessToken);
          email = info.email;
          name = info.name;
          picture = info.picture;
          googleId = info.sub;
        } catch (e: any) {
          server.log.warn({ err: e.message }, 'Google userinfo fetch failed');
          return reply.code(401).send({ error: `Gagal verifikasi access token Google: ${e.message}` });
        }
      }

      // Priority 3: dev fallback fields (only allowed when explicitly enabled in non-production)
      if (!email && devEmail) {
        const isDev = process.env.ALLOW_INSECURE_GOOGLE_AUTH === 'true' && process.env.NODE_ENV !== 'production';
        if (!isDev) {
          return reply.code(401).send({ error: 'ID token Google wajib disertakan' });
        }
        server.log.warn('Using devEmail fallback for Google auth (insecure, dev only)');
        email = devEmail;
        name = devName || 'Google User';
        picture = devPicture || null;
        googleId = null;
      }

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return reply.code(400).send({ error: 'Email Google tidak valid' });
      }

      try {
        const user = await upsertGoogleUser({ email, name, picture, googleId });
        const token = server.jwt.sign({ sub: user.id, email: user.email });
        return { token, user: sanitizeUser(user) };
      } catch (e: any) {
        server.log.error(e, 'upsertGoogleUser failed');
        return reply.code(500).send({ error: 'Gagal membuat / memperbarui akun Google: ' + e.message });
      }
    }
  );

  // GET /api/auth/google/url -> return Authorization URL for redirect flow
  server.get('/auth/google/url', async (request, reply) => {
    const { clientId, redirectUri } = getGoogleConfig();

    if (!clientId) {
      return reply.code(500).send({
        error: 'GOOGLE_CLIENT_ID belum dikonfigurasi. Set GOOGLE_CLIENT_ID / NEXT_PUBLIC_GOOGLE_CLIENT_ID di .env',
      });
    }

    // Use state for CSRF (simple random, not stored server-side for MVP)
    // For production, store in cookie/session.
    const state = (Math.random().toString(36).substring(2) + Date.now().toString(36)).substring(0, 24);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      prompt: 'select_account',
      access_type: 'offline',
      state,
      include_granted_scopes: 'true',
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return { url: googleAuthUrl, redirectUri, state };
  });

  // GET /api/auth/callback/google  -> OAuth code exchange
  server.get('/auth/callback/google', async (request, reply) => {
    const query = request.query as { code?: string; state?: string; error?: string; error_description?: string };
    const { code, error, error_description } = query;
    const { clientId, clientSecret, appUrl, redirectUri } = getGoogleConfig();

    if (error) {
      server.log.warn({ error, error_description }, 'Google OAuth returned error');
      return reply.redirect(`${appUrl}/login?error=${encodeURIComponent(error_description || error || 'Google OAuth dibatalkan')}`);
    }

    if (!code) {
      return reply.redirect(`${appUrl}/login?error=${encodeURIComponent('Kode otorisasi Google tidak ditemukan')}`);
    }

    if (!clientId) {
      return reply.redirect(`${appUrl}/login?error=${encodeURIComponent('GOOGLE_CLIENT_ID belum dikonfigurasi di server')}`);
    }
    if (!clientSecret) {
      return reply.redirect(
        `${appUrl}/login?error=${encodeURIComponent('GOOGLE_CLIENT_SECRET belum dikonfigurasi di server. Set di .env api')}`
      );
    }

    try {
      // Exchange code for tokens
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData: any = await tokenRes.json();

      if (!tokenRes.ok) {
        server.log.error({ tokenData }, 'Google token exchange failed');
        throw new Error(tokenData.error_description || tokenData.error || 'Gagal menukar kode dengan token Google');
      }

      if (!tokenData.id_token && !tokenData.access_token) {
        throw new Error('Tidak menerima id_token / access_token dari Google');
      }

      let email: string | null = null;
      let name = 'Google User';
      let picture: string | null = null;
      let googleId: string | null = null;

      // Prefer verifying id_token
      if (tokenData.id_token) {
        try {
          const verified = await verifyGoogleIdToken(tokenData.id_token, clientId);
          email = verified.email;
          name = verified.name;
          picture = verified.picture;
          googleId = verified.sub;
        } catch (verifyErr: any) {
          server.log.warn({ err: verifyErr.message }, 'id_token verification failed, trying access_token userinfo');
          // Fallback to userinfo via access_token if available
          if (tokenData.access_token) {
            const info = await fetchGoogleUserInfo(tokenData.access_token);
            email = info.email;
            name = info.name;
            picture = info.picture;
            googleId = info.sub;
          } else {
            // id_token verification failed with no fallback access_token
            throw verifyErr;
          }
        }
      } else if (tokenData.access_token) {
        const info = await fetchGoogleUserInfo(tokenData.access_token);
        email = info.email;
        name = info.name;
        picture = info.picture;
        googleId = info.sub;
      }

      if (!email || !email.includes('@')) {
        throw new Error('Email Google tidak valid setelah verifikasi');
      }

      const user = await upsertGoogleUser({ email, name, picture, googleId });
      const jwtToken = server.jwt.sign({ sub: user.id, email: user.email });
      const sanitized = sanitizeUser(user);

      // Redirect to Next.js callback page which will store token & go to dashboard
      return reply.redirect(
        `${appUrl}/auth/callback?token=${encodeURIComponent(jwtToken)}&user=${encodeURIComponent(JSON.stringify(sanitized))}`
      );
    } catch (e: any) {
      server.log.error({ err: e.message, stack: e.stack }, 'Google OAuth callback error');
      return reply.redirect(`${appUrl}/login?error=${encodeURIComponent('Gagal autentikasi Google: ' + e.message)}`);
    }
  });

  // Alias for compatibility: Google sometimes configured with /auth/google/callback
  server.get('/auth/google/callback', async (request, reply) => {
    // Forward to main handler
    (request as any).query = request.query;
    // Call the same logic by redirecting internally
    const qs = new URLSearchParams(request.query as any).toString();
    return reply.redirect(`/api/auth/callback/google?${qs}`);
  });
}
