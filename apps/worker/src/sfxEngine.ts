import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { getFfmpegPath } from './paths';

const execAsync = promisify(exec);

export interface SfxEvent {
  type: 'whoosh' | 'pop' | 'ding' | 'glitch';
  timestampSec: number;
  volume?: number; // 0.1 to 1.0, default 0.5
}

/**
 * Ensure SFX audio files exist by generating clean audio samples via FFmpeg if missing
 */
export async function ensureSfxAssets(): Promise<Record<string, string>> {
  const sfxDir = path.join(__dirname, '../assets/sfx');
  if (!fs.existsSync(sfxDir)) {
    fs.mkdirSync(sfxDir, { recursive: true });
  }

  const ffmpeg = getFfmpegPath();
  const assets: Record<string, string> = {
    whoosh: path.join(sfxDir, 'whoosh.wav'),
    pop: path.join(sfxDir, 'pop.wav'),
    ding: path.join(sfxDir, 'ding.wav'),
    glitch: path.join(sfxDir, 'glitch.wav'),
  };

  try {
    // Generate WHOOSH (0.4s frequency sweep noise burst)
    if (!fs.existsSync(assets.whoosh)) {
      await execAsync(
        `"${ffmpeg}" -y -f lavfi -i "anoisesrc=d=0.4:c=pink:r=44100" -af "volume=0.8,afade=t=in:ss=0:d=0.15,afade=t=out:st=0.2:d=0.2,lowpass=f=1200" "${assets.whoosh}"`,
        { timeout: 10000 }
      );
    }

    // Generate POP (0.08s short sine pop tone)
    if (!fs.existsSync(assets.pop)) {
      await execAsync(
        `"${ffmpeg}" -y -f lavfi -i "sine=f=440:b=4:d=0.08" -af "volume=0.9,afade=t=out:st=0.02:d=0.06" "${assets.pop}"`,
        { timeout: 10000 }
      );
    }

    // Generate DING (0.5s crystal bell tone)
    if (!fs.existsSync(assets.ding)) {
      await execAsync(
        `"${ffmpeg}" -y -f lavfi -i "sine=f=1760:d=0.5" -af "volume=0.7,afade=t=out:st=0.05:d=0.45" "${assets.ding}"`,
        { timeout: 10000 }
      );
    }

    // Generate GLITCH (0.2s digital glitch noise)
    if (!fs.existsSync(assets.glitch)) {
      await execAsync(
        `"${ffmpeg}" -y -f lavfi -i "anoisesrc=d=0.2:c=white:r=44100" -af "volume=0.7,tremolo=f=30:d=0.8,afade=t=out:st=0.1:d=0.1" "${assets.glitch}"`,
        { timeout: 10000 }
      );
    }
  } catch (e: any) {
    console.warn('SFX asset generation warning:', e.message);
  }

  return assets;
}

/**
 * Detect key trigger words in clip transcript to trigger SFX sound effects automatically
 */
export function detectSfxTriggers(
  words: { text: string; start: number; end: number }[],
  clipHook?: string
): SfxEvent[] {
  const events: SfxEvent[] = [];

  // Always add a Whoosh SFX at start of hook/clip transition (0.1s)
  events.push({ type: 'whoosh', timestampSec: 0.1, volume: 0.6 });

  if (!words || words.length === 0) return events;

  // High-energy trigger keywords in Indonesian & English
  const popKeywords = new Set([
    'gila', 'mahal', 'murah', 'bisa', 'banyak', 'uang', 'gaji', 'ternyata',
    'rahasia', 'rahasianya', 'gratis', 'untung', 'rugi', 'omzet', 'sukses',
    'dapat', 'dapet', 'kaya', 'miskin', 'kaget', 'parah', 'kreator', 'viral'
  ]);

  const dingKeywords = new Set([
    'pertama', 'kedua', 'ketiga', '1', '2', '3', 'penting', 'fakta', 'solusi',
    'bocoran', 'trik', 'cara', 'tips'
  ]);

  let lastSfxTime = -2.0; // Ensure at least 2 seconds gap between word SFXs

  for (const word of words) {
    const cleanWord = (word.text || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const currentStart = Math.max(0, word.start);

    if (currentStart - lastSfxTime < 1.8) continue; // Skip if too close to previous SFX

    if (popKeywords.has(cleanWord) || word.text.endsWith('!') || word.text.endsWith('?!')) {
      events.push({ type: 'pop', timestampSec: currentStart, volume: 0.7 });
      lastSfxTime = currentStart;
    } else if (dingKeywords.has(cleanWord)) {
      events.push({ type: 'ding', timestampSec: currentStart, volume: 0.6 });
      lastSfxTime = currentStart;
    }
  }

  // Cap total SFX count to max 5 per clip to keep audio clean and professional
  return events.slice(0, 5);
}

/**
 * Mix SFX sound events into a video file's audio track
 */
export async function mixSfxIntoVideo(
  inputVideoPath: string,
  sfxEvents: SfxEvent[],
  outputPath: string
): Promise<boolean> {
  if (!sfxEvents || sfxEvents.length === 0) {
    try {
      fs.copyFileSync(inputVideoPath, outputPath);
      return true;
    } catch (e) {
      return false;
    }
  }

  try {
    const assets = await ensureSfxAssets();
    const ffmpeg = getFfmpegPath();
    const cleanVideo = inputVideoPath.replace(/\\/g, '/');

    // Build FFmpeg inputs and filter_complex for audio mixing
    const inputArgs: string[] = [`-i "${cleanVideo}"`];
    const filterParts: string[] = [];
    const mixLabels: string[] = ['[0:a]'];

    sfxEvents.forEach((evt, idx) => {
      const assetPath = assets[evt.type] || assets.pop;
      if (!fs.existsSync(assetPath)) return;

      const inputIdx = idx + 1;
      inputArgs.push(`-i "${assetPath.replace(/\\/g, '/')}"`);

      const delayMs = Math.round(Math.max(0, evt.timestampSec) * 1000);
      const vol = evt.volume !== undefined ? evt.volume : 0.6;
      const sfxLabel = `sfx_${idx}`;

      // Delay and set volume for each SFX asset
      filterParts.push(`[${inputIdx}:a]adelay=${delayMs}:all=1,volume=${vol}[${sfxLabel}]`);
      mixLabels.push(`[${sfxLabel}]`);
    });

    if (mixLabels.length === 1) {
      // No valid SFX inputs to mix
      fs.copyFileSync(inputVideoPath, outputPath);
      return true;
    }

    // Mix original audio stream with all SFX streams
    const mixCount = mixLabels.length;
    filterParts.push(`${mixLabels.join('')}amix=inputs=${mixCount}:duration=first:dropout_transition=2:normalize=0[a_mixed]`);

    const filterComplexStr = filterParts.join(';');
    const cmd = `"${ffmpeg}" -y ${inputArgs.join(' ')} -filter_complex "${filterComplexStr}" -map 0:v -map "[a_mixed]" -c:v copy -c:a aac -b:a 192k "${outputPath}"`;

    console.log(`Mixing ${sfxEvents.length} SFX sound effects into video...`);
    await execAsync(cmd, { timeout: 120000, encoding: 'utf-8' });

    return fs.existsSync(outputPath);
  } catch (err: any) {
    console.warn('SFX audio mixing failed:', err.message);
    // Fallback: copy original video if SFX mixing encounters an issue
    try {
      if (fs.existsSync(inputVideoPath) && !fs.existsSync(outputPath)) {
        fs.copyFileSync(inputVideoPath, outputPath);
        return true;
      }
    } catch (e) {}
    return false;
  }
}
