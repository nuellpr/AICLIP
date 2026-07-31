import { describe, expect, it } from 'vitest';
import { limitVttContent, MAX_VTT_CHARS } from '../src/ai';

describe('limitVttContent', () => {
  const longVtt = Array.from({ length: 500 }, (_, i) =>
    `00:0${Math.floor(i / 60)}:${String(i % 60).padStart(2, '0')}.000 --> 00:0${Math.floor(i / 60)}:${String(i % 60 + 1).padStart(2, '0')}.000\nKalimat ke-${i + 1} dari subtitle yang cukup panjang\n`
  ).join('\n');

  it('keeps content unchanged when under the limit', () => {
    expect(limitVttContent('short vtt')).toBe('short vtt');
  });

  it('caps output at MAX_VTT_CHARS', () => {
    const result = limitVttContent(longVtt);
    expect(result.length).toBeLessThanOrEqual(MAX_VTT_CHARS);
  });

  it('preserves early and late parts of the transcript', () => {
    const result = limitVttContent(longVtt);
    expect(result).toContain('Kalimat ke-1');
    expect(result).toContain('Kalimat ke-500');
  });

  it('keeps timestamps intact per line', () => {
    const result = limitVttContent(longVtt);
    expect(result).toMatch(/-->/);
  });

  it('accepts custom maxChars', () => {
    const result = limitVttContent(longVtt, 3000);
    expect(result.length).toBeLessThanOrEqual(3000);
    expect(result).toContain('Kalimat ke-1');
  });
});
