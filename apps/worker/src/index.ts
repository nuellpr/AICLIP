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
import { parseYouTubeVttWords } from '@clipforge/shared';
import { Worker, Queue } from 'bullmq';
import { startCleanupCron } from './cleanup';
import { generateHookIntro, concatHookAndClip } from './hookGenerator';
import { detectGpuEncoder, getEncoderOptions } from './gpuDetector';
import { getWatermarkFilters, parseWatermarkConfig } from './watermark';
import { detectSfxTriggers, mixSfxIntoVideo } from './sfxEngine';
import { uploadRenderedVideo } from './storage';
import { getFfmpegPath, getPythonPath } from './paths';
import Redis from 'ioredis';
import { spawn, ChildProcess } from 'child_process';

const execAsync = promisify(exec);

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
  whisperProc.on('exit', () => { whisperReady = false; whisperProc = null; });
  return whisperProc!;
}

async function transcribeWithDaemon(audioPath: string, timeoutMs = 300000): Promise<any> {
  const proc = ensureWhisperDaemon();
  // wait for READY max 90s on first load
  for (let i = 0; i < 90 && !whisperReady; i++) await new Promise(r => setTimeout(r, 1000));
  if (!whisperReady) throw new Error('Whisper daemon not ready');
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Whisper daemon timeout')), timeoutMs);
    whisperQueue.push({ resolve: (v) => { clearTimeout(timer); resolve(v); }, reject: (e) => { clearTimeout(timer); reject(e); } });
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
    await prisma.project.update({
      where: { id: projectId },
      data: { currentStage: stage, progress }
    });
    console.log(`Project ${projectId} - Stage: ${stage} (${progress}%)`);
  };

  try {
    // 1. DOWNLOADING
    await updateProgress('DOWNLOADING', 10);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 2. EXTRACTING_AUDIO
    await updateProgress('EXTRACTING_AUDIO', 30);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 3. TRANSCRIBING
    await updateProgress('TRANSCRIBING', 50);
    const cookiesPath = path.join(__dirname, '../cookies.txt');
    const options: any = {
      writeAutoSubs: true,
      subLangs: 'id',
      skipDownload: true,
      subFormat: 'vtt',
      output: path.join(__dirname, `../transcript_${projectId}_%(id)s.%(ext)s`),
      noCheckCertificates: true,
      jsRuntimes: 'node',
      extractorArgs: 'youtube:player_client=android,web',
      noWarnings: true
    };
    if (fs.existsSync(cookiesPath)) {
      options.cookies = cookiesPath;
    }

    const projectData = await prisma.project.findUnique({ where: { id: projectId } });
    if (!projectData || !projectData.sourceUrl) throw new Error('No source URL');

    try {
      await youtubedl(projectData.sourceUrl, options);
    } catch (err: any) {
      console.warn("Youtubedl subtitle fetch warning:", err?.message || err);
    }
    
    // Find the downloaded vtt file (scoped to this project only)
    const files = fs.readdirSync(path.join(__dirname, '..'));
    const subFile = files.find(f => f.startsWith(`transcript_${projectId}_`) && f.endsWith('.vtt'));
    
    let vttContent = '';
    if (subFile) {
      vttContent = fs.readFileSync(path.join(__dirname, '..', subFile), 'utf-8');
    }

    // 4. ANALYZING
    await updateProgress('ANALYZING', 70);
    
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
    await updateProgress('GENERATING_CLIPS', 90);
    
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
  }
}

async function startConsumers() {
  const projectWorker = new Worker('projectQueue', async job => {
    if (job.name === 'processProject') {
      const { projectId } = job.data;
      
      // Update DB status to DOWNLOADING
      await prisma.project.update({
        where: { id: projectId },
        data: { status: 'DOWNLOADING', lockedAt: new Date() }
      });
      
      await processProject(projectId);
    }
  }, { connection, concurrency: 1 });

  const renderWorker = new Worker('renderQueue', async job => {
    if (job.name === 'renderClip') {
      const { clipId } = job.data;
      const clip = await prisma.clip.findUnique({
        where: { id: clipId },
        include: { project: true }
      });
      if (clip && clip.project.sourceUrl) {
        console.log(`Started rendering clip ${clip.id} from ${clip.project.sourceUrl}`);
        await prisma.clip.update({
          where: { id: clip.id },
          data: { renderStatus: 'RENDERING', lockedAt: new Date() }
        });

        const safeTitle = clip.title.replace(/[^a-zA-Z0-9 ]/g, "").trim() || clip.id;
        const filename = `${safeTitle}.mp4`;
        
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
          const cookiesPath = path.join(__dirname, '../cookies.txt');
          const options: any = {
            downloadSections: `*${clipStartSec}-${clipEndSec}`,
            output: tempPath,
            format: 'bestvideo[height>=1080]+bestaudio/bestvideo[height>=720]+bestaudio/bestvideo+bestaudio/best',
            ffmpegLocation: getFfmpegPath(),
            jsRuntimes: 'node',
            noCheckCertificates: true,
            extractorArgs: 'youtube:player_client=android,web',
            noWarnings: true
          };

          try {
            await youtubedl(clip.project.sourceUrl, options);
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
          if (clip.hook && clip.hook.trim().length > 5 && !clip.hook.startsWith('(Gagal)')) {
            try {
              console.log(`Generating hook intro for clip ${clip.id}: "${clip.hook.substring(0, 50)}..."`);
              const hookVideoPath = await generateHookIntro({
                hookText: clip.hook,
                outputPath: path.join(path.dirname(outputPath), `hook_${clip.id}.mp4`),
              });
              
              if (hookVideoPath) {
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
  }, { connection, concurrency: 2 });

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
      await projectQueue.add('processProject', { projectId: p.id });
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
      await renderQueue.add('renderClip', { clipId: c.id });
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
    await projectQueue.add('processProject', { projectId: p.id });
  }

  // Re-enqueue clips reset to QUEUED
  const queuedClips = await prisma.clip.findMany({
    where: { renderStatus: 'QUEUED' },
    select: { id: true },
    take: 200
  });
  for (const c of queuedClips) {
    await renderQueue.add('renderClip', { clipId: c.id });
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
