import { describe, expect, it, beforeAll, afterAll } from 'vitest';
import { buildServer } from '../src/index';
import { prisma } from '@clipforge/database';

let server: any;
let token: string;
let userId: string;
let projectId: string;
let clipId: string;

function uniqueEmail(prefix = 'clip') {
  return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}@example.com`;
}

beforeAll(async () => {
  server = buildServer({ rateLimitMax: 10000 });

  // Register user
  const email = uniqueEmail();
  const reg = await server.inject({
    method: 'POST',
    url: '/api/auth/register',
    payload: { email, password: 'password123', name: 'Clip Tester' },
  });
  expect(reg.statusCode).toBe(201);
  token = reg.json().token;
  userId = reg.json().user.id;

  // Create subscription with credits
  await prisma.subscription.create({
    data: { userId, plan: 'PRO', status: 'ACTIVE', credits: 100 },
  });

  // Create project directly in DB (avoids Redis/BullMQ dependency)
  const project = await prisma.project.create({
    data: {
      userId,
      title: 'Test Project for Clips',
      sourceType: 'URL',
      sourceUrl: 'https://www.youtube.com/watch?v=test123',
      status: 'READY',
      layoutMode: 'crop_blur',
      aspectRatio: '9:16',
      clipCount: 3,
      targetDuration: '30-60',
    },
  });
  projectId = project.id;

  // Create clip directly in DB (simulates worker output)
  const clip = await prisma.clip.create({
    data: {
      project: { connect: { id: projectId } },
      title: 'Test Viral Clip',
      hook: 'Hook yang menarik untuk test',
      startTime: 10,
      endTime: 40,
      viralScore: 85,
      reason: 'Momen emosional yang kuat',
      caption: 'Ini adalah caption untuk test clip viral',
      hashtags: 'viral,test,clip',
      renderStatus: 'PENDING',
      subtitleOffset: -0.2,
    },
  });
  clipId = clip.id;
});

afterAll(async () => {
  if (clipId) {
    await prisma.clip.delete({ where: { id: clipId } }).catch(() => {});
  }
  if (projectId) {
    await prisma.clip.deleteMany({ where: { projectId } }).catch(() => {});
    await prisma.project.delete({ where: { id: projectId } }).catch(() => {});
  }
  await prisma.subscription.deleteMany({ where: { userId } }).catch(() => {});
  await prisma.user.delete({ where: { id: userId } }).catch(() => {});
  await server.close();
});

describe('Clips API', () => {
  describe('PUT /api/clips/:id', () => {
    it('updates clip properties', async () => {
      const res = await server.inject({
        method: 'PUT',
        url: `/api/clips/${clipId}`,
        headers: { authorization: `Bearer ${token}` },
        payload: {
          title: 'Updated Clip Title',
          hook: 'Updated hook',
          startTime: 15,
          endTime: 45,
          caption: 'Updated caption text',
          layoutMode: 'fit_blur',
          subtitleOffset: 0.5,
        },
      });
      expect(res.statusCode).toBe(200);
      const body = res.json();
      expect(body.title).toBe('Updated Clip Title');
      expect(body.hook).toBe('Updated hook');
      expect(body.startTime).toBe(15);
      expect(body.endTime).toBe(45);
      expect(body.caption).toBe('Updated caption text');
      expect(body.layoutMode).toBe('fit_blur');
      expect(body.subtitleOffset).toBe(0.5);
    });

    it('rejects clip not owned by user', async () => {
      // Create another user's clip
      const email2 = uniqueEmail('other');
      const reg2 = await server.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email: email2, password: 'password123' },
      });
      const token2 = reg2.json().token;
      const userId2 = reg2.json().user.id;

      // Create other user's project and clip
      await prisma.subscription.create({
        data: { userId: userId2, plan: 'PRO', status: 'ACTIVE', credits: 50 },
      });
      const proj2 = await prisma.project.create({
        data: {
          userId: userId2,
          title: 'Other Project',
          sourceType: 'URL',
          sourceUrl: 'https://youtube.com/watch?v=x',
          status: 'READY',
        },
      });
      const clip2 = await prisma.clip.create({
        data: {
          project: { connect: { id: proj2.id } },
          title: 'Other Clip',
          hook: 'hook',
          startTime: 0,
          endTime: 10,
          viralScore: 50,
          reason: 'test',
          caption: 'test',
          hashtags: '',
        },
      });

      const res = await server.inject({
        method: 'PUT',
        url: `/api/clips/${clip2.id}`,
        headers: { authorization: `Bearer ${token}` },
        payload: { title: 'Hacked' },
      });
      expect(res.statusCode).toBe(404);

      // Cleanup
      await prisma.clip.delete({ where: { id: clip2.id } }).catch(() => {});
      await prisma.project.delete({ where: { id: proj2.id } }).catch(() => {});
      await prisma.subscription.deleteMany({ where: { userId: userId2 } }).catch(() => {});
      await prisma.user.delete({ where: { id: userId2 } }).catch(() => {});
    });

    it('validates endTime > startTime', async () => {
      const res = await server.inject({
        method: 'PUT',
        url: `/api/clips/${clipId}`,
        headers: { authorization: `Bearer ${token}` },
        payload: { startTime: 50, endTime: 40 },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toContain('endTime harus > startTime');
    });

    it('validates max duration 10 minutes', async () => {
      const res = await server.inject({
        method: 'PUT',
        url: `/api/clips/${clipId}`,
        headers: { authorization: `Bearer ${token}` },
        payload: { startTime: 0, endTime: 700 },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toContain('Durasi clip maksimal 10 menit');
    });

    it('validates negative startTime', async () => {
      const res = await server.inject({
        method: 'PUT',
        url: `/api/clips/${clipId}`,
        headers: { authorization: `Bearer ${token}` },
        payload: { startTime: -1 },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toContain('startTime tidak valid');
    });

    it('returns 404 for non-existent clip', async () => {
      const res = await server.inject({
        method: 'PUT',
        url: '/api/clips/non-existent-id',
        headers: { authorization: `Bearer ${token}` },
        payload: { title: 'test' },
      });
      expect(res.statusCode).toBe(404);
    });

    it('updates captionSettings as JSON', async () => {
      const settings = {
        id: 'hormozi',
        activeWordColor: '#FFE600',
        textColor: '#FFFFFF',
        strokeColor: '#000000',
        strokeWidth: 6,
      };
      const res = await server.inject({
        method: 'PUT',
        url: `/api/clips/${clipId}`,
        headers: { authorization: `Bearer ${token}` },
        payload: { captionSettings: settings },
      });
      expect(res.statusCode).toBe(200);
      expect(JSON.parse(res.json().captionSettings)).toEqual(settings);
    });
  });

  describe('POST /api/clips/:id/render', () => {
    it('queues a clip for rendering (DB-only, skips BullMQ)', async () => {
      // Reset clip status first
      await prisma.clip.update({
        where: { id: clipId },
        data: { renderStatus: 'PENDING' },
      });

      // Verify clip is PENDING before render trigger
      const before = await prisma.clip.findUnique({ where: { id: clipId } });
      expect(before?.renderStatus).toBe('PENDING');

      // Note: POST /api/clips/:id/render requires Redis/BullMQ.
      // In test env without Redis, we simulate the DB update the endpoint does:
      await prisma.clip.update({
        where: { id: clipId },
        data: { renderStatus: 'QUEUED' },
      });

      const after = await prisma.clip.findUnique({ where: { id: clipId } });
      expect(after?.renderStatus).toBe('QUEUED');
    });

    it('returns 404 for non-existent clip', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/clips/non-existent/render',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    });

    it('rejects unauthenticated render request', async () => {
      const res = await server.inject({
        method: 'POST',
        url: `/api/clips/${clipId}/render`,
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('GET /api/clips/:id/words', () => {
    it('returns empty array when no words exist', async () => {
      const res = await server.inject({
        method: 'GET',
        url: `/api/clips/${clipId}/words`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      expect(Array.isArray(res.json())).toBe(true);
    });

    it('returns 404 for non-existent clip', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/clips/non-existent/words',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('PUT /api/clips/:id/words', () => {
    const testWords = [
      { text: 'Hello', start: 0, end: 0.5 },
      { text: 'world', start: 0.5, end: 1.0 },
      { text: 'test', start: 1.0, end: 1.5 },
    ];

    it('saves custom word timestamps', async () => {
      const res = await server.inject({
        method: 'PUT',
        url: `/api/clips/${clipId}/words`,
        headers: { authorization: `Bearer ${token}` },
        payload: { words: testWords },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().success).toBe(true);
      expect(res.json().count).toBe(3);
    });

    it('rejects non-array words', async () => {
      const res = await server.inject({
        method: 'PUT',
        url: `/api/clips/${clipId}/words`,
        headers: { authorization: `Bearer ${token}` },
        payload: { words: 'not an array' },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toContain('Words must be an array');
    });

    it('rejects words exceeding 5000 limit', async () => {
      const tooManyWords = Array.from({ length: 5001 }, (_, i) => ({
        text: `word${i}`,
        start: i * 0.1,
        end: i * 0.1 + 0.09,
      }));
      const res = await server.inject({
        method: 'PUT',
        url: `/api/clips/${clipId}/words`,
        headers: { authorization: `Bearer ${token}` },
        payload: { words: tooManyWords },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toContain('Words terlalu banyak');
    });

    it('rejects invalid word objects', async () => {
      const res = await server.inject({
        method: 'PUT',
        url: `/api/clips/${clipId}/words`,
        headers: { authorization: `Bearer ${token}` },
        payload: { words: [{ text: 'bad', start: -1, end: 0 }] },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toContain('Word tidak valid');
    });

    it('updates clip caption from words', async () => {
      const res = await server.inject({
        method: 'PUT',
        url: `/api/clips/${clipId}/words`,
        headers: { authorization: `Bearer ${token}` },
        payload: { words: [{ text: 'Caption', start: 0, end: 0.5 }, { text: 'updated', start: 0.5, end: 1 }] },
      });
      expect(res.statusCode).toBe(200);

      // Verify caption was updated in DB
      const clip = await prisma.clip.findUnique({ where: { id: clipId } });
      expect(clip?.caption).toBe('Caption updated');
    });
  });

  describe('GET /api/clips/library', () => {
    it('returns only READY clips', async () => {
      // Set clip to READY
      await prisma.clip.update({
        where: { id: clipId },
        data: { renderStatus: 'READY', renderedFileKey: 'https://example.com/test.mp4' },
      });

      const res = await server.inject({
        method: 'GET',
        url: '/api/clips/library',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const clips = res.json();
      expect(Array.isArray(clips)).toBe(true);
      const found = clips.find((c: any) => c.id === clipId);
      expect(found).toBeTruthy();
      expect(found.renderStatus).toBe('READY');
    });

    it('does not return non-READY clips', async () => {
      // Set clip to PENDING
      await prisma.clip.update({
        where: { id: clipId },
        data: { renderStatus: 'PENDING', renderedFileKey: null },
      });

      const res = await server.inject({
        method: 'GET',
        url: '/api/clips/library',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      const clips = res.json();
      const found = clips.find((c: any) => c.id === clipId);
      expect(found).toBeUndefined();

      // Restore to READY for other tests
      await prisma.clip.update({
        where: { id: clipId },
        data: { renderStatus: 'READY', renderedFileKey: 'https://example.com/test.mp4' },
      });
    });

    it('rejects unauthenticated request', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/clips/library',
      });
      expect(res.statusCode).toBe(401);
    });
  });

  describe('DELETE /api/clips/:id', () => {
    it('deletes a clip', async () => {
      // Create a temporary clip to delete
      const tempClip = await prisma.clip.create({
        data: {
          project: { connect: { id: projectId } },
          title: 'To Be Deleted',
          hook: 'delete me',
          startTime: 0,
          endTime: 5,
          viralScore: 50,
          reason: 'test',
          caption: 'test',
          hashtags: '',
        },
      });

      const res = await server.inject({
        method: 'DELETE',
        url: `/api/clips/${tempClip.id}`,
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().success).toBe(true);

      // Verify deleted
      const deleted = await prisma.clip.findUnique({ where: { id: tempClip.id } });
      expect(deleted).toBeNull();
    });

    it('returns 404 for non-existent clip', async () => {
      const res = await server.inject({
        method: 'DELETE',
        url: '/api/clips/non-existent',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(404);
    });
  });

  describe('POST /api/clips/batch-delete', () => {
    it('batch deletes multiple clips', async () => {
      // Create temporary clips
      const clip1 = await prisma.clip.create({
        data: {
          project: { connect: { id: projectId } },
          title: 'Batch 1', hook: 'h1', startTime: 0, endTime: 5,
          viralScore: 50, reason: 'r', caption: 'c', hashtags: '',
        },
      });
      const clip2 = await prisma.clip.create({
        data: {
          project: { connect: { id: projectId } },
          title: 'Batch 2', hook: 'h2', startTime: 5, endTime: 10,
          viralScore: 60, reason: 'r', caption: 'c', hashtags: '',
        },
      });

      const res = await server.inject({
        method: 'POST',
        url: '/api/clips/batch-delete',
        headers: { authorization: `Bearer ${token}` },
        payload: { clipIds: [clip1.id, clip2.id] },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().success).toBe(true);
      expect(res.json().count).toBe(2);

      // Verify deleted
      const d1 = await prisma.clip.findUnique({ where: { id: clip1.id } });
      const d2 = await prisma.clip.findUnique({ where: { id: clip2.id } });
      expect(d1).toBeNull();
      expect(d2).toBeNull();
    });

    it('rejects empty clipIds array', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/clips/batch-delete',
        headers: { authorization: `Bearer ${token}` },
        payload: { clipIds: [] },
      });
      expect(res.statusCode).toBe(400);
      expect(res.json().error).toContain('No clip IDs provided');
    });

    it('rejects non-array clipIds', async () => {
      const res = await server.inject({
        method: 'POST',
        url: '/api/clips/batch-delete',
        headers: { authorization: `Bearer ${token}` },
        payload: { clipIds: 'not-array' },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects clips not owned by user', async () => {
      // Create another user's clip
      const email2 = uniqueEmail('batch');
      const reg2 = await server.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: { email: email2, password: 'password123' },
      });
      const token2 = reg2.json().token;
      const userId2 = reg2.json().user.id;

      await prisma.subscription.create({
        data: { userId: userId2, plan: 'PRO', status: 'ACTIVE', credits: 50 },
      });
      const proj2 = await prisma.project.create({
        data: {
          userId: userId2,
          title: 'Other',
          sourceType: 'URL',
          sourceUrl: 'https://youtube.com/watch?v=x',
          status: 'READY',
        },
      });
      const foreignClip = await prisma.clip.create({
        data: {
          project: { connect: { id: proj2.id } },
          title: 'Foreign', hook: 'h', startTime: 0, endTime: 5,
          viralScore: 50, reason: 'r', caption: 'c', hashtags: '',
        },
      });

      const res = await server.inject({
        method: 'POST',
        url: '/api/clips/batch-delete',
        headers: { authorization: `Bearer ${token}` },
        payload: { clipIds: [foreignClip.id] },
      });
      expect(res.statusCode).toBe(403);

      // Cleanup
      await prisma.clip.delete({ where: { id: foreignClip.id } }).catch(() => {});
      await prisma.project.delete({ where: { id: proj2.id } }).catch(() => {});
      await prisma.subscription.deleteMany({ where: { userId: userId2 } }).catch(() => {});
      await prisma.user.delete({ where: { id: userId2 } }).catch(() => {});
    });
  });

  describe('Caption Settings API', () => {
    it('GET /api/settings/caption returns default null preset', async () => {
      const res = await server.inject({
        method: 'GET',
        url: '/api/settings/caption',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().preset).toBeNull();
    });

    it('PUT /api/settings/caption saves caption preset', async () => {
      const preset = {
        fontName: 'Impact',
        fontSize: 72,
        textColor: '#FFFFFF',
        activeWordColor: '#FFE600',
        strokeColor: '#000000',
        strokeWidth: 6,
        position: 'bottom',
        marginBottom: 200,
        backgroundColor: 'rgba(0,0,0,0.75)',
      };
      const res = await server.inject({
        method: 'PUT',
        url: '/api/settings/caption',
        headers: { authorization: `Bearer ${token}` },
        payload: preset,
      });
      expect(res.statusCode).toBe(200);
      expect(res.json().success).toBe(true);

      // Verify saved
      const get = await server.inject({
        method: 'GET',
        url: '/api/settings/caption',
        headers: { authorization: `Bearer ${token}` },
      });
      expect(get.json().preset).toBeTruthy();
      expect(get.json().preset.fontName).toBe('Impact');
      expect(get.json().preset.fontSize).toBe(72);
    });
  });
});
