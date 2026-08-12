import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '@clipforge/database';
import { sendWelcomeEmail } from './services/emailService';

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
  return safe;
}

async function authenticate(request: any, reply: any) {
  try {
    await request.jwtVerify();
  } catch (err) {
    return reply.code(401).send({ error: 'Token tidak valid atau kedaluwarsa' });
  }
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

      // Initialize free subscription (25 mins) for new user
      await prisma.subscription.create({
        data: {
          userId: user.id,
          plan: 'FREE',
          status: 'ACTIVE',
          credits: 25,
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

  server.post(
    '/auth/google',
    async (request, reply) => {
      const { idToken, email: devEmail, name: devName, picture: devPicture } = request.body as any;

      let email = devEmail;
      let name = devName || 'Google User';
      let picture = devPicture || null;
      let googleId = null;

      if (idToken) {
        try {
          const parts = idToken.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
            if (payload && payload.email) {
              email = payload.email;
              name = payload.name || payload.email.split('@')[0];
              picture = payload.picture || null;
              googleId = payload.sub || null;
            }
          }
        } catch (e: any) {
          server.log.warn('Google ID token parsing fallback');
        }
      }

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return reply.code(400).send({ error: 'Email Google tidak valid' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            name,
            image: picture,
          },
        });

        // Initialize free subscription (25 mins) for new user
        await prisma.subscription.create({
          data: {
            userId: user.id,
            plan: 'FREE',
            status: 'ACTIVE',
            credits: 25,
          },
        });

        // Send Welcome Email asynchronously
        sendWelcomeEmail({ toEmail: normalizedEmail, toName: name, credits: 25 }).catch((err) =>
          console.error('[Welcome Email Trigger Error]:', err)
        );
      } else if (picture && !user.image) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { image: picture },
        });
      }

      const token = server.jwt.sign({ sub: user.id, email: user.email });
      return { token, user: sanitizeUser(user) };
    }
  );

  // Official Google OAuth Authorization Redirect URL
  server.get('/auth/google/url', async (request, reply) => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '205226226089-r9shmia8s6i72878jgqucml68a6gdgt4.apps.googleusercontent.com';
    const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || 'https://forgeai.web.id'}/api/auth/callback/google`;
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${clientId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&prompt=select_account`;

    return { url: googleAuthUrl };
  });

  // Official Google OAuth Callback Code Exchange
  server.get('/auth/callback/google', async (request, reply) => {
    const { code } = request.query as { code?: string };
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://forgeai.web.id';

    if (!code) {
      return reply.redirect(`${appUrl}/login?error=${encodeURIComponent('Kode otorisasi Google tidak ditemukan')}`);
    }

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '205226226089-r9shmia8s6i72878jgqucml68a6gdgt4.apps.googleusercontent.com';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
    const redirectUri = `${appUrl}/api/auth/callback/google`;

    try {
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

      const tokenData = await tokenRes.json();
      if (!tokenData.id_token) {
        throw new Error(tokenData.error_description || 'Gagal mengambil ID token dari Google');
      }

      const parts = tokenData.id_token.split('.');
      const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf-8'));
      const email = payload.email;
      const name = payload.name || email.split('@')[0];
      const picture = payload.picture || null;

      if (!email || !email.includes('@')) {
        throw new Error('Email Google tidak valid');
      }

      const normalizedEmail = email.trim().toLowerCase();
      let user = await prisma.user.findUnique({ where: { email: normalizedEmail } });

      if (!user) {
        user = await prisma.user.create({
          data: {
            email: normalizedEmail,
            name,
            image: picture,
          },
        });

        await prisma.subscription.create({
          data: {
            userId: user.id,
            plan: 'FREE',
            status: 'ACTIVE',
            credits: 25,
          },
        });
      } else if (picture && !user.image) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { image: picture },
        });
      }

      const jwtToken = server.jwt.sign({ sub: user.id, email: user.email });
      const sanitized = sanitizeUser(user);

      return reply.redirect(`${appUrl}/auth/callback?token=${jwtToken}&user=${encodeURIComponent(JSON.stringify(sanitized))}`);
    } catch (e: any) {
      server.log.error('Google OAuth callback error:', e);
      return reply.redirect(`${appUrl}/login?error=${encodeURIComponent('Gagal autentikasi Google: ' + e.message)}`);
    }
  });
}
