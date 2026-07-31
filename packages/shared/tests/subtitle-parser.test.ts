import { describe, expect, it } from 'vitest';
import { parseVTTTime, parseYouTubeVttWords, Word } from '../src/subtitle-parser';

describe('parseVTTTime', () => {
  it('parses MM:SS.mmm', () => {
    expect(parseVTTTime('00:01.500')).toBe(1.5);
  });

  it('parses HH:MM:SS.mmm', () => {
    expect(parseVTTTime('00:01:02.500')).toBe(62.5);
  });

  it('parses comma decimals (SRT style)', () => {
    expect(parseVTTTime('00:00:01,250')).toBe(1.25);
  });

  it('ignores extra text after the time', () => {
    expect(parseVTTTime('00:00:02.000 align:start position:0%')).toBe(2);
  });
});

describe('parseYouTubeVttWords', () => {
  const plainVtt = `WEBVTT
Kind: captions
Language: en

00:00:01.000 --> 00:00:03.000
Hello world

00:00:03.000 --> 00:00:05.000
welcome to the show`;

  it('splits plain cues into evenly spaced words', () => {
    const words = parseYouTubeVttWords(plainVtt);
    expect(words.map(w => w.text)).toEqual(['Hello', 'world', 'welcome', 'to', 'the', 'show']);
    expect(words[0]).toMatchObject({ start: 1, end: 2 });
    expect(words[1]).toMatchObject({ start: 2, end: 3 });
  });

  it('parses <c> word-level timestamps', () => {
    const vtt = `WEBVTT

00:00:01.000 --> 00:00:03.000
<00:00:01.000><c>Hello</c> <00:00:02.000><c>world</c>`;

    const words = parseYouTubeVttWords(vtt);
    expect(words).toHaveLength(2);
    expect(words[0]).toMatchObject({ text: 'Hello', start: 1, end: 2 });
    expect(words[1]).toMatchObject({ text: 'world', start: 2, end: 3 });
  });

  it('skips micro-cues shorter than 20ms', () => {
    const vtt = `WEBVTT

00:00:01.000 --> 00:00:01.010
flash

00:00:02.000 --> 00:00:04.000
real line`;

    const words = parseYouTubeVttWords(vtt);
    expect(words.map(w => w.text)).toEqual(['real', 'line']);
  });

  it('deduplicates rolling cue repeats', () => {
    const vtt = `WEBVTT

00:00:01.000 --> 00:00:02.000
the cat sat

00:00:02.000 --> 00:00:03.000
the cat sat down`;

    const words = parseYouTubeVttWords(vtt);
    const texts = words.map(w => w.text);
    expect(texts.filter(t => t === 'the').length).toBe(1);
    expect(texts.filter(t => t === 'cat').length).toBe(1);
    expect(texts).toContain('down');
  });

  it('preserves original casing and punctuation', () => {
    const vtt = `WEBVTT

00:00:01.000 --> 00:00:02.000
Hello, world!`;

    const words = parseYouTubeVttWords(vtt);
    expect(words.map(w => w.text)).toEqual(['Hello,', 'world!']);
  });

  it('deduplicates words ignoring case and punctuation', () => {
    const vtt = `WEBVTT

00:00:01.000 --> 00:00:02.000
Hello, world

00:00:02.000 --> 00:00:03.000
hello world again`;

    const words = parseYouTubeVttWords(vtt);
    const texts = words.map(w => w.text);
    expect(texts.filter(t => t.toLowerCase() === 'hello,'.toLowerCase()).length).toBe(1);
    expect(texts.filter(t => t === 'world').length).toBe(1);
    expect(texts).toContain('again');
  });

  it('keeps words sorted and non-overlapping', () => {
    const words = parseYouTubeVttWords(plainVtt);
    for (let i = 1; i < words.length; i++) {
      expect(words[i].start).toBeGreaterThanOrEqual(words[i - 1].end);
    }
  });

  it('handles empty input', () => {
    expect(parseYouTubeVttWords('')).toEqual([]);
    expect(parseYouTubeVttWords('WEBVTT\n\nno cues here')).toEqual([]);
  });
});
