import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';

const execAsync = promisify(exec);

export interface GpuEncoder {
  codec: string;
  name: string;
  type: 'nvidia' | 'amd' | 'intel' | 'apple' | 'cpu';
}

const getFfmpegPath = (): string => {
  if (fs.existsSync('/usr/bin/ffmpeg')) return '/usr/bin/ffmpeg';
  if (fs.existsSync('/usr/local/bin/ffmpeg')) return '/usr/local/bin/ffmpeg';
  return 'ffmpeg';
};

let cachedEncoder: GpuEncoder | null = null;

/**
 * Detect available GPU hardware encoder.
 * Returns the best available encoder, or falls back to CPU libx264.
 */
export async function detectGpuEncoder(): Promise<GpuEncoder> {
  if (cachedEncoder) return cachedEncoder;
  
  const ffmpegPath = getFfmpegPath();
  
  // List of encoders to try, in priority order
  const candidates: GpuEncoder[] = [
    { codec: 'h264_nvenc', name: 'NVIDIA NVENC', type: 'nvidia' },
    { codec: 'h264_amf', name: 'AMD AMF', type: 'amd' },
    { codec: 'h264_qsv', name: 'Intel QSV', type: 'intel' },
    { codec: 'h264_videotoolbox', name: 'Apple VideoToolbox', type: 'apple' },
  ];
  
  try {
    // Get list of available encoders from ffmpeg
    const { stdout } = await execAsync(
      `"${ffmpegPath}" -encoders 2>/dev/null || "${ffmpegPath}" -encoders 2>NUL`,
      { timeout: 10000, encoding: 'utf-8' }
    );
    
    for (const candidate of candidates) {
      if (stdout.includes(candidate.codec)) {
        // Verify encoder actually works with a quick test
        try {
          await execAsync(
            `"${ffmpegPath}" -y -f lavfi -i "color=c=black:s=64x64:d=0.1" -c:v ${candidate.codec} -f null - 2>/dev/null || "${ffmpegPath}" -y -f lavfi -i "color=c=black:s=64x64:d=0.1" -c:v ${candidate.codec} -f null - 2>NUL`,
            { timeout: 10000, encoding: 'utf-8' }
          );
          console.log(`GPU encoder detected: ${candidate.name} (${candidate.codec})`);
          cachedEncoder = candidate;
          return candidate;
        } catch (e) {
          console.log(`GPU encoder ${candidate.codec} listed but not functional, skipping...`);
        }
      }
    }
  } catch (e) {
    // ffmpeg -encoders failed, fall through to CPU
  }
  
  const cpuEncoder: GpuEncoder = { codec: 'libx264', name: 'CPU (libx264)', type: 'cpu' };
  console.log('No GPU encoder detected, using CPU (libx264)');
  cachedEncoder = cpuEncoder;
  return cpuEncoder;
}

/**
 * Get FFmpeg output options for the detected encoder
 */
export function getEncoderOptions(encoder: GpuEncoder): string[] {
  switch (encoder.type) {
    case 'nvidia':
      return ['-c:v', 'h264_nvenc', '-preset', 'p4', '-rc', 'vbr', '-cq', '23', '-b:v', '0'];
    case 'amd':
      return ['-c:v', 'h264_amf', '-quality', 'balanced', '-rc', 'vbr_latency', '-qp_i', '23', '-qp_p', '23'];
    case 'intel':
      return ['-c:v', 'h264_qsv', '-preset', 'medium', '-global_quality', '23'];
    case 'apple':
      return ['-c:v', 'h264_videotoolbox', '-q:v', '65'];
    case 'cpu':
    default:
      return ['-c:v', 'libx264', '-preset', 'fast', '-crf', '18', '-maxrate', '10M', '-bufsize', '16M'];
  }
}
