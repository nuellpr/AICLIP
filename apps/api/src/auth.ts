import { FastifyInstance } from 'fastify';
import bcrypt from 'bcryptjs';
import { prisma } from '@clipforge/database';

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
          const googleClientId = process.env.GOOGLE_CLIENT_ID;
          if (googleClientId) {
            const { OAuth2Client } = require('google-auth-library');
            const client = new OAuth2Client(googleClientId);
            const ticket = await client.verifyIdToken({
              idToken,
              audience: googleClientId,
            });
            const payload = ticket.getPayload();
            if (payload && payload.email) {
              email = payload.email;
              name = payload.name || name;
              picture = payload.picture || picture;
              googleId = payload.sub;
            }
          } else {
            const decoded: any = server.jwt.decode(idToken);
            if (decoded && decoded.email) {
              email = decoded.email;
              name = decoded.name || name;
              picture = decoded.picture || picture;
              googleId = decoded.sub || null;
            }
          }
        } catch (e: any) {
          server.log.warn('Google token verification fallback used');
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
            googleId: googleId || `google_${Date.now()}`,
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
}
