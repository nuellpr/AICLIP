import { describe, expect, it } from 'vitest';
import { limitVttContent, getVttWindow, MAX_VTT_CHARS, sanitizeClips } from '../src/ai';

const validClip = {
  title: 'Judul klip viral',
  hook: 'Hook menarik',
  startTime: 10,
  endTime: 40,
  viralScore: 88,
  reason: 'Momen emosional',
  caption: 'Caption #viral',
  hashtags: ['viral'],
  contentCategory: 'entertainment',
};

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

describe('sanitizeClips', () => {
  it('keeps a valid clip intact', () => {
    const kept = sanitizeClips([validClip]);
    expect(kept).toHaveLength(1);
    expect(kept[0].title).toBe('Judul klip viral');
    expect(kept[0].viralScore).toBe(88);
  });

  it('drops clips missing required fields instead of failing everything', () => {
    const { title, ...noTitle } = validClip;
    const kept = sanitizeClips([{ ...noTitle, title: '' }, validClip]);
    expect(kept).toHaveLength(1);
    expect(kept[0].title).toBe('Judul klip viral');
  });

  it('drops clips with endTime <= startTime', () => {
    const kept = sanitizeClips([{ ...validClip, endTime: 10 }]);
    expect(kept).toHaveLength(0);
  });

  it('fills defaults for optional fields the LLM omitted', () => {
    const kept = sanitizeClips([{ title: 't', hook: 'h', startTime: 1, endTime: 5, reason: 'r', caption: 'c' }]);
    expect(kept).toHaveLength(1);
    expect(kept[0].hashtags).toEqual([]);
    expect(kept[0].keywords).toEqual([]);
    expect(kept[0].contentCategory).toBe('umum');
    expect(kept[0].viralScore).toBe(85);
  });

  it('clamps viralScore into 0-100 and rounds it', () => {
    const kept = sanitizeClips([
      { ...validClip, title: 'a', viralScore: 150 },
      { ...validClip, title: 'b', viralScore: -5 },
      { ...validClip, title: 'c', viralScore: 87.6 },
    ]);
    expect(kept.map((c) => c.viralScore)).toEqual([100, 0, 88]);
  });

  it('returns an empty array for no usable clips', () => {
    expect(sanitizeClips([])).toEqual([]);
    expect(sanitizeClips([null, undefined, {}])).toEqual([]);
  });
});
