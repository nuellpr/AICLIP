import { describe, expect, it } from 'vitest';
import { buildServer } from '../src/index';

describe('API server', () => {
  it('responds on /health', async () => {
    const server = buildServer();
    const res = await server.inject({ method: 'GET', url: '/health' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ok', service: 'api' });
    await server.close();
  });

  it('responds on /ready', async () => {
    const server = buildServer();
    const res = await server.inject({ method: 'GET', url: '/ready' });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toMatchObject({ status: 'ready' });
    await server.close();
  });

  it('returns 404 for unknown routes', async () => {
    const server = buildServer();
    const res = await server.inject({ method: 'GET', url: '/does-not-exist' });
    expect(res.statusCode).toBe(404);
    await server.close();
  });

  it('returns 404 for unknown api routes', async () => {
    const server = buildServer();
    const res = await server.inject({ method: 'GET', url: '/api/nope' });
    expect(res.statusCode).toBe(404);
    await server.close();
  });
});
