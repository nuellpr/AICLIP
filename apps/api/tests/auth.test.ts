import { describe, expect, it } from 'vitest';
import { buildServer } from '../src/index';
import { prisma } from '@clipforge/database';

function uniqueEmail(prefix = 'test') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

describe('POST /api/auth/register', () => {
  it('creates a user and returns a token', async () => {
    const server = buildServer({ rateLimitMax: 1000 });
    const email = uniqueEmail();

    const res = await server.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email, password: 'password123', name: 'Test User' },
    });

    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.token).toBeTruthy();
    expect(body.user.email).toBe(email);
    expect(body.user.password).toBeUndefined();
    await server.close();
  });

  it('rejects duplicate emails', async () => {
    const server = buildServer({ rateLimitMax: 1000 });
    const email = uniqueEmail();
    const payload = { email, password: 'password123' };

    const first = await server.inject({ method: 'POST', url: '/api/auth/register', payload });
    expect(first.statusCode).toBe(201);

    const second = await server.inject({ method: 'POST', url: '/api/auth/register', payload });
    expect(second.statusCode).toBe(409);
    await server.close();
  });

  it('rejects passwords shorter than 8 characters', async () => {
    const server = buildServer({ rateLimitMax: 1000 });
    const res = await server.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: uniqueEmail(), password: 'short' },
    });
    expect(res.statusCode).toBe(400);
    await server.close();
  });

  it('rejects invalid emails', async () => {
    const server = buildServer({ rateLimitMax: 1000 });
    const res = await server.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email: 'not-an-email', password: 'password123' },
    });
    expect(res.statusCode).toBe(400);
    await server.close();
  });

  it('stores the password hashed, not in plaintext', async () => {
    const server = buildServer({ rateLimitMax: 1000 });
    const email = uniqueEmail('hash');

    await server.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email, password: 'password123' },
    });

    const user = await prisma.user.findUnique({ where: { email } });
    expect(user).toBeTruthy();
    expect(user!.password).not.toBe('password123');
    expect(user!.password).toMatch(/^\$2[aby]\$/);

    await prisma.user.delete({ where: { email } });
    await server.close();
  });
});

describe('POST /api/auth/login', () => {
  async function createUser(server: any, email: string) {
    return server.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email, password: 'password123' },
    });
  }

  it('logs in with correct credentials', async () => {
    const server = buildServer({ rateLimitMax: 1000 });
    const email = uniqueEmail('login');
    await createUser(server, email);

    const res = await server.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password: 'password123' },
    });

    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.token).toBeTruthy();
    expect(body.user.email).toBe(email);
    await server.close();
  });

  it('rejects wrong password', async () => {
    const server = buildServer({ rateLimitMax: 1000 });
    const email = uniqueEmail('login');
    await createUser(server, email);

    const res = await server.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password: 'wrong-password' },
    });

    expect(res.statusCode).toBe(401);
    await server.close();
  });

  it('rejects unknown emails', async () => {
    const server = buildServer({ rateLimitMax: 1000 });
    const res = await server.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email: uniqueEmail(), password: 'password123' },
    });
    expect(res.statusCode).toBe(401);
    await server.close();
  });
});

describe('GET /api/auth/me', () => {
  it('returns the user for a valid token', async () => {
    const server = buildServer({ rateLimitMax: 1000 });
    const email = uniqueEmail('me');

    const reg = await server.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email, password: 'password123' },
    });
    const { token } = reg.json();

    const res = await server.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: `Bearer ${token}` },
    });

    expect(res.statusCode).toBe(200);
    expect(res.json().user.email).toBe(email);
    await server.close();
  });

  it('rejects missing token', async () => {
    const server = buildServer({ rateLimitMax: 1000 });
    const res = await server.inject({ method: 'GET', url: '/api/auth/me' });
    expect(res.statusCode).toBe(401);
    await server.close();
  });

  it('rejects invalid token', async () => {
    const server = buildServer({ rateLimitMax: 1000 });
    const res = await server.inject({
      method: 'GET',
      url: '/api/auth/me',
      headers: { authorization: 'Bearer not-a-real-token' },
    });
    expect(res.statusCode).toBe(401);
    await server.close();
  });
});

describe('Rate limiting', () => {
  it('locks login after 10 failed attempts', async () => {
    const server = buildServer({ rateLimitMax: 1000 });
    const email = uniqueEmail('rl');

    await server.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: { email, password: 'password123' },
    });

    for (let i = 0; i < 10; i++) {
      const res = await server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: { email, password: 'wrong-password' },
      });
      expect(res.statusCode).toBe(401);
    }

    const blocked = await server.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: { email, password: 'password123' },
    });
    expect(blocked.statusCode).toBe(429);

    await server.close();
  });

  it('blocks excessive global traffic', async () => {
    const server = buildServer({ rateLimitMax: 5 });
    let lastStatus = 0;
    for (let i = 0; i < 6; i++) {
      const res = await server.inject({ method: 'GET', url: '/api/auth/me' });
      lastStatus = res.statusCode;
    }
    expect(lastStatus).toBe(429);
    await server.close();
  });
});
