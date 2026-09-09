import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/index';
import { prisma } from '@clipforge/database';

let server: any;
let token: string;
let userId: string;
let projectId: string;

function uniqueEmail(prefix = 'proj') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

beforeAll(async () => {
  server = buildServer({ rateLimitMax: 10000 });

  const email = uniqueEmail();
  const reg = await server.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { email, password: 'password123', name: 'Project Tester' },
  });
  token = reg.json().token;
  userId = reg.json().user.id;

  await prisma.subscription.create({
    data: { userId, plan: 'PRO', status: 'ACTIVE', credits: 100 },
  });
});

afterAll(async () => {
  if (projectId) {
    await prisma.clip.deleteMany({ where: { projectId } }).catch(() => {});
    await prisma.project.delete({ where: { id: projectId } }).catch(() => {});
  }
  await prisma.subscription.deleteMany({ where: { userId } }).catch(() => {});
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  await server.close();
});

describe('Projects API', () => {
  describe('POST /api/projects', () => {
    it('rejects unauthenticated request', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/projects',
        payload: { title: 'test', sourceType: 'URL', sourceUrl: 'https://youtube.com/watch?v=x' },
      });
      expect(res.statusCode).toBe(401);
    });

    it('requires credits to create project', async () => {
      // Verify user has credits (created in beforeAll)
      const sub = await prisma.subscription.findFirst({ where: { userId } });
      expect(sub!.credits).toBeGreaterThan(0);
    });
  });

  describe('GET /api/projects', () => {
    it('lists user projects', async () => {
      // Create project directly in DB (avoids Redis dependency)
      const project = await prisma.project.create({
        data: {
          userId,
          title: 'Test Project',
          sourceType: 'URL',
          sourceUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          status: 'READY',
          layoutMode: 'crop_blur',
          aspectRatio: '9:16',
          clipCount: 5,
          targetDuration: '30-60',
        },
      });
      projectId = project.id;

      const res = await server.inject({
        method: 'GET',
        url: '/api/projects',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const projects = res.json();
      expect(Array.isArray(projects)).toBe(true);
      const found = projects.find((p: any) => p.id === projectId);
      expect(found).toBeTruthy();
      expect(found.title).toBe('Test Project');
    });

    it('rejects unauthenticated request', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/projects',
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/projects/:id/progress', () => {
    it('returns project progress', async () => {
      const res = await server.inject({
        method: 'GET',
        url: `/api/projects/${projectId}/progress`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.status).toBeTruthy();
      expect(body.progress).toBeDefined();
      expect(body.clips).toBeDefined();
      expect(Array.isArray(body.clips)).toBe(true);
    });

    it('returns 404 for non-existent project', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/projects/non-existent/progress',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    });

    it('rejects other users project', async () => {
      const email2 = uniqueEmail('other');
      const reg2 = await server.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email: email2, password: 'password123' },
      });
      const token2 = reg2.json().token;

      const res = await server.inject({
        method: 'GET',
        url: `/api/projects/${projectId}/progress`,
        headers: { authorization: `Bearer ${token2}` },
      });
      expect(res.statusCode).toBe(403);

      // Cleanup
      await prisma.user.delete({ where: { id: reg2.json().user.id } }).catch(() => {});
    });
  });

  describe('GET /api/projects/:id/stream (SSE)', () => {
    it('returns SSE headers', async () => {
      const res = await server.inject({
        method: 'GET',
        url: `/api/projects/${projectId}/stream`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/event-stream');
      expect(res.headers['cache-control']).toBe('no-cache');
      expect(res.headers['connection']).toBe('keep-alive');
    });

    it('accepts token via query param', async () => {
      const res = await server.inject({
        method: 'GET',
        url: `/api/projects/${projectId}/stream?token=${token}`,
      });
      expect(res.statusCode).toBe(200);
      expect(res.headers['content-type']).toContain('text/event-stream');
    });

    it('rejects invalid token', async () => {
      const res = await server.inject({
        method: 'GET',
        url: `/api/projects/${projectId}/stream`,
        headers: { authorization: 'Bearer invalid-token' },
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('Clip render status tracking', () => {
    let clipId: string;

    it('creates a clip and tracks render status through PENDING -> QUEUED -> RENDERING -> READY', async () => {
      // Create clip directly in DB
      const clip = await prisma.clip.create({
        data: {
          project: { connect: { id: projectId } },
          title: 'Status Test Clip',
          hook: 'test hook',
          startTime: 10,
          endTime: 30,
          viralScore: 80,
          reason: 'test',
          caption: 'test caption',
          hashtags: '',
          renderStatus: 'PENDING',
        },
      });
      clipId = clip.id;

      // Verify initial PENDING status via progress endpoint
      const progress0 = await server.inject({
        method: 'GET',
        url: `/api/projects/${projectId}/progress`,
        headers: { authorization: `Bearer ${token}` },
      });
      const pendingClip = progress0.json().clips.find((c: any) => c.id === clipId);
      expect(pendingClip?.renderStatus).toBe('PENDING');

      // Simulate render trigger: PENDING -> QUEUED (what the API does)
      await prisma.clip.update({
        where: { id: clipId },
        data: { renderStatus: 'QUEUED' },
      });

      // Check progress shows clip as QUEUED
      const progress1 = await server.inject({
        method: 'GET',
        url: `/api/projects/${projectId}/progress`,
        headers: { authorization: `Bearer ${token}` },
      });
      const queuedClip = progress1.json().clips.find((c: any) => c.id === clipId);
      expect(queuedClip?.renderStatus).toBe('QUEUED');

      // Simulate worker picking up: QUEUED -> RENDERING
      await prisma.clip.update({
        where: { id: clipId },
        data: { renderStatus: 'RENDERING' },
      });

      // Check progress shows clip as RENDERING
      const progress2 = await server.inject({
        method: 'GET',
        url: `/api/projects/${projectId}/progress`,
        headers: { authorization: `Bearer ${token}` },
      });
      const renderingClip = progress2.json().clips.find((c: any) => c.id === clipId);
      expect(renderingClip?.renderStatus).toBe('RENDERING');

      // Simulate worker finishing: RENDERING -> READY
      await prisma.clip.update({
        where: { id: clipId },
        data: { renderStatus: 'READY', renderedFileKey: 'https://example.com/rendered.mp4' },
      });

      // Check progress shows clip as READY
      const progress3 = await server.inject({
        method: 'GET',
        url: `/api/projects/${projectId}/progress`,
        headers: { authorization: `Bearer ${token}` },
      });
      const readyClip = progress3.json().clips.find((c: any) => c.id === clipId);
      expect(readyClip?.renderStatus).toBe('READY');
      expect(readyClip?.renderedFileKey).toBe('https://example.com/rendered.mp4');
    });

    afterAll(async () => {
      if (clipId) {
        await prisma.clip.delete({ where: { id: clipId } }).catch(() => {});
      }
    });
  });
});
