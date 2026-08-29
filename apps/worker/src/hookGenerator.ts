import fs from 'fs';
import path from 'path';
import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import { getFfmpegPath, getPythonPath, getFontPath } from './paths';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

export interface HookOptions {
  hookText: string;
  outputPath: string;
  backgroundClipPath?: string; // klip utama — frame-nya dipakai sebagai background hook
  duration?: number; // seconds, default 4
  voice?: string; // edge-tts voice, default 'id-ID-ArdiNeural'
  fontSize?: number;
  textColor?: string;
  bgColor1?: string;
  bgColor2?: string;
  width?: number; // target output width, default 1080
  height?: number; // target output height, default 1920
}

/**
 * Generate a TTS audio file from hook text using edge-tts (Python)
 */
async function generateTTS(text: string, outputAudioPath: string, voice: string = 'id-ID-ArdiNeural'): Promise<boolean> {
  // SECURITY: hookText berasal dari LLM (rawan prompt injection) — teks TIDAK
  // PERNAH diinterpolasi ke string shell. Semua call pakai execFile (argv
  // array, tanpa shell) dengan teks sebagai argumen/file sementara.
  const textArg = text.replace(/\n/g, ' ');

  // Method 1: Try edge-tts CLI tool directly
  try {
    await execFileAsync(
      'edge-tts',
      ['--voice', voice, '--text', textArg, '--write-media', outputAudioPath],
      { timeout: 30000, windowsHide: true }
    );
    if (fs.existsSync(outputAudioPath) && fs.statSync(outputAudioPath).size > 100) {
      console.log('Edge-TTS CLI generated audio successfully');
      return true;
    }
  } catch (cliErr: any) {
    // CLI tool not in PATH, fallback to Python module
  }

  // Method 2: Python edge_tts module — teks dibaca dari file sementara
  try {
    const pythonBin = getPythonPath();
    const textFile = `${outputAudioPath}.txt`;
    fs.writeFileSync(textFile, textArg, 'utf-8');
    try {
      await execFileAsync(
        pythonBin,
        [
          '-c',
          "import asyncio,sys,edge_tts; asyncio.run(edge_tts.Communicate(open(sys.argv[1],encoding='utf-8').read(), sys.argv[2]).save(sys.argv[3]))",
          textFile,
          voice,
          outputAudioPath,
        ],
        { timeout: 30000, windowsHide: true }
      );
      if (fs.existsSync(outputAudioPath) && fs.statSync(outputAudioPath).size > 100) {
        console.log('Edge-TTS Python module generated audio successfully');
        return true;
      }
    } finally {
      try { fs.unlinkSync(textFile); } catch (e) {}
    }
  } catch (err: any) {
    console.warn('Edge-TTS Python failed:', err.message);
  }

  // Method 3: Fallback to gTTS
  try {
    const pythonBin = getPythonPath();
    const textFile = `${outputAudioPath}.txt`;
    fs.writeFileSync(textFile, textArg, 'utf-8');
    try {
      await execFileAsync(
        pythonBin,
        [
          '-c',
          "import sys; from gtts import gTTS; gTTS(open(sys.argv[1],encoding='utf-8').read(), lang='id').save(sys.argv[2])",
          textFile,
          outputAudioPath,
        ],
        { timeout: 30000, windowsHide: true }
      );
      if (fs.existsSync(outputAudioPath) && fs.statSync(outputAudioPath).size > 100) {
        console.log('gTTS generated audio successfully');
        return true;
      }
    } finally {
      try { fs.unlinkSync(textFile); } catch (e) {}
    }
  } catch (e: any) {
    console.warn('gTTS failed:', e.message);
  }

  return false;
}

/**
 * Extract a single frame from a video to use as hook background image
 */
async function extractFrame(videoPath: string, outPath: string): Promise<boolean> {
  const seeks = ['0.5', '0'];
  for (const ss of seeks) {
    try {
      await execAsync(
        `"${getFfmpegPath()}" -y -ss ${ss} -i "${videoPath.replace(/\\/g, '/')}" -frames:v 1 -q:v 3 "${outPath.replace(/\\/g, '/')}"`,
        { timeout: 15000, encoding: 'utf-8' }
      );
      if (fs.existsSync(outPath) && fs.statSync(outPath).size > 1000) return true;
    } catch (e) {}
  }
  return false;
}

/**
 * Generate a hook intro video with animated text and optional TTS
 */
export async function generateHookIntro(options: HookOptions): Promise<string | null> {
  const {
    hookText,
    outputPath,
    backgroundClipPath,
    duration = 4,
    voice = 'id-ID-ArdiNeural',
    fontSize = 56,
    textColor = 'white',
    bgColor1 = '#667eea',
    bgColor2 = '#764ba2',
    width = 1080,
    height = 1920,
  } = options;

  // Semua nilai yang diinterpolasi ke command ffmpeg dibersihkan dulu
  const safeDuration = Math.min(Math.max(Number(duration) || 4, 1), 15);
  const safeFontSize = Math.min(Math.max(Number(fontSize) || 56, 12), 200);
  const safeW = Math.round(Math.min(Math.max(Number(width) || 1080, 240), 3840));
  const safeH = Math.round(Math.min(Math.max(Number(height) || 1920, 240), 3840));
  const safeColor = (c: string) => String(c).replace(/[^a-zA-Z0-9#]/g, '') || 'white';
  const safeTextColor = safeColor(textColor);
  const safeBg1 = safeColor(bgColor1);
  const safeBg2 = safeColor(bgColor2);

  const hookDir = path.dirname(outputPath);
  const ttsAudioPath = path.join(hookDir, `hook_tts_${Date.now()}.mp3`);
  const hookVideoPath = path.join(hookDir, `hook_video_${Date.now()}.mp4`);
  
  try {
    // 1. Generate TTS audio
    const hasTTS = await generateTTS(hookText, ttsAudioPath, voice);
    
    // 2. Get TTS duration if available (to match video length)
    let videoDuration = safeDuration;
    if (hasTTS) {
      try {
        const { stdout } = await execAsync(
          `"${getFfmpegPath().replace(/ffmpeg(\.exe)?$/i, 'ffprobe$1')}" -v quiet -print_format json -show_format "${ttsAudioPath}"`,
          { timeout: 10000, encoding: 'utf-8' }
        );
        const probeData = JSON.parse(stdout);
        const ttsDuration = parseFloat(probeData?.format?.duration || '0');
        if (ttsDuration > 0) {
          videoDuration = Math.max(ttsDuration + 0.5, 3); // At least 3s, TTS + 0.5s padding
        }
      } catch (e) {}
    }
    
    // 3. Create gradient background video with animated text
    // Wrap text for display (max ~20 chars per line for 9:16)
    const words = hookText.split(' ');
    let lines: string[] = [];
    let currentLine = '';
    for (const word of words) {
      if ((currentLine + ' ' + word).trim().length > 25) {
        lines.push(currentLine.trim());
        currentLine = word;
      } else {
        currentLine = (currentLine + ' ' + word).trim();
      }
    }
    if (currentLine.trim()) lines.push(currentLine.trim());
    
    // Escape urutan benar: backslash → slash dulu, lalu escape `:` (urutan
    // lama terbalik sehingga `\:` jadi `/:`). Quote & `"` diganti curly quote
    // agar tidak memutus quoting shell/filter; `%` dihapus (drawtext %{...}
    // expansion).
    const escapedLines = lines.map(l => l
      .replace(/\\/g, '/')
      .replace(/['"]/g, '\u2019')
      .replace(/%/g, '')
      .replace(/:/g, '\\:'));

    // Build drawtext filters for each line with fade-in animation
    const lineHeight = safeFontSize + 15;
    const totalTextHeight = lines.length * lineHeight;
    const startY = (safeH - totalTextHeight) / 2;

    let drawtextFilters = escapedLines.map((line, idx) => {
      const y = Math.round(startY + idx * lineHeight);
      const fadeDelay = 0.3 * idx; // Stagger each line
      const escapedFont = getFontPath().replace(/:/g, '\\:');
      return `drawtext=text='${line}':fontfile=${escapedFont}:fontsize=${safeFontSize}:fontcolor=${safeTextColor}:x=(w-text_w)/2:y=${y}:alpha='if(lt(t,${fadeDelay}),0,if(lt(t,${fadeDelay + 0.4}),(t-${fadeDelay})/0.4,1))'`;
    }).join(',');

    // Create gradient background + text overlay
    const bgFilter = `color=c=${safeBg1}:s=${safeW}x${safeH}:d=${videoDuration},format=yuv420p`;
    const gradientOverlay = `gradients=s=${safeW}x${safeH}:c0=${safeBg1}:c1=${safeBg2}:type=linear:duration=${videoDuration}`;

    // Background: frame dari klip utama (digelapkan) kalau ada, fallback warna gelap solid
    const framePath = path.join(hookDir, `hook_frame_${Date.now()}.jpg`);
    const useBgImage = backgroundClipPath && fs.existsSync(backgroundClipPath)
      ? await extractFrame(backgroundClipPath, framePath)
      : false;

    const bgPre = useBgImage
      ? `scale=${safeW}:${safeH}:force_original_aspect_ratio=increase,crop=${safeW}:${safeH},eq=brightness=-0.12:saturation=1.05,fps=30,`
      : '';
    const bgInput = useBgImage
      ? `-loop 1 -t ${videoDuration} -i "${framePath.replace(/\\/g, '/')}"`
      : `-f lavfi -i "color=c=0x1a1a2e:s=${safeW}x${safeH}:d=${videoDuration}"`;

    // Simpler approach: solid color background with drawtext
    let ffmpegCmd: string;
    if (hasTTS) {
      ffmpegCmd = `"${getFfmpegPath()}" -y ${bgInput} -i "${ttsAudioPath}" -filter_complex "[0:v]${bgPre}${drawtextFilters}[v]" -map "[v]" -map 1:a -c:v libx264 -preset ultrafast -crf 23 -c:a aac -b:a 128k -shortest "${hookVideoPath}"`;
    } else {
      // No TTS, silent video with text
      ffmpegCmd = `"${getFfmpegPath()}" -y ${bgInput} -f lavfi -i "anullsrc=r=44100:cl=stereo" -filter_complex "[0:v]${bgPre}${drawtextFilters}[v]" -map "[v]" -map 1:a -c:v libx264 -preset ultrafast -crf 23 -c:a aac -b:a 128k -t ${videoDuration} "${hookVideoPath}"`;
    }
    
    console.log('Generating hook intro video...');
    await execAsync(ffmpegCmd, { timeout: 60000, encoding: 'utf-8' });
    
    if (!fs.existsSync(hookVideoPath)) {
      console.error('Hook video generation failed - file not created');
      return null;
    }
    
    console.log(`Hook intro generated: ${videoDuration.toFixed(1)}s, TTS: ${hasTTS}`);
    return hookVideoPath;
    
  } catch (err: any) {
    console.error('Hook generation failed:', err.message);
    return null;
  } finally {
    // Cleanup TTS audio + background frame
    if (fs.existsSync(ttsAudioPath)) {
      try { fs.unlinkSync(ttsAudioPath); } catch(e) {}
    }
    try {
      const staleFrames = fs.readdirSync(hookDir).filter(f => f.startsWith('hook_frame_'));
      for (const f of staleFrames) {
        try { fs.unlinkSync(path.join(hookDir, f)); } catch(e) {}
      }
    } catch(e) {}
  }
}

/**
 * Check if a video file contains an audio stream
 */
async function hasAudioStream(filePath: string): Promise<boolean> {
  try {
    const ffprobeBin = getFfmpegPath().replace(/ffmpeg(\.exe)?$/i, 'ffprobe$1');
    const { stdout } = await execAsync(
      `"${ffprobeBin}" -v error -show_entries stream=codec_type -of default=noprint_wrappers=1 "${filePath.replace(/\\/g, '/')}"`,
      { timeout: 10000, encoding: 'utf-8' }
    );
    return stdout.includes('codec_type=audio');
  } catch (e) {
    return true; // Default assume true
  }
}

/**
 * Concatenate hook intro + main clip into final output
 */
export async function concatHookAndClip(
  hookVideoPath: string,
  mainClipPath: string,
  outputPath: string,
  width: number = 1080,
  height: number = 1920
): Promise<boolean> {
  try {
    const cleanHook = hookVideoPath.replace(/\\/g, '/');
    const cleanMain = mainClipPath.replace(/\\/g, '/');
    const W = Math.round(Number(width) || 1080);
    const H = Math.round(Number(height) || 1920);

    const mainHasAudio = await hasAudioStream(mainClipPath);
    let ffmpegCmd: string;

    if (mainHasAudio) {
      // Both videos have audio streams
      const filterComplex = `[0:v]scale=${W}:${H},setsar=1,format=yuv420p[v0];[0:a]aformat=sample_rates=44100:channel_layouts=stereo[a0];[1:v]scale=${W}:${H},setsar=1,format=yuv420p[v1];[1:a]aformat=sample_rates=44100:channel_layouts=stereo[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]`;
      ffmpegCmd = `"${getFfmpegPath()}" -y -i "${cleanHook}" -i "${cleanMain}" -filter_complex "${filterComplex}" -map "[v]" -map "[a]" -c:v libx264 -preset fast -crf 18 -c:a aac -ar 44100 -b:a 192k "${outputPath}"`;
    } else {
      // Main clip has NO audio stream, generate synthetic silent audio stream for input 1
      const filterComplex = `[0:v]scale=${W}:${H},setsar=1,format=yuv420p[v0];[0:a]aformat=sample_rates=44100:channel_layouts=stereo[a0];[1:v]scale=${W}:${H},setsar=1,format=yuv420p[v1];[2:a]aformat=sample_rates=44100:channel_layouts=stereo[a1];[v0][a0][v1][a1]concat=n=2:v=1:a=1[v][a]`;
      ffmpegCmd = `"${getFfmpegPath()}" -y -i "${cleanHook}" -i "${cleanMain}" -f lavfi -i "anullsrc=r=44100:cl=stereo" -filter_complex "${filterComplex}" -map "[v]" -map "[a]" -c:v libx264 -preset fast -crf 18 -c:a aac -ar 44100 -b:a 192k "${outputPath}"`;
    }

    console.log(`Concatenating hook + clip (main clip has audio: ${mainHasAudio})...`);
    await execAsync(ffmpegCmd, { timeout: 120000, encoding: 'utf-8' });
    
    // Cleanup intro video
    if (fs.existsSync(hookVideoPath)) fs.unlinkSync(hookVideoPath);
    
    return fs.existsSync(outputPath);
  } catch (err: any) {
    console.error('Hook+Clip concat failed:', err.message);
    // Safe fallback: if concat fails, preserve main clip without hook intro
    try {
      if (fs.existsSync(mainClipPath) && !fs.existsSync(outputPath)) {
        fs.copyFileSync(mainClipPath, outputPath);
        return true;
      }
    } catch (e) {}
    return false;
  }
}
