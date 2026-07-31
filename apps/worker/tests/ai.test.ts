import { describe, expect, it } from 'vitest';
import { limitVttContent, getVttWindow, MAX_VTT_CHARS } from '../src/ai';

const longVtt = Array.from({ length: 500 }, (_, i) =>
  `00:0${Math.floor(i / 60)}:${String(i % 60).padStart(2, '0')}.000 --> 00:0${Math.floor(i / 60)}:${String(i % 60 + 1).padStart(2, '0')}.000\nKalimat ke-${i + 1} dari subtitle yang cukup panjang\n`
).join('\n');

describe('limitVttContent', () => {

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

describe('getVttWindow', () => {
  it('returns full content when under the limit', () => {
    expect(getVttWindow('short vtt', 0)).toBe('short vtt');
  });

  it('caps output at MAX_VTT_CHARS', () => {
    const result = getVttWindow(longVtt, 0);
    expect(result.length).toBeLessThanOrEqual(MAX_VTT_CHARS);
  });

  it('shifts the window per attempt index', () => {
    const w0 = getVttWindow(longVtt, 0);
    const w1 = getVttWindow(longVtt, 1);
    expect(w0).not.toBe(w1);
  });

  it('wraps around and still yields a valid window', () => {
    const last = getVttWindow(longVtt, 1000);
    expect(last.length).toBeGreaterThan(0);
    expect(last.length).toBeLessThanOrEqual(MAX_VTT_CHARS);
  });
});
