import { describe, expect, it } from 'vitest';
import os from 'os';
import path from 'path';
import fs from 'fs';
import { hexToAssColor, generateAssFromVtt } from '../src/subtitle';

describe('hexToAssColor', () => {
  it('converts 6-digit hex to ASS BGR', () => {
    expect(hexToAssColor('#FF0000')).toBe('&H000000FF');
    expect(hexToAssColor('#0000FF')).toBe('&H00FF0000');
    expect(hexToAssColor('#FFFFFF')).toBe('&H00FFFFFF');
  });

  it('expands 3-digit hex', () => {
    expect(hexToAssColor('#0f0')).toBe('&H0000FF00');
  });

  it('converts 8-digit hex with alpha', () => {
    expect(hexToAssColor('#FF000080')).toBe('&H7F0000FF');
  });

  it('handles transparent', () => {
    expect(hexToAssColor('transparent')).toBe('&HFF000000');
  });

  it('converts rgba() with alpha', () => {
    expect(hexToAssColor('rgba(255,0,0,1)')).toBe('&H000000FF');
    expect(hexToAssColor('rgba(255,0,0,0.5)')).toBe('&H800000FF');
  });

  it('falls back to white for unknown values', () => {
    expect(hexToAssColor('')).toBe('&HFF000000');
    expect(hexToAssColor('bogus')).toBe('&H00FFFFFF');
  });
});

describe('generateAssFromVtt', () => {
  it('generates a valid ASS file with word timings', async () => {
    const outPath = path.join(os.tmpdir(), `test-${Date.now()}.ass`);
    await generateAssFromVtt('', 0, 5, outPath, {
      words: [
        { text: 'Hello', start: 1, end: 1.5 },
        { text: 'world', start: 1.5, end: 2 },
      ],
      fontFamily: 'Impact',
      fontSize: 64,
      textColor: '#FFFFFF',
      activeWordColor: '#FFE600',
      spokenWordColor: '#FFFFFF',
      strokeColor: '#000000',
      strokeWidth: 6,
      textTransform: 'uppercase',
      animation: 'pop',
      wordsPerCaption: 2,
      position: 'bottom',
      marginBottom: 180,
    });

    const content = fs.readFileSync(outPath, 'utf-8');
    expect(content).toContain('[Script Info]');
    expect(content).toContain('PlayResY: 1920');
    expect(content).toContain('Style: Default,Impact,64');
    expect(content).toContain('Dialogue:');
    expect(content).toContain('HELLO');
    expect(content).toContain('WORLD');
    fs.unlinkSync(outPath);
  });

  it('parses VTT content when no words are given', async () => {
    const outPath = path.join(os.tmpdir(), `test-${Date.now()}.ass`);
    const vtt = `WEBVTT

00:00:01.000 --> 00:00:03.000
hello world from vtt`;

    await generateAssFromVtt(vtt, 0, 5, outPath, {
      textTransform: 'none',
      animation: 'none',
      wordsPerCaption: 4,
      position: 'bottom',
      marginBottom: 180,
    });

    const content = fs.readFileSync(outPath, 'utf-8');
    expect(content).toContain('[Script Info]');
    expect(content).toContain('hello world from vtt');
    fs.unlinkSync(outPath);
  });

  it('clamps negative times to zero', async () => {
    const outPath = path.join(os.tmpdir(), `test-${Date.now()}.ass`);
    await generateAssFromVtt('', 0, 5, outPath, {
      words: [{ text: 'Hello', start: 0.3, end: 0.8 }],
      offset: -0.5,
      textTransform: 'none',
      animation: 'none',
      wordsPerCaption: 1,
      position: 'bottom',
      marginBottom: 180,
    });

    const content = fs.readFileSync(outPath, 'utf-8');
    expect(content).toContain('Dialogue: 0,0:00:00.00,0:00:00.29');
    fs.unlinkSync(outPath);
  });
});
