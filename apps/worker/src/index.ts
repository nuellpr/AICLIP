import http from 'http';
import { prisma } from '@clipforge/database';
import youtubedl from 'youtube-dl-exec';
import ffmpeg from 'fluent-ffmpeg';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import 'dotenv/config';
import OpenAI from 'openai';
import { generateGoldenMoments } from './ai';
import { generateAssFromVtt } from './subtitle';
import { parseYouTubeVttWords, createYtThrottle } from '@clipforge/shared';
import { Worker, Queue } from 'bullmq';
import { startCleanupCron } from './cleanup';
import { generateHookIntro, concatHookAndClip } from './hookGenerator';
import { detectGpuEncoder, getEncoderOptions } from './gpuDetector';
import { uploadRenderedVideo } from './storage';
import { detectSfxTriggers, mixSfxIntoVideo } from './sfxEngine';
import { getFfmpegPath, getPythonPath } from './paths';
import Redis from 'ioredis';
import { spawn, ChildProcess } from 'child_process';

const execAsync = promisify(exec);

// ponytail: serialize yt-dlp calls per-process with 3s gap — YouTube throttles IPs that burst requests. per-process only; add Redis mutex for cross-process if traffic grows.
const throttledYtdl = createYtThrottle(youtubedl, 3000);

// ponytail: persistent whisper daemon — load base once per worker, reuse per clip (saves 15-20s/clip, best accuracy)
let whisperProc: ChildProcess | null = null;
let whisperReady = false;
let whisperQueue: { resolve: (v: any) => void; reject: (e: any) => void }[] = [];

function ensureWhisperDaemon(): ChildProcess {
  if (whisperProc && !whisperProc.killed && whisperReady) return whisperProc;
  if (whisperProc && !whisperProc.killed) { try { whisperProc.kill(); } catch {} }
  const py = getPythonPath();
  const script = path.join(__dirname, 'whisper_service.py');
  const env: any = { ...process.env };
  const ffmpegBin = getFfmpegPath();
  if (ffmpegBin !== 'ffmpeg') env.PATH = `${path.dirname(ffmpegBin)}${path.delimiter}${env.PATH}`;
  whisperProc = spawn(py, [script], { env, stdio: ['pipe', 'pipe', 'pipe'] });
  whisperReady = false;
  let buf = '';
  whisperProc.stdout?.on('data', (d: Buffer) => {
    buf += d.toString();
    let idx;
    while ((idx = buf.indexOf('\n')) !== -1) {
      const line = buf.slice(0, idx).trim();
      buf = buf.slice(idx + 1);
      if (!line) continue;
      if (line === 'READY') { whisperReady = true; continue; }
      const waiter = whisperQueue.shift();
      if (waiter) { try { waiter.resolve(JSON.parse(line)); } catch { waiter.resolve({ error: 'bad json: ' + line }); } }
    }
  });
  whisperProc.stderr?.on('data', (d: Buffer) => { console.log('[whisper]', d.toString().trim()); });
  whisperProc.on('exit', () => {
    whisperReady = false;
    whisperProc = null;
    // Jangan tinggalkan waiter menggantung — respons berikutnya (dari proses
    // baru) tidak boleh dikonsumsi waiter lama (FIFO mismatch → caption clip salah).
    const dead = whisperQueue;
    whisperQueue = [];
    dead.forEach(w => { try { w.reject(new Error('Whisper daemon exited')); } catch {} });
  });
  return whisperProc!;
}

async function transcribeWithDaemon(audioPath: string, timeoutMs = 300000): Promise<any> {
  const proc = ensureWhisperDaemon();
  // wait for READY max 90s on first load
  for (let i = 0; i < 90 && !whisperReady; i++) await new Promise(r => setTimeout(r, 1000));
  if (!whisperReady) throw new Error('Whisper daemon not ready');
  return new Promise((resolve, reject) => {
    const waiter = {
      resolve: (v: any) => { clearTimeout(timer); resolve(v); },
      reject: (e: any) => { clearTimeout(timer); reject(e); },
    };
    const timer = setTimeout(() => {
      // Lepas waiter dari queue supaya tidak mengonsumsi respons request lain,
      // lalu matikan daemon (state-nya stale; respawn di pemanggilan berikutnya).
      const i = whisperQueue.indexOf(waiter);
      if (i !== -1) whisperQueue.splice(i, 1);
      try { proc.kill(); } catch {}
      reject(new Error('Whisper daemon timeout'));
    }, timeoutMs);
    whisperQueue.push(waiter);
    proc.stdin!.write(audioPath.replace(/\\/g, '/') + '\n');
  });
}

ffmpeg.setFfmpegPath(getFfmpegPath());

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

const projectQueue = new Queue('projectQueue', { connection });
const renderQueue = new Queue('renderQueue', { connection });

const apiRenderDir = process.env.RENDERS_DIR || path.resolve(__dirname, '../../api/public/renders');
const webRenderDir = process.env.WEB_RENDERS_DIR || path.resolve(__dirname, '../../web/public/renders');

async function processProject(projectId: string) {
  console.log(`Started processing project ${projectId}`);

  
  const updateProgress = async (stage: string, progress: number) => {
    // Heartbeat: refresh lockedAt di setiap progress supaya recoverStuckJobs
    // (cron 15 menit) tidak me-requeue job yang masih berjalan (double processing).
    await prisma.project.update({
      where: { id: projectId },
      data: { currentStage: stage, progress, lockedAt: new Date() }
    });
    console.log(`Project ${projectId} - Stage: ${stage} (${progress}%)`);
  };

  try {
    // 1. TRANSCRIBING — ambil subtitle/transkripsi sumber (yt-dlp VTT untuk URL, Whisper lokal untuk upload)
    await updateProgress('TRANSCRIBING', 10);
    
    const projectData = await prisma.project.findUnique({ where: { id: projectId } });
    if (!projectData) throw new Error('Project not found');
    const isUpload = projectData.sourceType === 'UPLOAD';
    const uploadPath = isUpload && projectData.sourceFileKey
      ? path.resolve(__dirname, '../../api/uploads', projectData.sourceFileKey)
      : null;
    if (!isUpload && !projectData.sourceUrl) throw new Error('No source URL');
    if (isUpload && (!uploadPath || !fs.existsSync(uploadPath))) throw new Error('Uploaded file tidak ditemukan');

    let vttContent = '';

    if (isUpload) {
      // UPLOAD: transkripsi lokal via Whisper daemon (tanpa yt-dlp)
      console.log(`Transcribing uploaded file: ${uploadPath}`);
      const audioTmpPath = path.join(__dirname, `../temp_audio_${projectId}.wav`);
      try {
        await execAsync(`"${getFfmpegPath()}" -y -i "${uploadPath}" -vn -ac 1 -ar 16000 -f wav "${audioTmpPath}"`, { timeout: 300000 });
        const parsed = await transcribeWithDaemon(audioTmpPath);
        const words = (parsed && parsed.words) || [];
        if (words.length > 0) {
          const fmt = (s: number) => {
            if (s < 0) s = 0;
            const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = Math.floor(s % 60), cs = Math.floor((s % 1) * 1000);
            return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}.${String(cs).padStart(3, '0')}`;
          };
          vttContent = 'WEBVTT\n\n' + words.map((w: any, i: number) =>
            `${i + 1}\n${fmt(w.start)} --> ${fmt(w.end)}\n${w.text}\n`
          ).join('\n');
          fs.writeFileSync(path.join(__dirname, `../transcript_${projectId}_upload.vtt`), vttContent);
          console.log(`Upload transcription done: ${words.length} words`);
        }
      } catch (err: any) {
        console.warn('Upload transcription failed:', err.message);
      } finally {
        if (fs.existsSync(audioTmpPath)) fs.unlinkSync(audioTmpPath);
      }
    } else {
      const cookiesPath = path.join(__dirname, '../cookies.txt');
      const options: any = {
        writeAutoSubs: true,
        subLangs: 'id',
        skipDownload: true,
        subFormat: 'vtt',
        output: path.join(__dirname, `../transcript_${projectId}_%(id)s.%(ext)s`),
        noCheckCertificates: true,
        // ponytail: force IPv4 — VPS DNS resolves IPv6 first, IPv6 blackholes on YouTube (hang). -4 proven working.
        forceIpv4: true,
        jsRuntimes: 'bun,node',
        // ponytail: web_embedded first = 1080p DASH without PO token (verified); android fallback = 360p if not embeddable
        extractorArgs: 'youtube:player_client=web_embedded,android',
        impersonate: 'chrome',
        extractorRetries: 3,
        remoteComponents: 'ejs:github',
        noWarnings: true
      };
      if (fs.existsSync(cookiesPath)) {
        options.cookies = cookiesPath;
      }

      try {
        // ponytail: timeout subtitle fetch — yt-dlp can hang on YouTube bot detection; fall back to existing VTT if any
        await Promise.race([
          throttledYtdl(projectData.sourceUrl!, options),
          new Promise((_, rej) => setTimeout(() => rej(new Error('yt-dlp subtitle fetch timeout 120s')), 120000))
        ]);
      } catch (err: any) {
        console.warn("Youtubedl subtitle fetch warning:", err?.message || err);
      }
    }

    if (!vttContent) {
      // Find the downloaded vtt file (scoped to this project only)
      const files = fs.readdirSync(path.join(__dirname, '..'));
      const subFile = files.find(f => f.startsWith(`transcript_${projectId}_`) && f.endsWith('.vtt'));
      if (subFile) {
        vttContent = fs.readFileSync(path.join(__dirname, '..', subFile), 'utf-8');
      }
    }

    // 4. ANALYZING
    await updateProgress('ANALYZING', 40);
    
    let aiClips: any[] = [];
    let aiError: string | undefined;
    if (vttContent) {
      console.log('Skipping multimodal video download to speed up AI analysis (using VTT only)...');
      
      const clipCount = projectData.clipCount || 5;
      const targetDuration = (projectData as any).targetDuration || '30-60';
      const searchQuery = (projectData as any).searchQuery || '';
      
      const aiOverride = { provider: (projectData as any).aiProvider, model: (projectData as any).aiModel };
      
      // Pass undefined for videoFilePath so it only uses VTT text
      const result = await generateGoldenMoments(vttContent, clipCount, targetDuration, searchQuery, undefined, aiOverride, projectData.userId);
      aiClips = result.clips;
      aiError = result.error;
    }
    
    // 5. GENERATING_CLIPS
    await updateProgress('GENERATING_CLIPS', 70);

    // Reprocess guard: hapus clip lama agar restart/requeue tidak menduplikasi baris
    await prisma.clip.deleteMany({ where: { projectId } });

    if (aiClips && aiClips.length > 0) {
      for (const clipData of aiClips) {
        await prisma.clip.create({
          data: {
            projectId,
            title: clipData.title || 'Golden Moment',
            hook: clipData.hook || 'Watch this!',
            startTime: clipData.startTime,
            endTime: clipData.endTime,
            viralScore: clipData.viralScore || 85,
            reason: clipData.reason || 'AI generated',
            caption: clipData.caption || '',
            hashtags: "viral,ai,golden",
            layoutMode: projectData.layoutMode === 'auto' ? (clipData.layoutMode || 'fit_blur') : projectData.layoutMode,
            renderStatus: 'IDLE'
          }
        });
      }
    } else {
      // Fallback if AI fails or no subs
      const count = projectData.clipCount || 5;
      let failureReason: string;
      if (!vttContent) {
        failureReason = "Subtitles tidak ditemukan di YouTube untuk video ini.";
      } else if (aiError) {
        failureReason = `AI gagal: ${aiError}`;
      } else {
        failureReason = "AI API mengembalikan format yang salah atau terjadi error.";
      }
      
      for (let i = 1; i <= count; i++) {
        await prisma.clip.create({
          data: {
            projectId,
            title: `Gagal: Clip Viral ${i}`,
            hook: `(Gagal) Tahukah kamu rahasia ke-${i}?`,
            startTime: i * 10,
            endTime: (i * 10) + 30,
            viralScore: 50,
            reason: failureReason,
            caption: `Error: ${failureReason}`,
            hashtags: "error,clipforge",
            layoutMode: projectData.layoutMode === 'auto' ? 'fit_blur' : projectData.layoutMode,
            renderStatus: 'IDLE'
          }
        });
      }
    }

    await prisma.project.update({
      where: { id: projectId },
      data: { 
        status: 'READY', 
        currentStage: 'COMPLETED', 
        progress: 100,
        errorMessage: aiError || undefined,
        lockedAt: null
      }
    });

    console.log(`Finished processing project ${projectId}`);

  } catch (error: any) {
    await prisma.project.update({
      where: { id: projectId },
      data: { 
        status: 'FAILED', 
        errorCode: 'WORKER_ERROR', 
        errorMessage: error.message,
        lockedAt: null
      }
    });
    console.error(`Failed project ${projectId}: ${error.message}`);

    // Refund 1 kredit — proyek gagal tidak menghabiskan kredit user
    const proj = await prisma.project.findUnique({ where: { id: projectId }, select: { userId: true } });
    if (proj) {
      await prisma.subscription.updateMany({
        where: { userId: proj.userId },
        data: { credits: { increment: 1 } }
      });
      console.log(`Refunded 1 credit to user ${proj.userId} (project ${projectId} failed)`);
    }
  }
}

async function startConsumers() {
  const projectWorker = new Worker('projectQueue', async job => {
    if (job.name === 'processProject') {
      const { projectId } = job.data;

      // Atomic claim: hanya job pertama boleh mengklaim project (lockedAt null
      // + status QUEUED). Job duplikat dari recovery/startup akan skip.
      const claimed = await prisma.project.updateMany({
        where: { id: projectId, lockedAt: null, status: 'QUEUED' },
        data: { status: 'DOWNLOADING', lockedAt: new Date() }
      });
      if (claimed.count === 0) {
        console.log(`Project ${projectId} already claimed or not queued, skipping duplicate job`);
        return;
      }

      // Heartbeat: refresh lockedAt selama pipeline berjalan (AI call bisa >15 menit),
      // berhenti sendiri saat project READY/FAILED/di-requeue.
      const heartbeat = setInterval(async () => {
        const p = await prisma.project.findUnique({ where: { id: projectId }, select: { status: true } }).catch(() => null);
        if (!p || p.status === 'READY' || p.status === 'FAILED' || p.status === 'QUEUED') {
          clearInterval(heartbeat);
        } else {
          await prisma.project.update({ where: { id: projectId }, data: { lockedAt: new Date() } }).catch(() => {});
        }
      }, 4 * 60 * 1000);

      try {
        await processProject(projectId);
      } finally {
        clearInterval(heartbeat);
      }
    }
  }, { connection, concurrency: 1, lockDuration: 300000 });

  const renderWorker = new Worker('renderQueue', async job => {
    if (job.name === 'renderClip') {
      const { clipId } = job.data;
      const clip = await prisma.clip.findUnique({
        where: { id: clipId },
        include: { project: true }
      });
      if (clip && (clip.project.sourceUrl || (clip.project.sourceType === 'UPLOAD' && clip.project.sourceFileKey))) {
        console.log(`Started rendering clip ${clip.id} from ${clip.project.sourceUrl || clip.project.sourceFileKey}`);
        // Atomic claim: cegah render ganda saat job duplikat dari recovery/startup
        const claimed = await prisma.clip.updateMany({
          where: { id: clip.id, lockedAt: null, renderStatus: { in: ['QUEUED', 'IDLE', 'PENDING'] } },
          data: { renderStatus: 'RENDERING', lockedAt: new Date() }
        });
        if (claimed.count === 0) {
          console.log(`Clip ${clip.id} already claimed or not queued, skipping duplicate job`);
          return;
        }

        // Heartbeat render (render CPU bisa >15 menit), berhenti saat tidak lagi RENDERING
        const renderHeartbeat = setInterval(async () => {
          const c = await prisma.clip.findUnique({ where: { id: clip.id }, select: { renderStatus: true } }).catch(() => null);
          if (!c || c.renderStatus !== 'RENDERING') {
            clearInterval(renderHeartbeat);
          } else {
            await prisma.clip.update({ where: { id: clip.id }, data: { lockedAt: new Date() } }).catch(() => {});
          }
        }, 4 * 60 * 1000);

        // Nama file unik per clip: dua clip berjudul sama tidak saling menimpa
        const safeTitle = clip.title.replace(/[^a-zA-Z0-9 ]/g, "").trim() || clip.id;
        const filename = `${clip.id}-${safeTitle}.mp4`;
        
        if (!fs.existsSync(webRenderDir)) fs.mkdirSync(webRenderDir, { recursive: true });
        if (!fs.existsSync(apiRenderDir)) fs.mkdirSync(apiRenderDir, { recursive: true });

        const outputPath = path.join(webRenderDir, filename);
        const apiOutputPath = path.join(apiRenderDir, filename);
        const tempPath = path.join(__dirname, `../temp_${clip.id}.mp4`);
        const audioTmpPath = path.join(__dirname, `../temp_audio_${clip.id}.wav`);

        try {
          const clipStartSec = parseFloat(clip.startTime.toString());
          const clipEndSec = parseFloat(clip.endTime.toString());

          console.log(`Downloading segment... Start: ${clipStartSec}s, End: ${clipEndSec}s, Duration: ${clipEndSec - clipStartSec}s`);

          const isUploadRender = clip.project.sourceType === 'UPLOAD' && clip.project.sourceFileKey;
          const uploadVideoPath = isUploadRender
            ? path.resolve(__dirname, '../../api/uploads', clip.project.sourceFileKey!)
            : null;

          try {
            if (uploadVideoPath && fs.existsSync(uploadVideoPath)) {
              console.log('Slicing segment from uploaded file using native FFmpeg...');
              await execAsync(`"${getFfmpegPath()}" -y -ss ${clipStartSec} -i "${uploadVideoPath}" -t ${clipEndSec - clipStartSec} -c copy "${tempPath}"`);
            } else {
              const cookiesPath = path.join(__dirname, '../cookies.txt');
              const options: any = {
                downloadSections: `*${clipStartSec}-${clipEndSec}`,
                output: tempPath,
                format: 'bestvideo[height>=1080]+bestaudio/bestvideo[height>=720]+bestaudio/bestvideo+bestaudio/best',
                ffmpegLocation: getFfmpegPath(),
                jsRuntimes: 'bun,node',
                noCheckCertificates: true,
                forceIpv4: true,
                // ponytail: web_embedded = 1080p DASH w/o PO token (verified 137+140); android fallback = 360p if not embeddable
                extractorArgs: 'youtube:player_client=web_embedded,android',
                impersonate: 'chrome',
                extractorRetries: 3,
                retries: 3,
                remoteComponents: 'ejs:github',
                noWarnings: true
              };

              // ponytail: 120s timeout avoids BullMQ stalled-job duplicate (default lock 30s -> 5min now, but still guard)
              await Promise.race([
                throttledYtdl(clip.project.sourceUrl!, options),
                new Promise((_, rej) => setTimeout(() => rej(new Error('yt-dlp timeout 120s')), 120000))
              ]);
            }
          } catch (dlErr: any) {
            console.warn('yt-dlp section download failed, checking local file fallback:', dlErr.message);
            const sourceVideoPath = path.join(__dirname, `../temp_${clip.projectId}.mp4`);
            if (fs.existsSync(sourceVideoPath)) {
              console.log('Slicing segment from local source video using native FFmpeg...');
              await execAsync(`"${getFfmpegPath()}" -y -ss ${clipStartSec} -i "${sourceVideoPath}" -t ${clipEndSec - clipStartSec} -c copy "${tempPath}"`);
            } else {
              throw dlErr;
            }
          }

          // Find VTT file first
          const files = fs.readdirSync(path.join(__dirname, '..'));
          let subFile = files.find(f => f.startsWith(`transcript_${clip.projectId}_`) && f.endsWith('.id.vtt'));
          if (!subFile) subFile = files.find(f => f.startsWith(`transcript_${clip.projectId}_`) && f.endsWith('.vtt'));
          let vttContent = '';
          if (subFile) {
            vttContent = fs.readFileSync(path.join(__dirname, '..', subFile), 'utf-8');
          }

          const allWords = vttContent ? parseYouTubeVttWords(vttContent) : [];
          const clipWords = allWords.filter(w => w.end >= clipStartSec - 0.5 && w.start <= clipEndSec + 0.5);

          // Probe actual segment start to detect keyframe drift from yt-dlp
          let segmentDrift = 0;
          try {
            const { stdout: probeOut } = await execAsync(
              `"${getFfmpegPath()}" -i "${tempPath}" -f null - 2>&1 | head -20`,
              { timeout: 10000, encoding: 'utf-8' }
            );
            // Try ffprobe for more reliable start_time
            try {
              const ffprobePath = getFfmpegPath().replace(/ffmpeg(\.exe)?$/i, 'ffprobe$1');
              const { stdout: probeJson } = await execAsync(
                `"${ffprobePath}" -v quiet -print_format json -show_format "${tempPath}"`,
                { timeout: 10000, encoding: 'utf-8' }
              );
              const probeData = JSON.parse(probeJson);
              const actualStart = parseFloat(probeData?.format?.start_time || '0');
              if (actualStart > 0.05) {
                segmentDrift = actualStart;
                console.log(`Detected segment start drift: ${segmentDrift.toFixed(3)}s`);
              }
            } catch (probeErr) {
              // ffprobe not available, ignore
            }
          } catch (e) {}

          // Use VTT for fallback
          const wordsPath = path.join(apiRenderDir, `whisper_${clip.id}.json`);

          // Always run Whisper for micro-syncing precision on the final clip
          if (!fs.existsSync(wordsPath)) {
            let transcribed = false;
            
            try {
              console.log('VTT word coverage too low, running Whisper auto-transcription...');
              
              // Extract audio from downloaded segment
              await new Promise<void>((resolve, reject) => {
                ffmpeg(tempPath)
                  .noVideo()
                  .audioCodec('pcm_s16le')
                  .audioFrequency(16000)
                  .audioChannels(1)
                  .output(audioTmpPath)
                  .on('end', () => resolve())
                  .on('error', (err: any) => reject(err))
                  .run();
              });
              
              const indonesianPrompt = "Transkripsi bahasa Indonesia resmi dan akurat dengan ejaan baku. Kata-kata: uangnya, uang, sudah, tidak, bagaimana, seperti, kalau, memakai, hanya, dapat.";

              // Local Whisper via persistent daemon (best accuracy, fastest)
              try {
                const parsed = await transcribeWithDaemon(audioTmpPath);
                if (parsed.words && parsed.words.length > 0) {
                  // Normalize common phonetic misspellings & ASR hallucinations
                  const wordReplacements: Record<string, string> = {
                    'masyumasih': 'masing-masing',
                    'masyu-masih': 'masing-masing',
                    'masyumasik': 'masing-masing',
                    'wangnya': 'uangnya',
                    'wang': 'uang',
                    'wongnya': 'uangnya',
                    'wong': 'uang',
                    'sampe': 'sampai',
                    'sampek': 'sampai',
                    'dapet': 'dapat',
                    'dapetnya': 'dapatnya',
                    'kalo': 'kalau',
                    'berfikir': 'berpikir',
                    'fikir': 'pikir',
                  };
                  const cleanedWords = parsed.words.map((w: any) => {
                    const rawText = (w.text || '').trim();
                    const lowerText = rawText.toLowerCase().replace(/[.,!?\-]/g, '');
                    if (wordReplacements[lowerText]) {
                      const rep = wordReplacements[lowerText];
                      const punc = rawText.match(/[.,!?]+$/)?.[0] || '';
                      const isCap = rawText.length > 0 && rawText[0] === rawText[0].toUpperCase();
                      w.text = (isCap ? rep.charAt(0).toUpperCase() + rep.slice(1) : rep) + punc;
                    }
                    return w;
                  });

                  if (!fs.existsSync(path.dirname(wordsPath))) {
                    fs.mkdirSync(path.dirname(wordsPath), { recursive: true });
                  }
                  fs.writeFileSync(wordsPath, JSON.stringify(cleanedWords));
                  console.log(`Local Whisper complete: ${cleanedWords.length} words (normalized)`);
                  transcribed = true;
                }
              } catch (e: any) {
                console.warn('Local Whisper failed, trying OpenAI Whisper API:', e.message);
              }
              
              const whisperKey = process.env.B_AI_API_KEY || process.env.BAI_API_KEY || process.env.OPENAI_API_KEY;
              const whisperBase = process.env.B_AI_BASE_URL || process.env.BAI_BASE_URL || process.env.AI_BASE_URL || undefined;
              if (!transcribed && whisperKey) {
                try {
                  console.log(`Running Whisper API transcription via ${whisperBase || 'openai'}...`);
                  const openai = new OpenAI({ apiKey: whisperKey, baseURL: whisperBase });
                  const audioStream = fs.createReadStream(audioTmpPath);
                  
                  const transcript = await openai.audio.transcriptions.create({
                    file: audioStream,
                    model: 'whisper-1',
                    response_format: 'verbose_json',
                    timestamp_granularities: ['word'],
                    language: 'id',
                    prompt: indonesianPrompt,
                  });
                  
                  if (transcript.words && transcript.words.length > 0) {
                    if (!fs.existsSync(path.dirname(wordsPath))) {
                      fs.mkdirSync(path.dirname(wordsPath), { recursive: true });
                    }
                    fs.writeFileSync(wordsPath, JSON.stringify(transcript.words));
                    console.log(`OpenAI Whisper complete: ${transcript.words.length} words`);
                  }
                } catch (e: any) {
                  console.error('OpenAI Whisper failed:', e.message);
                }
              }
            } catch (err: any) {
              console.error('Audio extraction or transcription failed:', err.message);
            } finally {
              if (fs.existsSync(audioTmpPath)) fs.unlinkSync(audioTmpPath);
            }
          }

          let styleObj: any = { 
            fontName: 'Impact', 
            textColor: '#FFFFFF', 
            activeWordColor: '#FFFF00', // Sorotan kuning
            strokeColor: '#000000',
            strokeWidth: 4,
            animation: 'karaoke', 
            position: 'bottom', 
            marginBottom: 150,
            backgroundColor: 'rgba(0,0,0,0.85)' // Tambahkan background gelap untuk menutupi teks bawaan video
          };
          try {
            if (clip.captionSettings) {
              const userStyles = JSON.parse(clip.captionSettings as string);
              styleObj = { ...styleObj, ...userStyles };
            }
          } catch(e) {}

          const hasWhisperWords = fs.existsSync(wordsPath);
          let whisperWords: any[] = [];
          if (hasWhisperWords) {
            try {
              whisperWords = JSON.parse(fs.readFileSync(wordsPath, 'utf-8'));
            } catch (e) {}
          }

          const clipDurationSec = clipEndSec - clipStartSec;
          // If whisper returned reasonable word coverage (at least 1 word per 4 seconds)
          if (whisperWords && whisperWords.length >= Math.max(3, Math.floor(clipDurationSec / 4))) {
            styleObj.words = whisperWords;
            styleObj.offset = 0;
            console.log(`Using frame-accurate Whisper timestamps (${whisperWords.length} words, offset=0s)`);
          } else {
            console.log(`Whisper word count low (${whisperWords.length} words for ${clipDurationSec.toFixed(1)}s clip), using VTT fallback...`);
            delete styleObj.words;
            const subtitlePreShift = -0.35;
            styleObj.offset = (styleObj.offset || 0) + subtitlePreShift - segmentDrift;
          }

          const assPath = path.join(__dirname, `../temp_${clip.id}.ass`);
          if (clip.caption) styleObj.caption = clip.caption;
          await generateAssFromVtt(vttContent, clipStartSec, clipEndSec, assPath, styleObj);
          
          const relativeAssPath = path.relative(process.cwd(), assPath).replace(/\\/g, '/');
          const formattedAssPath = relativeAssPath;
          const projectLayout = clip.project.layoutMode || 'fit_blur';
          const rawLayout = projectLayout === 'auto' ? (clip.layoutMode || 'fit_blur') : projectLayout;
          const layoutMode = rawLayout === 'auto' ? 'fit_blur' : rawLayout;

          let faceCmdPath: string | null = null;
          if (layoutMode === 'face') {
            try {
              faceCmdPath = path.join(__dirname, `../temp_cmds_${clip.id}.txt`);
              console.log('Running face tracking for dynamic crop...');
              const pythonBin = getPythonPath();
              
              // Try MediaPipe first (better active speaker tracking), fallback to OpenCV
              const mediapipeTrackerPy = [
                path.join(__dirname, 'mediapipe_tracker.py'),
                path.join(__dirname, '../src/mediapipe_tracker.py'),
                path.join(__dirname, 'src/mediapipe_tracker.py')
              ].find(p => fs.existsSync(p));
              
              const faceTrackerPy = [
                path.join(__dirname, 'face_tracker.py'),
                path.join(__dirname, '../src/face_tracker.py'),
                path.join(__dirname, 'src/face_tracker.py')
              ].find(p => fs.existsSync(p)) || path.join(__dirname, 'face_tracker.py');
              
              let trackingSuccess = false;
              
              // Try MediaPipe first
              if (mediapipeTrackerPy) {
                try {
                  console.log('Attempting MediaPipe active speaker tracking...');
                  await execAsync(`"${pythonBin}" "${mediapipeTrackerPy}" "${tempPath.replace(/\\/g, '/')}" "${faceCmdPath.replace(/\\/g, '/')}" 608 1080 0.15`, { timeout: 180000 });
                  trackingSuccess = fs.existsSync(faceCmdPath) && fs.statSync(faceCmdPath).size > 10;
                  if (trackingSuccess) console.log('MediaPipe tracking succeeded');
                } catch (mpErr: any) {
                  console.warn('MediaPipe tracking failed, falling back to OpenCV:', mpErr.message);
                }
              }
              
              // Fallback to OpenCV
              if (!trackingSuccess) {
                console.log('Using OpenCV face tracking...');
                await execAsync(`"${pythonBin}" "${faceTrackerPy}" "${tempPath.replace(/\\/g, '/')}" "${faceCmdPath.replace(/\\/g, '/')}" 608 1080 0.1`, { timeout: 120000 });
              }
            } catch (err) {
              console.error('Face tracking failed, falling back to center crop', err);
              faceCmdPath = null;
            }
          }

          // Detect GPU encoder for faster rendering
          const gpuEncoder = await detectGpuEncoder();
          const encoderOpts = getEncoderOptions(gpuEncoder);
          console.log(`Using encoder: ${gpuEncoder.name} (${gpuEncoder.codec})`);

          await new Promise((resolve, reject) => {
            let command = ffmpeg(tempPath);
            
            let filterComplex: any[] = [];
            
            switch (layoutMode) {
              case 'crop_blur':
                filterComplex = [
                  { filter: 'split', options: '2', inputs: '0:v', outputs: ['original', 'copy'] },
                  { filter: 'scale', options: '270:480:force_original_aspect_ratio=increase', inputs: 'copy', outputs: 'copy_scaled' },
                  { filter: 'crop', options: '270:480', inputs: 'copy_scaled', outputs: 'copy_cropped' },
                  { filter: 'boxblur', options: '5:1', inputs: 'copy_cropped', outputs: 'blurred_small' },
                  { filter: 'scale', options: '1080:1920', inputs: 'blurred_small', outputs: 'blurred' },
                  { filter: 'crop', options: 'ih:ih:iw/2-ih/2:0', inputs: 'original', outputs: 'sq_crop' },
                  { filter: 'scale', options: '1080:1080', inputs: 'sq_crop', outputs: 'sq_scaled' },
                  { filter: 'overlay', options: '0:(1920-1080)/2', inputs: ['blurred', 'sq_scaled'], outputs: 'with_overlay' },
                  { filter: 'subtitles', options: formattedAssPath, inputs: 'with_overlay', outputs: 'final' }
                ];
                break;
              case 'split':
                filterComplex = [
                  { filter: 'split', options: '2', inputs: '0:v', outputs: ['top', 'bottom'] },
                  { filter: 'crop', options: 'ih:ih:0:0', inputs: 'top', outputs: 'top_crop' },
                  { filter: 'scale', options: '1080:960:force_original_aspect_ratio=increase', inputs: 'top_crop', outputs: 'top_scaled' },
                  { filter: 'crop', options: '1080:960', inputs: 'top_scaled', outputs: 'top_final' },
                  { filter: 'crop', options: 'ih:ih:iw-ih:0', inputs: 'bottom', outputs: 'bot_crop' }, 
                  { filter: 'scale', options: '1080:960:force_original_aspect_ratio=increase', inputs: 'bot_crop', outputs: 'bot_scaled' },
                  { filter: 'crop', options: '1080:960', inputs: 'bot_scaled', outputs: 'bot_final' },
                  { filter: 'vstack', options: '', inputs: ['top_final', 'bot_final'], outputs: 'stacked' },
                  { filter: 'subtitles', options: formattedAssPath, inputs: 'stacked', outputs: 'final' }
                ];
                break;
              case 'gameplay':
                filterComplex = [
                  { filter: 'split', options: '2', inputs: '0:v', outputs: ['game', 'face'] },
                  { filter: 'scale', options: '1080:1200:force_original_aspect_ratio=increase', inputs: 'game', outputs: 'game_scaled' },
                  { filter: 'crop', options: '1080:1200', inputs: 'game_scaled', outputs: 'game_final' },
                  { filter: 'crop', options: 'ih:ih:iw/2-ih/2:0', inputs: 'face', outputs: 'face_crop' },
                  { filter: 'scale', options: '1080:720:force_original_aspect_ratio=increase', inputs: 'face_crop', outputs: 'face_scaled' },
                  { filter: 'crop', options: '1080:720', inputs: 'face_scaled', outputs: 'face_final' },
                  { filter: 'vstack', options: '', inputs: ['game_final', 'face_final'], outputs: 'stacked' },
                  { filter: 'subtitles', options: formattedAssPath, inputs: 'stacked', outputs: 'final' }
                ];
                break;
              case 'face':
                if (faceCmdPath && fs.existsSync(faceCmdPath)) {
                  const relativeCmd = path.relative(process.cwd(), faceCmdPath).replace(/\\/g, '/');
                  filterComplex = [
                    { filter: 'sendcmd', options: `f=${relativeCmd}`, inputs: '0:v', outputs: 'cmd_out' },
                    { filter: 'crop', options: 'ih*9/16:ih:x=(in_w-ih*9/16)/2:y=0', inputs: 'cmd_out', outputs: 'cropped' },
                    { filter: 'scale', options: '1080:1920', inputs: 'cropped', outputs: 'scaled' },
                    { filter: 'subtitles', options: formattedAssPath, inputs: 'scaled', outputs: 'final' }
                  ];
                } else {
                  filterComplex = [
                    { filter: 'crop', options: 'ih*9/16:ih:iw/2-ih*9/32:0', inputs: '0:v', outputs: 'cropped' },
                    { filter: 'scale', options: '1080:1920', inputs: 'cropped', outputs: 'scaled' },
                    { filter: 'subtitles', options: formattedAssPath, inputs: 'scaled', outputs: 'final' }
                  ];
                }
                break;
              case 'fit_blur':
              default:
                filterComplex = [
                  { filter: 'split', options: '2', inputs: '0:v', outputs: ['original', 'copy'] },
                  { filter: 'scale', options: '270:480:force_original_aspect_ratio=increase', inputs: 'copy', outputs: 'copy_scaled' },
                  { filter: 'crop', options: '270:480', inputs: 'copy_scaled', outputs: 'copy_cropped' },
                  { filter: 'boxblur', options: '5:1', inputs: 'copy_cropped', outputs: 'blurred_small' },
                  { filter: 'scale', options: '1080:1920', inputs: 'blurred_small', outputs: 'blurred' },
                  { filter: 'scale', options: '1080:1920:force_original_aspect_ratio=decrease', inputs: 'original', outputs: 'scaled' },
                  { filter: 'overlay', options: '(W-w)/2:(H-h)/2', inputs: ['blurred', 'scaled'], outputs: 'with_overlay' },
                  { filter: 'subtitles', options: formattedAssPath, inputs: 'with_overlay', outputs: 'final' }
                ];
                break;
            }

            command = command.complexFilter(filterComplex, 'final');

            command
              .outputOptions([
                '-map', '0:a?',
                '-threads', '0'
              ])
              .outputOptions(encoderOpts)
              .outputOptions('-c:a aac')
              .outputOptions('-b:a 192k')
              .output(outputPath)
              .on('end', () => resolve(true))
              .on('error', (err) => {
                console.error('FFmpeg render error:', err);
                reject(err);
              })
              .run();
          });

          if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
          if (fs.existsSync(assPath)) fs.unlinkSync(assPath);
          if (faceCmdPath && fs.existsSync(faceCmdPath)) fs.unlinkSync(faceCmdPath);

          // Generate Hook Intro and prepend to clip
          let hookDuration = 0;
          if (clip.hook && clip.hook.trim().length > 5 && !clip.hook.startsWith('(Gagal)')) {
            try {
              console.log(`Generating hook intro for clip ${clip.id}: "${clip.hook.substring(0, 50)}..."`);
              const hookVideoPath = await generateHookIntro({
                hookText: clip.hook,
                outputPath: path.join(path.dirname(outputPath), `hook_${clip.id}.mp4`),
                backgroundClipPath: fs.existsSync(outputPath) ? outputPath : undefined,
              });
              
              if (hookVideoPath) {
                try {
                  const ffprobePath = getFfmpegPath().replace(/ffmpeg(\.exe)?$/i, 'ffprobe$1');
                  const { stdout: hookProbe } = await execAsync(
                    `"${ffprobePath}" -v quiet -print_format json -show_format "${hookVideoPath}"`,
                    { timeout: 10000, encoding: 'utf-8' }
                  );
                  hookDuration = parseFloat(JSON.parse(hookProbe)?.format?.duration || '0') || 0;
                  console.log(`Hook intro duration: ${hookDuration.toFixed(2)}s`);
                } catch (e) {}
                const tempWithHook = outputPath.replace('.mp4', '_with_hook.mp4');
                const concatSuccess = await concatHookAndClip(hookVideoPath, outputPath, tempWithHook);
                if (concatSuccess && fs.existsSync(tempWithHook)) {
                  fs.unlinkSync(outputPath);
                  fs.renameSync(tempWithHook, outputPath);
                  console.log(`Hook intro prepended to clip ${clip.id}`);
                }
              }
            } catch (hookErr: any) {
              console.warn(`Hook generation skipped for clip ${clip.id}:`, hookErr.message);
            }
          }

          // Auto Sound Effects (SFX) Engine
          try {
            const whisperWords = styleObj.words || [];
            const sfxEvents = detectSfxTriggers(whisperWords, clip.hook);
            if (hookDuration > 0) {
              for (const evt of sfxEvents) evt.timestampSec += hookDuration;
            }
            if (sfxEvents.length > 0) {
              console.log(`Mixing ${sfxEvents.length} SFX sound effects for clip ${clip.id}...`);
              const tempWithSfx = outputPath.replace('.mp4', '_with_sfx.mp4');
              const sfxSuccess = await mixSfxIntoVideo(outputPath, sfxEvents, tempWithSfx);
              if (sfxSuccess && fs.existsSync(tempWithSfx)) {
                fs.unlinkSync(outputPath);
                fs.renameSync(tempWithSfx, outputPath);
                console.log(`SFX sound effects mixed into clip ${clip.id}`);
              }
            }
          } catch (sfxErr: any) {
            console.warn(`SFX mixing skipped for clip ${clip.id}:`, sfxErr.message);
          }

          if (fs.existsSync(outputPath)) {
            try {
              fs.copyFileSync(outputPath, apiOutputPath);
            } catch (e) {}
          }

          const finalFileKey = await uploadRenderedVideo(outputPath, filename);

          await prisma.clip.update({
            where: { id: clip.id },
            data: { 
              renderStatus: 'READY',
              renderedFileKey: finalFileKey,
              lockedAt: null
            }
          });
          console.log(`Finished rendering clip ${clip.id} -> ${finalFileKey}`);
        } catch (err: any) {
          console.error(`Failed to render clip ${clip.id}`, err);
          await prisma.clip.update({
            where: { id: clip.id },
            data: { renderStatus: 'FAILED', lockedAt: null }
          });
        }
      }
    }
  }, { connection, concurrency: 1, lockDuration: 300000 });

  console.log('BullMQ Workers started for projectQueue and renderQueue');
}

// Function to recover jobs that are stuck for more than 15 minutes
async function recoverStuckJobs() {
  try {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

    // Recover stuck Projects
    const stuckProjects = await prisma.project.findMany({
      where: {
        status: { in: ['DOWNLOADING', 'EXTRACTING_AUDIO', 'TRANSCRIBING', 'ANALYZING', 'GENERATING_CLIPS'] },
        lockedAt: { lt: fifteenMinsAgo }
      }
    });

    for (const p of stuckProjects) {
      console.log(`Recovering stuck project ${p.id}... re-enqueueing to QUEUED`);
      await prisma.project.update({
        where: { id: p.id },
        data: { status: 'QUEUED', currentStage: null, lockedAt: null }
      });
      await projectQueue.add('processProject', { projectId: p.id }, {
        jobId: `processProject:${p.id}`,
        removeOnComplete: true,
        removeOnFail: true
      });
    }

    // Recover stuck Clips
    const stuckClips = await prisma.clip.findMany({
      where: {
        renderStatus: 'RENDERING',
        lockedAt: { lt: fifteenMinsAgo }
      }
    });

    for (const c of stuckClips) {
      console.log(`Recovering stuck clip ${c.id}... re-enqueueing to QUEUED`);
      await prisma.clip.update({
        where: { id: c.id },
        data: { renderStatus: 'QUEUED', lockedAt: null }
      });
      await renderQueue.add('renderClip', { clipId: c.id }, {
        jobId: `renderClip:${c.id}`,
        removeOnComplete: true,
        removeOnFail: true
      });
    }
  } catch (err) {
    console.error('Recover stuck jobs error:', err);
  } finally {
    setTimeout(recoverStuckJobs, 5 * 60 * 1000); // Run every 5 minutes
  }
}

// Reset any stuck rendering clips from a previous crash back to QUEUED and re-enqueue
Promise.all([
  prisma.clip.updateMany({
    where: { renderStatus: 'RENDERING' },
    data: { renderStatus: 'QUEUED', lockedAt: null }
  }),
  prisma.project.updateMany({
    where: { status: { in: ['DOWNLOADING', 'EXTRACTING_AUDIO', 'TRANSCRIBING', 'ANALYZING', 'GENERATING_CLIPS'] } },
    data: { status: 'QUEUED', lockedAt: null }
  })
]).then(async (results) => {
  console.log('Worker started, polling for QUEUED projects & clips...');
  const [, projectUpdate] = results;

  // Re-enqueue projects reset to QUEUED
  const queuedProjects = await prisma.project.findMany({
    where: { status: 'QUEUED' },
    select: { id: true },
    take: 100
  });
  for (const p of queuedProjects) {
    // jobId dedup: job dengan id sama yang masih ada di Redis tidak ditambahkan ulang
    await projectQueue.add('processProject', { projectId: p.id }, {
      jobId: `processProject:${p.id}`,
      removeOnComplete: true,
      removeOnFail: true
    });
  }

  // Re-enqueue clips reset to QUEUED
  const queuedClips = await prisma.clip.findMany({
    where: { renderStatus: 'QUEUED' },
    select: { id: true },
    take: 200
  });
  for (const c of queuedClips) {
    await renderQueue.add('renderClip', { clipId: c.id }, {
      jobId: `renderClip:${c.id}`,
      removeOnComplete: true,
      removeOnFail: true
    });
  }

  startConsumers();
  startCleanupCron();
  recoverStuckJobs();
});

const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('ok');
  }
});
server.listen(3002, () => console.log('Worker health check on port 3002'));
