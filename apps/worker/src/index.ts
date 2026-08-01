import http from 'http';
import { prisma } from '@clipforge/database';
import youtubedl from 'youtube-dl-exec';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import path from 'path';
import fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import 'dotenv/config';
import OpenAI from 'openai';
import { generateGoldenMoments } from './ai';
import { generateAssFromVtt } from './subtitle';
import { parseYouTubeVttWords } from '@clipforge/shared';
import { Worker } from 'bullmq';
import { startCleanupCron } from './cleanup';
import Redis from 'ioredis';

const execAsync = promisify(exec);

const getFfmpegPath = () => {
  if (ffmpegStatic && fs.existsSync(ffmpegStatic as string)) {
    return ffmpegStatic as string;
  }
  return 'ffmpeg';
};

const getPythonPath = (): string => {
  const candidates = ['python', 'python3', 'py'];
  for (const cmd of candidates) {
    try {
      const result = require('child_process').execSync(`${cmd} --version`, { encoding: 'utf-8', stdio: 'pipe' });
      if (result) return cmd;
    } catch (_) {}
  }
  return 'python';
};

ffmpeg.setFfmpegPath(getFfmpegPath());

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
    
    // Find the downloaded vtt file
    const files = fs.readdirSync(path.join(__dirname, '..'));
    let subFile = files.find(f => f.startsWith(`transcript_${projectId}_`) && f.endsWith('.vtt'));
    if (!subFile) subFile = files.find(f => f.endsWith('.vtt'));
    
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
      const result = await generateGoldenMoments(vttContent, clipCount, targetDuration, searchQuery, undefined, aiOverride);
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
  const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
  const connection = new Redis(redisUrl, { maxRetriesPerRequest: null });

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
        const outputPath = path.join(__dirname, `../../api/public/renders/${filename}`);
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
            format: 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4][height<=1080]/best',
            ffmpegLocation: getFfmpegPath(),
            forceKeyframesAtCuts: true,
            jsRuntimes: 'node',
            noCheckCertificates: true,
            extractorArgs: 'youtube:player_client=android,web',
            noWarnings: true
          };
          await youtubedl(clip.project.sourceUrl, options);

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

          // Use VTT for fallback
          const wordsPath = path.join(__dirname, `../../api/public/renders/whisper_${clip.id}.json`);

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
              
              // Local Whisper with Python
              try {
                const pythonBin = getPythonPath();
                const env: any = { ...process.env };
                const ffmpegBin = getFfmpegPath();
                if (ffmpegBin !== 'ffmpeg') {
                  env.PATH = `${path.dirname(ffmpegBin)}${path.delimiter}${env.PATH}`;
                }
                const antiBakuPrompt = "Gunakan bahasa sehari-hari gaul tidak baku. Contoh: gak nggak udah dah bikin gimana kayak kalo nyampe lu gue banget pake doang sih dong kok deh loh mah aja kan tuh yak gih";
                const { stdout } = await execAsync(
                  `"${pythonBin}" -c "import whisper; model=whisper.load_model('small'); r=model.transcribe('${audioTmpPath.replace(/\\/g, '/')}', word_timestamps=True, fp16=False, verbose=False, initial_prompt='${antiBakuPrompt}'); import json; print(json.dumps({'text': r['text'], 'words': [{'text': w['word'], 'start': round(w['start'],3), 'end': round(w['end'],3)} for s in r['segments'] for w in s.get('words',[])]}))"`,
                  { timeout: 300000, encoding: 'utf-8', maxBuffer: 1024 * 1024 * 10, env }
                );
                
                const jsonStart = stdout.indexOf('{');
                if (jsonStart === -1) throw new Error('No JSON output found from Whisper');
                const parsed = JSON.parse(stdout.substring(jsonStart).trim());
                if (parsed.words && parsed.words.length > 0) {
                  if (!fs.existsSync(path.dirname(wordsPath))) {
                    fs.mkdirSync(path.dirname(wordsPath), { recursive: true });
                  }
                  fs.writeFileSync(wordsPath, JSON.stringify(parsed.words));
                  console.log(`Local Whisper small complete: ${parsed.words.length} words`);
                  transcribed = true;
                }
              } catch (e: any) {
                console.warn('Local Whisper failed, trying OpenAI Whisper API:', e.message);
              }
              
              if (!transcribed && process.env.OPENAI_API_KEY) {
                try {
                  console.log('Running OpenAI Whisper API transcription...');
                  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
                  const audioStream = fs.createReadStream(audioTmpPath);
                  
                  const transcript = await openai.audio.transcriptions.create({
                    file: audioStream,
                    model: 'whisper-1',
                    response_format: 'verbose_json',
                    timestamp_granularities: ['word'],
                    language: 'id',
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

          if (fs.existsSync(wordsPath)) {
            const whisperWords = JSON.parse(fs.readFileSync(wordsPath, 'utf-8'));
            styleObj.words = whisperWords;
            const userCaption = clip.caption?.trim();
            const hasWhisperWords = styleObj.words && Array.isArray(styleObj.words) && styleObj.words.length > 0;
            if (userCaption && hasWhisperWords) {
              const whisperFullText = styleObj.words.map((w: any) => w.text).join(' ').toLowerCase().replace(/[^\w\s]/g, '');
              const userFullText = userCaption.toLowerCase().replace(/[^\w\s]/g, '');
              const lenDiff = Math.abs(whisperFullText.length - userFullText.length);
              if (lenDiff > 5 && lenDiff < whisperFullText.length * 2 && whisperFullText !== userFullText) {
                console.log('User caption detected, using edited text for subtitles');
                const userWords = userCaption.split(/\s+/).filter((w: string) => w.length > 0);
                if (styleObj.words.length >= userWords.length) {
                  const step = Math.max(1, Math.floor(styleObj.words.length / userWords.length));
                  const newWords: any[] = [];
                  for (let i = 0; i < userWords.length; i++) {
                    const srcIdx = Math.min(i * step, styleObj.words.length - 1);
                    newWords.push({
                      text: userWords[i],
                      start: styleObj.words[srcIdx].start,
                      end: styleObj.words[Math.min(srcIdx + step - 1, styleObj.words.length - 1)].end
                    });
                  }
                  styleObj.words = newWords;
                }
              }
            }
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
              await execAsync(`"${pythonBin}" "${path.join(__dirname, 'face_tracker.py')}" "${tempPath.replace(/\\/g, '/')}" "${faceCmdPath.replace(/\\/g, '/')}" 608 1080 0.1`, { timeout: 120000 });
            } catch (err) {
              console.error('Face tracking failed, falling back to center crop', err);
              faceCmdPath = null;
            }
          }

          await new Promise((resolve, reject) => {
            let command = ffmpeg(tempPath);
            
            let filterComplex: any[] = [];
            
            switch (layoutMode) {
              case 'crop_blur':
                filterComplex = [
                  { filter: 'split', options: '2', inputs: '0:v', outputs: ['original', 'copy'] },
                  { filter: 'scale', options: '1080:1920:force_original_aspect_ratio=increase', inputs: 'copy', outputs: 'copy_scaled' },
                  { filter: 'crop', options: '1080:1920', inputs: 'copy_scaled', outputs: 'copy_cropped' },
                  { filter: 'boxblur', options: '20:1', inputs: 'copy_cropped', outputs: 'blurred' },
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
                  { filter: 'scale', options: '1080:1920:force_original_aspect_ratio=increase', inputs: 'copy', outputs: 'copy_scaled' },
                  { filter: 'crop', options: '1080:1920', inputs: 'copy_scaled', outputs: 'copy_cropped' },
                  { filter: 'boxblur', options: '20:1', inputs: 'copy_cropped', outputs: 'blurred' },
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
              .outputOptions('-c:v libx264')
              .outputOptions('-preset fast')
              .outputOptions('-crf 23')
              .outputOptions('-c:a aac')
              // Audio Polish: loudnorm (Podcast loudness standard) and highpass (noise reduction)
              .outputOptions('-af', 'highpass=f=150,loudnorm=I=-16:TP=-1.5:LRA=11')
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

          await prisma.clip.update({
            where: { id: clip.id },
            data: { 
              renderStatus: 'READY',
              renderedFileKey: `/renders/${filename}`,
              lockedAt: null
            }
          });
          console.log(`Finished rendering clip ${clip.id}`);
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
      console.log(`Recovering stuck project ${p.id}... resetting to QUEUED`);
      await prisma.project.update({
        where: { id: p.id },
        data: { status: 'QUEUED', currentStage: null, lockedAt: null }
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
      console.log(`Recovering stuck clip ${c.id}... resetting to QUEUED`);
      await prisma.clip.update({
        where: { id: c.id },
        data: { renderStatus: 'QUEUED', lockedAt: null }
      });
    }
  } catch (err) {
    console.error('Recover stuck jobs error:', err);
  } finally {
    setTimeout(recoverStuckJobs, 5 * 60 * 1000); // Run every 5 minutes
  }
}

// Reset any stuck rendering clips from a previous crash back to QUEUED
Promise.all([
  prisma.clip.updateMany({
    where: { renderStatus: 'RENDERING' },
    data: { renderStatus: 'QUEUED', lockedAt: null }
  }),
  prisma.project.updateMany({
    where: { status: { in: ['DOWNLOADING', 'EXTRACTING_AUDIO', 'TRANSCRIBING', 'ANALYZING', 'GENERATING_CLIPS'] } },
    data: { status: 'QUEUED', lockedAt: null }
  })
]).then(() => {
  console.log('Worker started, polling for QUEUED projects & clips...');
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
