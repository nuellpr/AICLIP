import fs from 'fs';
import { execSync } from 'child_process';
import ffmpegStatic from 'ffmpeg-static';

export function getFfmpegPath(): string {
  if (fs.existsSync('/usr/bin/ffmpeg')) {
    return '/usr/bin/ffmpeg';
  }
  if (fs.existsSync('/usr/local/bin/ffmpeg')) {
    return '/usr/local/bin/ffmpeg';
  }
  if (process.env.FFMPEG_PATH && fs.existsSync(process.env.FFMPEG_PATH)) {
    return process.env.FFMPEG_PATH;
  }
  if (ffmpegStatic && fs.existsSync(ffmpegStatic as string)) {
    return ffmpegStatic as string;
  }
  return 'ffmpeg';
}

export function getPythonPath(): string {
  const candidates = ['python', 'python3', 'py'];
  for (const cmd of candidates) {
    try {
      const result = execSync(`${cmd} --version`, { encoding: 'utf-8', stdio: 'pipe' });
      if (result) return cmd;
    } catch (_) {}
  }
  return 'python';
}

const FONT_CANDIDATES = [
  '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
  '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
  '/usr/share/fonts/truetype/noto/NotoSans-Bold.ttf',
  '/System/Library/Fonts/Supplemental/Arial Bold.ttf',
  'C:/Windows/Fonts/arialbd.ttf',
  'C:/Windows/Fonts/segoeuib.ttf',
];

export function getFontPath(): string {
  if (process.env.HOOK_FONT_PATH && fs.existsSync(process.env.HOOK_FONT_PATH)) {
    return process.env.HOOK_FONT_PATH;
  }
  for (const candidate of FONT_CANDIDATES) {
    if (fs.existsSync(candidate)) return candidate;
  }
  return FONT_CANDIDATES[0];
}
