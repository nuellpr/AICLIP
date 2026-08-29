import { FastifyInstance } from 'fastify';
import { prisma } from '@clipforge/database';
import { Queue } from 'bullmq';
import youtubedl from 'youtube-dl-exec';
import Redis from 'ioredis';
import path from 'path';
import fs from 'fs';
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { authenticate, sseAuthenticate, getUserId, loadOwnedClip } from './guards';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

const projectQueue = new Queue('projectQueue', { connection });
const renderQueue = new Queue('renderQueue', { connection });

const rendersDir = process.env.RENDERS_DIR || path.join(__dirname, '../public/renders');
const workerDir = process.env.WORKER_DIR || path.join(__dirname, '../../worker');
const webRendersDir = path.resolve(__dirname, '../../web/public/renders');

// Hapus permanen semua salinan video klip: lokal (api + web renders) dan cloud S3/R2 bila ada.
async function deleteClipAssets(clip: { id: string; title: string; renderedFileKey?: string | null }): Promise<void> {
  const safeTitle = clip.title.replace(/[^a-zA-Z0-9 ]/g, '').trim() || clip.id;
  const names = new Set<string>([`${safeTitle}.mp4`]);
  const base = clip.renderedFileKey?.split('/').pop();
  if (base) names.add(decodeURIComponent(base));

  for (const filename of names) {
    for (const dir of [rendersDir, webRendersDir]) {
      const filePath = path.join(dir, filename);
      try {
        if (fs.existsSync(filePath)) fs.rmSync(filePath, { force: true });
      } catch {}
    }
  }

  if (clip.renderedFileKey?.startsWith('http') && process.env.S3_BUCKET_NAME) {
    const key = clip.renderedFileKey.split('/renders/')[1];
    if (key) {
      try {
        const s3 = new S3Client({
          region: process.env.S3_REGION || 'auto',
          ...(process.env.S3_ENDPOINT ? { endpoint: process.env.S3_ENDPOINT } : {}),
          credentials: {
            accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
          },
        });
        await s3.send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: `renders/${key}` }));
      } catch (e: any) {
        console.warn('[Delete] Gagal hapus file cloud:', e.message);
      }
    }
  }
}

export default async function routes(server: FastifyInstance) {
  // Upload video source (raw octet-stream body, no multipart dependency needed)
  server.post('/upload', { preHandler: [authenticate], bodyLimit: 500 * 1024 * 1024 }, async (request, reply) => {
    const userId = getUserId(request);
    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const fileKey = `${Date.now()}_${userId.slice(0, 8)}.mp4`;
    const dest = path.join(uploadsDir, fileKey);

    await new Promise<void>((resolve, reject) => {
      const ws = fs.createWriteStream(dest);
      request.raw.pipe(ws);
      ws.on('finish', resolve);
      ws.on('error', reject);
      request.raw.on('error', reject);
    });

    const size = fs.statSync(dest).size;
    return { fileKey, size };
  });

  server.get('/projects', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = getUserId(request);

    const projects = await prisma.project.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { clips: true }
        }
      }
    });
    return projects;
  });

  server.post('/projects', { preHandler: [authenticate] }, async (request, reply) => {
    const { title, sourceUrl, sourceType, sourceFileKey, layoutMode, clipCount, targetDuration, searchQuery, aiProvider, aiModel } = request.body as any;

    const targetUserId = getUserId(request);

    // Validasi sourceFileKey (fail-fast sebelum potong kredit): hanya nama file
    // yang dibuat endpoint /upload (server-generated), tanpa path/traversal.
    let validatedFileKey: string | null = null;
    if (sourceFileKey) {
      const key = String(sourceFileKey);
      const isSafeKey = /^[\w][\w.-]{0,120}\.(mp4|mov|mkv|webm|avi|m4v)$/i.test(key) && path.basename(key) === key;
      const uploadsDir = path.resolve(__dirname, '../uploads');
      const fileExists = isSafeKey && fs.existsSync(path.join(uploadsDir, key));
      if (!fileExists) {
        return reply.code(400).send({ error: 'sourceFileKey tidak valid atau file upload tidak ditemukan' });
      }
      validatedFileKey = key;
    }

    if (sourceType === 'UPLOAD' && !validatedFileKey) {
      return reply.code(400).send({ error: 'Upload diperlukan untuk sourceType UPLOAD' });
    }

    // 1 kredit = 1 proyek (1 URL YouTube). Potong atomik, tolak jika kredit habis.
    const deducted = await prisma.subscription.updateMany({
      where: { userId: targetUserId, credits: { gte: 1 } },
      data: { credits: { decrement: 1 } }
    });

    if (deducted.count === 0) {
      return reply.code(402).send({
        error: 'Kredit Anda telah habis (0 Kredit). Silakan lakukan Top-Up atau beli paket di menu Langganan & Tagihan.'
      });
    }

    const project = await prisma.project.create({
      data: {
        userId: targetUserId,
        title: title || 'New Video Project',
        sourceType: sourceType || 'URL',
        sourceUrl: sourceUrl,
        sourceFileKey: validatedFileKey,
        layoutMode: layoutMode || 'crop_blur',
        clipCount: parseInt(clipCount) || 3,
        targetDuration: targetDuration || '30-60',
        searchQuery: searchQuery || null,
        aiProvider: aiProvider || null,
        aiModel: aiModel || null,
        status: 'QUEUED',
      }
    });

    // Add job to BullMQ queue (jobId dedup: job sama tidak ditambahkan dua kali)
    await projectQueue.add('processProject', { projectId: project.id }, {
      jobId: `processProject:${project.id}`,
      removeOnComplete: true,
      removeOnFail: true
    });

    return { projectId: project.id };
  });

  server.get('/projects/:id/progress', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const userId = getUserId(request);
    const project = await prisma.project.findUnique({
      where: { id },
      select: { userId: true, status: true, progress: true, currentStage: true, errorMessage: true, sourceUrl: true, clips: true }
    });

    if (!project) {
      return reply.code(404).send({ error: 'Project not found' });
    }
    if (project.userId !== userId) {
      return reply.code(403).send({ error: 'Akses ditolak' });
    }

    const { userId: _ownerId, ...safeProject } = project;
    return safeProject;
  });

  server.get('/projects/:id/stream', { preHandler: [sseAuthenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const userId = getUserId(request);

    const owner = await prisma.project.findUnique({
      where: { id },
      select: { userId: true }
    });
    if (!owner) {
      return reply.code(404).send({ error: 'Project not found' });
    }
    if (owner.userId !== userId) {
      return reply.code(403).send({ error: 'Akses ditolak' });
    }
    
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');

    let elapsed=0;
    const interval = setInterval(async () => {
      elapsed+=1000;
      if (elapsed>300000) { clearInterval(interval); try{ reply.raw.end(); }catch(e){} return; }
      try {
        const project = await prisma.project.findUnique({
          where: { id },
          select: { status: true, progress: true, currentStage: true, errorMessage: true, sourceUrl: true, clips: true }
        });
        if (project) {
          reply.raw.write(`data: ${JSON.stringify(project)}\n\n`);
          if (project.status === 'READY' || project.status === 'FAILED') {
            clearInterval(interval);
            reply.raw.end();
          }
        }
      } catch (e) { /* ignore SSE poll errors */ }
    }, 1000);

    request.raw.on('close', () => {
      clearInterval(interval);
    });
  });

  server.put('/clips/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const userId = getUserId(request);
    const { title, hook, startTime, endTime, caption, subtitleStyle, subtitleOffset, captionPresetId, captionSettings, layoutMode } = request.body as any;

    const owned = await loadOwnedClip(id, userId);
    if (!owned) return reply.code(404).send({ error: 'Clip not found' });

    const s = parseFloat(startTime), e = parseFloat(endTime);
    if (startTime !== undefined && (isNaN(s) || s < 0)) return reply.code(400).send({error:'startTime tidak valid'});
    if (endTime !== undefined && (isNaN(e) || e < 0)) return reply.code(400).send({error:'endTime tidak valid'});
    if (!isNaN(s) && !isNaN(e) && e <= s) return reply.code(400).send({error:'endTime harus > startTime'});
    if (!isNaN(s) && !isNaN(e) && e - s > 600) return reply.code(400).send({error:'Durasi clip maksimal 10 menit'});

    const clip = await prisma.clip.update({
      where: { id },
      data: {
        title,
        hook,
        startTime: startTime !== undefined ? s : undefined,
        endTime: endTime !== undefined ? e : undefined,
        caption,
        subtitleStyle,
        subtitleOffset: subtitleOffset !== undefined ? parseFloat(subtitleOffset) : undefined,
        captionPresetId,
        captionSettings: captionSettings ? JSON.stringify(captionSettings) : undefined,
        layoutMode
      }
    });

    return clip;
  });

  server.get('/clips/:id/words', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const userId = getUserId(request);
    const clip = await loadOwnedClip(id, userId);
    if (!clip) return reply.code(404).send({ error: 'Clip not found' });

    const fs = require('fs');
    const path = require('path');
    const { parseYouTubeVttWords, createYtThrottle } = require('@clipforge/shared');

    // 1. Check if custom edited/whisper JSON file exists first
    const whisperFile = path.join(rendersDir, `whisper_${id}.json`);
    if (fs.existsSync(whisperFile)) {
      try {
        const whisperWords = JSON.parse(fs.readFileSync(whisperFile, 'utf-8'));
        if (Array.isArray(whisperWords) && whisperWords.length > 0) {
          return whisperWords;
        }
      } catch (e) {}
    }

    // 2. Fallback to VTT file
    if (!fs.existsSync(workerDir)) return [];

    const files = fs.readdirSync(workerDir);
    let subFile = files.find((f: string) => f.startsWith(`transcript_${clip.projectId}_`) && f.endsWith('.id.vtt'));
    if (!subFile) subFile = files.find((f: string) => f.startsWith(`transcript_${clip.projectId}_`) && f.endsWith('.vtt'));
    
    if (!subFile) return [];

    const vttContent = fs.readFileSync(path.join(workerDir, subFile), 'utf-8');
    const allWords = parseYouTubeVttWords(vttContent);
    const clipWords = allWords.filter((w: any) => w.end >= clip.startTime - 0.5 && w.start <= clip.endTime + 0.5);

    return clipWords;
  });

  server.put('/clips/:id/words', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const userId = getUserId(request);
    const { words } = request.body as { words: any[] };

    if (!Array.isArray(words)) {
      return reply.code(400).send({ error: 'Words must be an array' });
    }
    if (words.length > 5000) return reply.code(400).send({error:'Words terlalu banyak (max 5000)'});
    for (const w of words) { if (!w || typeof w.text !== 'string' || typeof w.start !== 'number' || typeof w.end !== 'number' || isNaN(w.start) || isNaN(w.end) || w.start < 0 || w.end <= w.start) return reply.code(400).send({error:'Word tidak valid'}); }

    const owned = await loadOwnedClip(id, userId);
    if (!owned) return reply.code(404).send({ error: 'Clip not found' });

    const fs = require('fs');
    const path = require('path');
    if (!fs.existsSync(rendersDir)) {
      fs.mkdirSync(rendersDir, { recursive: true });
    }

    const whisperFile = path.join(rendersDir, `whisper_${id}.json`);
    fs.writeFileSync(whisperFile, JSON.stringify(words, null, 2), 'utf-8');

    // Also update caption summary in database
    const newCaptionText = words.map(w => w.text).join(' ');
    await prisma.clip.update({
      where: { id },
      data: { caption: newCaptionText }
    });

    return { success: true, count: words.length };
  });

  server.post('/clips/:id/render', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const userId = getUserId(request);
    const owned = await loadOwnedClip(id, userId);
    if (!owned) return reply.code(404).send({ error: 'Clip not found' });

    const clip = await prisma.clip.update({
      where: { id },
      data: { renderStatus: 'QUEUED' }
    });

    await renderQueue.add('renderClip', { clipId: clip.id }, {
      jobId: `renderClip:${clip.id}`,
      removeOnComplete: true,
      removeOnFail: true
    });

    return clip;
  });

  server.get('/clips/library', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = getUserId(request);

    const clips = await prisma.clip.findMany({
      where: { 
        renderStatus: 'READY',
        project: { userId }
      },
      include: { project: true },
      orderBy: { createdAt: 'desc' }
    });
    return clips;
  });

  server.delete('/clips/:id', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const userId = getUserId(request);
    try {
      const owned = await loadOwnedClip(id, userId);
      if (!owned) return reply.code(404).send({ error: 'Clip not found' });
      const clip = owned;

      await deleteClipAssets(clip);
      await prisma.clip.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      reply.status(500).send({ error: 'Failed to delete clip' });
    }
  });

  server.post('/clips/batch-delete', { preHandler: [authenticate] }, async (request, reply) => {
    const { clipIds } = request.body as any;
    const userId = getUserId(request);
    if (!Array.isArray(clipIds) || clipIds.length === 0) {
      return reply.code(400).send({ error: 'No clip IDs provided' });
    }

    try {
      // Verify all clips belong to user
      const ownedClips = await prisma.clip.findMany({
        where: { id: { in: clipIds } },
        include: { project: { select: { userId: true } } },
      });
      if (ownedClips.length !== clipIds.length || ownedClips.some(c => c.project.userId !== userId)) {
        return reply.code(403).send({ error: 'Akses ditolak' });
      }

      for (const clip of ownedClips) {
        await deleteClipAssets(clip);
      }
      await prisma.clip.deleteMany({
        where: { id: { in: clipIds } }
      });

      return { success: true, count: clipIds.length };
    } catch (error) {
      reply.status(500).send({ error: 'Failed to batch delete clips' });
    }
  });

  server.get('/settings/ai', { preHandler: [authenticate] }, async (request, reply) => {
    const userId = getUserId(request);
    const fs = require('fs');
    const path = require('path');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    let config: any = null;
    if (user && (user as any).role === 'ADMIN') {
      const configPath = path.resolve(__dirname, '../../../ai-config.json');
      if (fs.existsSync(configPath)) {
        try { config = JSON.parse(fs.readFileSync(configPath, 'utf-8')); } catch (e) {}
      }
    } else {
      const userConfigPath = path.resolve(__dirname, `../../../ai-config_${userId}.json`);
      if (fs.existsSync(userConfigPath)) {
        try { config = JSON.parse(fs.readFileSync(userConfigPath, 'utf-8')); } catch (e) {}
      }
    }

    // Key server selalu dari env — tidak pernah dikembalikan/ditampilkan ke website
    const serverKey = !!(process.env.B_AI_API_KEY || process.env.BAI_API_KEY || process.env.AI_API_KEY || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY);

    return {
      provider: config?.provider || 'b-ai',
      // baseUrl HANYA dari env — baseUrl dari user tidak pernah dipakai server
      // (mencegah SSRF/kebocoran API key server ke URL arbitrer).
      baseUrl: process.env.B_AI_BASE_URL || '',
      apiKey: '',
      apiKeySet: serverKey,
      model: process.env.B_AI_MODEL || config?.model || '',
      systemMessage: config?.systemMessage || ''
    };
  });

  server.post('/settings/ai', { preHandler: [authenticate] }, async (request, reply) => {
    const { provider, baseUrl, model, systemMessage } = request.body as any;
    const userId = getUserId(request);

    const fs = require('fs');
    const path = require('path');

    const user = await prisma.user.findUnique({ where: { id: userId } });
    const isAdmin = !!(user && (user as any).role === 'ADMIN');
    const configPath = path.resolve(__dirname, isAdmin ? '../../../ai-config.json' : `../../../ai-config_${userId}.json`);

    let existing: any = {};
    if (fs.existsSync(configPath)) {
      try { existing = JSON.parse(fs.readFileSync(configPath, 'utf-8')); } catch (e) {}
    }

    // apiKey TIDAK diterima dari client — key selalu dari env server (B_AI_*)
    // baseUrl TIDAK disimpan — server selalu pakai env (anti SSRF/key exfil)
    const config = {
      provider: provider || existing.provider || 'b-ai',
      model: model || existing.model || '',
      systemMessage: systemMessage !== undefined ? systemMessage : (existing.systemMessage || '')
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Admin also gets a per-user copy for backwards compatibility
    if (isAdmin) {
      const userConfigPath = path.resolve(__dirname, `../../../ai-config_${userId}.json`);
      fs.writeFileSync(userConfigPath, JSON.stringify(config, null, 2));
    }

    return { success: true };
  });

  server.post('/settings/ai/models', { preHandler: [authenticate] }, async (request, reply) => {
    const { provider } = request.body as any;
    // baseUrl dari body diabaikan sepenuhnya (anti SSRF) — server key/base
    // selalu dari env.
    const envBase = process.env.B_AI_BASE_URL || undefined;

    // b-ai pakai daftar model gratis server — tanpa key dari client
    if (provider === 'b-ai') {
      return { models: ['mimo-v2.5', 'deepseek-v4-flash', 'hy3', 'vision-exp'] };
    }

    // Untuk provider lain, pakai server key dari env
    const envKey = process.env.B_AI_API_KEY || process.env.BAI_API_KEY || process.env.AI_API_KEY || process.env.OPENAI_API_KEY;
    const apiKey = envKey;

    if (!apiKey && provider !== 'google-gemini') return { models: [] };

    if (provider === 'openai' || provider === 'groq' || provider === 'custom') {
      try {
        const { OpenAI } = require('openai');
        const openai = new OpenAI({ apiKey: apiKey, baseURL: envBase });
        const res = await openai.models.list();
        return { models: res.data.map((m: any) => m.id) };
      } catch (e: any) {
        return reply.code(500).send({ error: e.message });
      }
    } else if (provider === 'google-gemini') {
      return { models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro'] };
    }
    
    return { models: [] };
  });

  // Re-transcribe a clip using local Whisper for accurate subtitles
  server.post('/clips/:id/retranscribe', { preHandler: [authenticate] }, async (request, reply) => {
    const { id } = request.params as any;
    const userId = getUserId(request);
    const clip = await loadOwnedClip(id, userId);
    if (!clip) return reply.code(404).send({ error: 'Clip not found' });

    try {
      const path = require('path');
      const fs = require('fs');
      const util = require('util');
      const { exec } = require('child_process');
      const execAsync = util.promisify(exec);

      // Normalize timestamps (ms -> seconds if needed)
      let startSec = clip.startTime;
      let endSec = clip.endTime;
      const clipDuration = endSec - startSec;
      if ((startSec > 10000 && clipDuration < 600) || startSec > 100000) {
        startSec = startSec / 1000;
        endSec = endSec / 1000;
      }

      // Find the rendered file to extract audio from
      // Format baru `<clipId>-<title>.mp4` (worker), fallback `<title>.mp4` (render lama)
      const safeTitle = clip.title.replace(/[^a-zA-Z0-9 ]/g, "").trim() || clip.id;
      const newRenderedPath = path.join(rendersDir, `${clip.id}-${safeTitle}.mp4`);
      const renderedPath = fs.existsSync(newRenderedPath)
        ? newRenderedPath
        : path.join(rendersDir, `${safeTitle}.mp4`);
      const audioPath = path.join(__dirname, `../temp_whisper_${id}.wav`);
      const whisperOutDir = path.join(__dirname, '../temp_whisper_out');

      if (!fs.existsSync(whisperOutDir)) {
        fs.mkdirSync(whisperOutDir, { recursive: true });
      }

      // Extract audio from rendered video, temp worker file, or download segment on the fly
      let sourceFile = renderedPath;
      let tempDlPath = path.join(__dirname, `../temp_dl_whisper_${id}.mp4`);

      if (!fs.existsSync(renderedPath) || fs.statSync(renderedPath).size < 1000) {
        const tempFiles = fs.readdirSync(workerDir).filter((f: string) => f.startsWith(`temp_${id}`));
        if (tempFiles.length > 0) {
          sourceFile = path.join(workerDir, tempFiles[0]);
        } else if (clip.project.sourceUrl) {
          // Download audio segment directly from YouTube if clip is not rendered yet
          const { createYtThrottle } = require('@clipforge/shared');
          const youtubedl = createYtThrottle(require('youtube-dl-exec'), 3000);
          const ffmpegStatic = require('ffmpeg-static');
          const getFfmpegPath = () => {
            if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
              return ffmpegStatic;
            }
            return 'ffmpeg';
          };
          const cookiesPath = path.join(workerDir, 'cookies.txt');
          const options: any = {
            downloadSections: `*${startSec}-${endSec}`,
            output: tempDlPath,
            format: 'bestaudio/best',
            ffmpegLocation: getFfmpegPath(),
            jsRuntimes: 'node',
            noCheckCertificates: true,
            extractorRetries: 3
          };
          if (fs.existsSync(cookiesPath)) {
            options.cookies = cookiesPath;
          }
          await youtubedl(clip.project.sourceUrl, options);
          sourceFile = tempDlPath;
        } else {
          return reply.code(400).send({ error: 'Tidak ada URL video YouTube untuk mengunduh audio transkripsi.' });
        }
      }

      // Extract audio using ffmpeg-static
      const ffmpegStatic = require('ffmpeg-static');
      const ffmpegBin = (ffmpegStatic && fs.existsSync(ffmpegStatic)) ? ffmpegStatic : 'ffmpeg';

      try {
        await execAsync(`"${ffmpegBin}" -y -i "${sourceFile}" -vn -acodec pcm_s16le -ar 16000 -ac 1 "${audioPath}"`, { timeout: 60000 });
      } catch (e: any) {
        if (fs.existsSync(tempDlPath)) fs.unlinkSync(tempDlPath);
        return reply.code(500).send({ error: 'Gagal mengekstrak audio: ' + e.message });
      }

      // Cleanup temp download if created
      if (fs.existsSync(tempDlPath)) fs.unlinkSync(tempDlPath);

      // Run Whisper via dedicated python script
      const scriptPath = path.join(__dirname, 'whisper_transcribe.py');
      let whisperResult = '';
      try {
        const env = { ...process.env };
        if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
          env.PATH = `${path.dirname(ffmpegStatic)}${path.delimiter}${env.PATH}`;
        }

        const { stdout } = await execAsync(
          `python "${scriptPath}" "${audioPath}"`,
          { timeout: 300000, encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10, env }
        );
        whisperResult = stdout;
      } catch (e: any) {
        if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
        
        let details = e.message;
        if (e.stdout) details += `\nSTDOUT: ${e.stdout}`;
        if (e.stderr) details += `\nSTDERR: ${e.stderr}`;
        console.error('Whisper exec error:', details);

        return reply.code(500).send({ 
          error: 'Transkripsi Whisper gagal: ' + details
        });
      }

      // Cleanup audio
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);

      // Parse result
      let parsed: any = {};
      try {
        parsed = JSON.parse(whisperResult.trim());
      } catch (e) {
        return reply.code(500).send({ error: 'Gagal membaca output Whisper', raw: whisperResult });
      }

      if (parsed.error) {
        return reply.code(500).send({ error: 'Error Whisper: ' + parsed.error });
      }

      const newCaption = parsed.text || '';

      // Save whisper words to a file so worker can use them
      if (parsed.words && parsed.words.length > 0) {
        const wordsPath = path.join(rendersDir, `whisper_${id}.json`);
        if (!fs.existsSync(path.dirname(wordsPath))) {
          fs.mkdirSync(path.dirname(wordsPath), { recursive: true });
        }
        fs.writeFileSync(wordsPath, JSON.stringify(parsed.words));
      }

      // Update clip caption in database
      await prisma.clip.update({
        where: { id },
        data: { caption: newCaption.trim() }
      });

      return { 
        success: true, 
        caption: newCaption.trim(),
        words: parsed.words || [],
        message: 'Caption updated with Whisper transcription'
      };
    } catch (e: any) {
      return reply.code(500).send({ error: e.message });
    }
  });
}
