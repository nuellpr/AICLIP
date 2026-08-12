import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const getFfmpegPath = (): string => {
  if (fs.existsSync('/usr/bin/ffmpeg')) return '/usr/bin/ffmpeg';
  if (fs.existsSync('/usr/local/bin/ffmpeg')) return '/usr/local/bin/ffmpeg';
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

export interface HookOptions {
  hookText: string;
  outputPath: string;
  duration?: number; // seconds, default 4
  voice?: string; // edge-tts voice, default 'id-ID-ArdiNeural'
  fontSize?: number;
  textColor?: string;
  bgColor1?: string;
  bgColor2?: string;
}

/**
 * Generate a TTS audio file from hook text using edge-tts (Python)
 */
async function generateTTS(text: string, outputAudioPath: string, voice: string = 'id-ID-ArdiNeural'): Promise<boolean> {
  const cleanAudioPath = outputAudioPath.replace(/\\/g, '/');
  const cleanText = text.replace(/"/g, '\\"').replace(/\n/g, ' ');

  // Method 1: Try edge-tts CLI tool directly
  try {
    await execAsync(
      `edge-tts --voice "${voice}" --text "${cleanText}" --write-media "${cleanAudioPath}"`,
      { timeout: 30000, encoding: 'utf-8' }
    );
    if (fs.existsSync(outputAudioPath) && fs.statSync(outputAudioPath).size > 100) {
      console.log('Edge-TTS CLI generated audio successfully');
      return true;
    }
  } catch (cliErr: any) {
    // CLI tool not in PATH, fallback to Python module
  }

  // Method 2: Python edge_tts module with valid asyncio.run syntax
  try {
    const pythonBin = getPythonPath();
    const safeText = cleanText.replace(/'/g, "\\'");
    await execAsync(
      `"${pythonBin}" -c "import asyncio, edge_tts; asyncio.run(edge_tts.Communicate('${safeText}', '${voice}').save('${cleanAudioPath}'))"`,
      { timeout: 30000, encoding: 'utf-8' }
    );
    if (fs.existsSync(outputAudioPath) && fs.statSync(outputAudioPath).size > 100) {
      console.log('Edge-TTS Python module generated audio successfully');
      return true;
    }
  } catch (err: any) {
    console.warn('Edge-TTS Python failed:', err.message);
  }

  // Method 3: Fallback to gTTS
  try {
    const pythonBin = getPythonPath();
    const safeText = cleanText.replace(/'/g, "\\'");
    await execAsync(
      `"${pythonBin}" -c "from gtts import gTTS; tts = gTTS('${safeText}', lang='id'); tts.save('${cleanAudioPath}')"`,
      { timeout: 30000, encoding: 'utf-8' }
    );
    if (fs.existsSync(outputAudioPath) && fs.statSync(outputAudioPath).size > 100) {
      console.log('gTTS generated audio successfully');
      return true;
    }
  } catch (e: any) {
    console.warn('gTTS failed:', e.message);
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
    duration = 4,
    voice = 'id-ID-ArdiNeural',
    fontSize = 56,
    textColor = 'white',
    bgColor1 = '#667eea',
    bgColor2 = '#764ba2',
  } = options;

  const hookDir = path.dirname(outputPath);
  const ttsAudioPath = path.join(hookDir, `hook_tts_${Date.now()}.mp3`);
  const hookVideoPath = path.join(hookDir, `hook_video_${Date.now()}.mp4`);
  
  try {
    // 1. Generate TTS audio
    const hasTTS = await generateTTS(hookText, ttsAudioPath, voice);
    
    // 2. Get TTS duration if available (to match video length)
    let videoDuration = duration;
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
    
    const escapedLines = lines.map(l => l.replace(/'/g, "'").replace(/:/g, '\\:').replace(/\\/g, '/'));
    
    // Build drawtext filters for each line with fade-in animation
    const lineHeight = fontSize + 15;
    const totalTextHeight = lines.length * lineHeight;
    const startY = (1920 - totalTextHeight) / 2;
    
    let drawtextFilters = escapedLines.map((line, idx) => {
      const y = Math.round(startY + idx * lineHeight);
      const fadeDelay = 0.3 * idx; // Stagger each line
      return `drawtext=text='${line}':fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf:fontsize=${fontSize}:fontcolor=${textColor}:x=(w-text_w)/2:y=${y}:alpha='if(lt(t,${fadeDelay}),0,if(lt(t,${fadeDelay + 0.4}),(t-${fadeDelay})/0.4,1))'`;
    }).join(',');
    
    // Create gradient background + text overlay
    const bgFilter = `color=c=${bgColor1}:s=1080x1920:d=${videoDuration},format=yuv420p`;
    const gradientOverlay = `gradients=s=1080x1920:c0=${bgColor1}:c1=${bgColor2}:type=linear:duration=${videoDuration}`;
    
    // Simpler approach: solid color background with drawtext
    let ffmpegCmd: string;
    if (hasTTS) {
      ffmpegCmd = `"${getFfmpegPath()}" -y -f lavfi -i "color=c=0x1a1a2e:s=1080x1920:d=${videoDuration}" -i "${ttsAudioPath}" -filter_complex "[0:v]${drawtextFilters}[v]" -map "[v]" -map 1:a -c:v libx264 -preset ultrafast -crf 23 -c:a aac -b:a 128k -shortest "${hookVideoPath}"`;
    } else {
      // No TTS, silent video with text
      ffmpegCmd = `"${getFfmpegPath()}" -y -f lavfi -i "color=c=0x1a1a2e:s=1080x1920:d=${videoDuration}" -f lavfi -i "anullsrc=r=44100:cl=stereo" -filter_complex "[0:v]${drawtextFilters}[v]" -map "[v]" -map 1:a -c:v libx264 -preset ultrafast -crf 23 -c:a aac -b:a 128k -t ${videoDuration} "${hookVideoPath}"`;
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
    // Cleanup TTS audio
    if (fs.existsSync(ttsAudioPath)) {
      try { fs.unlinkSync(ttsAudioPath); } catch(e) {}
    }
  }
}

/**
 * Concatenate hook intro + main clip into final output
 */
export async function concatHookAndClip(
  hookVideoPath: string,
  mainClipPath: string,
  outputPath: string
): Promise<boolean> {
  try {
    const concatListPath = hookVideoPath.replace('.mp4', '_concat.txt');
    // Create concat demuxer list
    const concatContent = `file '${hookVideoPath.replace(/\\/g, '/')}'\nfile '${mainClipPath.replace(/\\/g, '/')}'`;
    fs.writeFileSync(concatListPath, concatContent, 'utf-8');
    
    // Re-encode to ensure compatible streams
    await execAsync(
      `"${getFfmpegPath()}" -y -f concat -safe 0 -i "${concatListPath}" -c:v libx264 -preset superfast -crf 22 -c:a aac -b:a 192k "${outputPath}"`,
      { timeout: 120000, encoding: 'utf-8' }
    );
    
    // Cleanup
    if (fs.existsSync(concatListPath)) fs.unlinkSync(concatListPath);
    if (fs.existsSync(hookVideoPath)) fs.unlinkSync(hookVideoPath);
    
    return fs.existsSync(outputPath);
  } catch (err: any) {
    console.error('Hook+Clip concat failed:', err.message);
    return false;
  }
}
