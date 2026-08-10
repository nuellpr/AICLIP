import { FastifyInstance } from 'fastify';
import { prisma } from '@clipforge/database';
import { Queue } from 'bullmq';
import youtubedl from 'youtube-dl-exec';
import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

const projectQueue = new Queue('projectQueue', { connection });
const renderQueue = new Queue('renderQueue', { connection });

export default async function routes(server: FastifyInstance) {
  server.get('/projects', async (request, reply) => {
    const query = request.query as { userId?: string };
    let userId = query?.userId;
    if (!userId) {
      const demoUser = await prisma.user.findFirst();
      userId = demoUser?.id;
    }

    const whereCondition = userId ? { userId } : {};

    const projects = await prisma.project.findMany({
      where: whereCondition,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { clips: true }
        }
      }
    });
    return projects;
  });

  server.post('/projects', async (request, reply) => {
    const { title, sourceUrl, sourceType, layoutMode, clipCount, targetDuration, searchQuery, aiProvider, aiModel } = request.body as any;
    
    // Pre-Flight Check for YouTube URLs
    if (sourceUrl && (sourceUrl.includes('youtube.com') || sourceUrl.includes('youtu.be'))) {
      try {
        console.log(`[Pre-Flight] Validating URL: ${sourceUrl}`);
        const metadata: any = await youtubedl(sourceUrl, {
          dumpJson: true,
          noCheckCertificates: true,
          noWarnings: true,
          extractorArgs: 'youtube:player_client=android,web'
        } as any);
        
        if (metadata.duration < 60) {
          return reply.code(400).send({ error: 'Video terlalu pendek (minimal 60 detik).' });
        }
        
        if (metadata.age_limit && metadata.age_limit > 0) {
          return reply.code(400).send({ error: 'Video ini dibatasi usia (Age Restricted) dan tidak dapat diakses.' });
        }
        
        const hasAutoSubs = metadata.automatic_captions && Object.keys(metadata.automatic_captions).length > 0;
        const hasSubs = metadata.subtitles && Object.keys(metadata.subtitles).length > 0;
        
        if (!hasAutoSubs && !hasSubs) {
          return reply.code(400).send({ error: 'Video ini tidak memiliki Auto-Subtitle dari YouTube. AI butuh teks untuk menganalisis momen.' });
        }
      } catch (err: any) {
        console.error('[Pre-Flight] Error:', err.message);
        return reply.code(400).send({ error: 'Video tidak ditemukan, atau bersifat Private.' });
      }
    }

    const body = request.body as any;
    let targetUserId = body.userId;

    if (!targetUserId) {
      const user = await prisma.user.upsert({
        where: { email: 'demo@clipforge.ai' },
        update: {},
        create: {
          email: 'demo@clipforge.ai',
          name: 'Demo User',
        }
      });
      targetUserId = user.id;
    }

    const project = await prisma.project.create({
      data: {
        userId: targetUserId,
        title: title || 'New Video Project',
        sourceType: sourceType || 'URL',
        sourceUrl: sourceUrl,
        layoutMode: layoutMode || 'crop_blur',
        clipCount: parseInt(clipCount) || 5,
        targetDuration: targetDuration || '30-60',
        searchQuery: searchQuery || null,
        aiProvider: aiProvider || null,
        aiModel: aiModel || null,
        status: 'QUEUED',
      }
    });

    // Add job to BullMQ queue
    await projectQueue.add('processProject', { projectId: project.id });

    return { projectId: project.id };
  });

  server.get('/projects/:id/progress', async (request, reply) => {
    const { id } = request.params as any;
    const project = await prisma.project.findUnique({
      where: { id },
      select: { status: true, progress: true, currentStage: true, errorMessage: true, clips: true }
    });

    if (!project) {
      return reply.code(404).send({ error: 'Project not found' });
    }

    return project;
  });

  server.get('/projects/:id/stream', async (request, reply) => {
    const { id } = request.params as any;
    
    reply.raw.setHeader('Content-Type', 'text/event-stream');
    reply.raw.setHeader('Cache-Control', 'no-cache');
    reply.raw.setHeader('Connection', 'keep-alive');

    const interval = setInterval(async () => {
      const project = await prisma.project.findUnique({
        where: { id },
        select: { status: true, progress: true, currentStage: true, errorMessage: true, clips: true }
      });
      if (project) {
        reply.raw.write(`data: ${JSON.stringify(project)}\n\n`);
        if (project.status === 'READY' || project.status === 'FAILED') {
          clearInterval(interval);
          reply.raw.end();
        }
      }
    }, 1000);

    request.raw.on('close', () => {
      clearInterval(interval);
    });
  });

  server.put('/clips/:id', async (request, reply) => {
    const { id } = request.params as any;
    const { title, hook, startTime, endTime, caption, subtitleStyle, subtitleOffset, captionPresetId, captionSettings, layoutMode } = request.body as any;

    const clip = await prisma.clip.update({
      where: { id },
      data: {
        title,
        hook,
        startTime: parseFloat(startTime),
        endTime: parseFloat(endTime),
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

  server.get('/clips/:id/words', async (request, reply) => {
    const { id } = request.params as any;
    const clip = await prisma.clip.findUnique({ where: { id }, include: { project: true } });
    if (!clip) return reply.code(404).send({ error: 'Clip not found' });

    const fs = require('fs');
    const path = require('path');
    const { parseYouTubeVttWords } = require('@clipforge/shared');

    // The VTT files are in apps/worker
    const workerDir = path.join(__dirname, '../../worker');
    if (!fs.existsSync(workerDir)) return reply.code(404).send({ error: 'Worker directory not found' });

    const files = fs.readdirSync(workerDir);
    let subFile = files.find((f: string) => f.startsWith(`transcript_${clip.projectId}_`) && f.endsWith('.id.vtt'));
    if (!subFile) subFile = files.find((f: string) => f.startsWith(`transcript_${clip.projectId}_`) && f.endsWith('.vtt'));
    
    if (!subFile) return reply.code(404).send({ error: 'VTT not found' });

    const vttContent = fs.readFileSync(path.join(workerDir, subFile), 'utf-8');
    const allWords = parseYouTubeVttWords(vttContent);
    
    // Filter to clip boundaries with a small padding
    const clipWords = allWords.filter((w: any) => w.end >= clip.startTime - 0.5 && w.start <= clip.endTime + 0.5);

    return clipWords;
  });

  server.post('/clips/:id/render', async (request, reply) => {
    const { id } = request.params as any;
    const clip = await prisma.clip.update({
      where: { id },
      data: { renderStatus: 'QUEUED' }
    });

    await renderQueue.add('renderClip', { clipId: clip.id });

    return clip;
  });

  server.get('/clips/library', async (request, reply) => {
    const clips = await prisma.clip.findMany({
      where: { renderStatus: 'READY' },
      include: { project: true },
      orderBy: { createdAt: 'desc' }
    });
    return clips;
  });

  server.delete('/clips/:id', async (request, reply) => {
    const { id } = request.params as any;
    try {
      const clip = await prisma.clip.findUnique({ where: { id } });
      if (clip) {
        const fs = require('fs');
        const path = require('path');
        const { exec } = require('child_process');
        const { promisify } = require('util');
        const execAsync = promisify(exec);

        const safeTitle = clip.title.replace(/[^a-zA-Z0-9 ]/g, "").trim() || clip.id;
        const filename = `${safeTitle}.mp4`;
        const filePath = path.join(__dirname, '../public/renders', filename);
        
        if (fs.existsSync(filePath)) {
          try {
            const escapedPath = filePath.replace(/'/g, "''");
            const psCommand = `Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile('${escapedPath}', 'OnlyErrorDialogs', 'SendToRecycleBin')`;
            await execAsync(`powershell -Command "${psCommand}"`);
          } catch (e) {
            try { fs.unlinkSync(filePath); } catch (err) {}
          }
        }
      }
      await prisma.clip.delete({ where: { id } });
      return { success: true };
    } catch (error) {
      reply.status(500).send({ error: 'Failed to delete clip' });
    }
  });

  server.post('/clips/batch-delete', async (request, reply) => {
    const { clipIds } = request.body as any;
    if (!Array.isArray(clipIds) || clipIds.length === 0) {
      return reply.code(400).send({ error: 'No clip IDs provided' });
    }

    try {
      const fs = require('fs');
      const path = require('path');
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      for (const id of clipIds) {
        const clip = await prisma.clip.findUnique({ where: { id } });
        if (clip) {
          const safeTitle = clip.title.replace(/[^a-zA-Z0-9 ]/g, "").trim() || clip.id;
          const filename = `${safeTitle}.mp4`;
          const filePath = path.join(__dirname, '../public/renders', filename);

          if (fs.existsSync(filePath)) {
            try {
              const escapedPath = filePath.replace(/'/g, "''");
              const psCommand = `Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile('${escapedPath}', 'OnlyErrorDialogs', 'SendToRecycleBin')`;
              await execAsync(`powershell -Command "${psCommand}"`);
            } catch (e) {
              try { fs.unlinkSync(filePath); } catch (err) {}
            }
          }
        }
      }

      await prisma.clip.deleteMany({
        where: { id: { in: clipIds } }
      });

      return { success: true, count: clipIds.length };
    } catch (error) {
      reply.status(500).send({ error: 'Failed to batch delete clips' });
    }
  });

  server.get('/settings/ai', async (request, reply) => {
    const fs = require('fs');
    const path = require('path');
    const configPath = path.resolve(__dirname, '../../../ai-config.json');
    if (fs.existsSync(configPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return config;
      } catch (e) {}
    }
    return {
      provider: 'google-gemini',
      baseUrl: '',
      apiKey: '',
      model: 'gemini-2.0-flash',
      systemMessage: ''
    };
  });

  server.post('/settings/ai', async (request, reply) => {
    const { provider, baseUrl, apiKey, model, systemMessage } = request.body as any;
    
    const fs = require('fs');
    const path = require('path');
    const configPath = path.resolve(__dirname, '../../../ai-config.json');
    
    const config = {
      provider: provider || 'google-gemini',
      baseUrl: baseUrl || '',
      apiKey: apiKey || '',
      model: model || '',
      systemMessage: systemMessage || ''
    };

    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    return { success: true };
  });

  server.post('/settings/ai/models', async (request, reply) => {
    const { provider, baseUrl, apiKey } = request.body as any;

    if (!apiKey && provider !== 'google-gemini') return { models: [] };

    if (provider === 'openai' || provider === 'groq' || provider === 'custom') {
      try {
        const { OpenAI } = require('openai');
        const openai = new OpenAI({ apiKey: apiKey, baseURL: baseUrl || undefined });
        const res = await openai.models.list();
        return { models: res.data.map((m: any) => m.id) };
      } catch (e: any) {
        return reply.code(500).send({ error: e.message });
      }
    } else if (provider === 'google-gemini') {
      return { models: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-3.1-flash', 'gemini-3.1-pro', 'gemini-3.5-flash', 'gemini-3.6-flash'] };
    }
    
    return { models: [] };
  });

  // Re-transcribe a clip using local Whisper for accurate subtitles
  server.post('/clips/:id/retranscribe', async (request, reply) => {
    const { id } = request.params as any;
    const clip = await prisma.clip.findUnique({ where: { id }, include: { project: true } });
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
      const safeTitle = clip.title.replace(/[^a-zA-Z0-9 ]/g, "").trim() || clip.id;
      const renderedPath = path.join(__dirname, '../public/renders', `${safeTitle}.mp4`);
      const audioPath = path.join(__dirname, `../temp_whisper_${id}.wav`);
      const whisperOutDir = path.join(__dirname, '../temp_whisper_out');

      if (!fs.existsSync(whisperOutDir)) {
        fs.mkdirSync(whisperOutDir, { recursive: true });
      }

      // Extract audio from rendered video, temp worker file, or download segment on the fly
      let sourceFile = renderedPath;
      let tempDlPath = path.join(__dirname, `../temp_dl_whisper_${id}.mp4`);

      if (!fs.existsSync(renderedPath) || fs.statSync(renderedPath).size < 1000) {
        const workerDir = path.join(__dirname, '../../worker');
        const tempFiles = fs.readdirSync(workerDir).filter((f: string) => f.startsWith(`temp_${id}`));
        if (tempFiles.length > 0) {
          sourceFile = path.join(workerDir, tempFiles[0]);
        } else if (clip.project.sourceUrl) {
          // Download audio segment directly from YouTube if clip is not rendered yet
          const youtubedl = require('youtube-dl-exec');
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
            noCheckCertificates: true
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
        const wordsPath = path.join(__dirname, `../public/renders/whisper_${id}.json`);
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
