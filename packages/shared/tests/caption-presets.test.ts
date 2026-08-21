import { describe, expect, it } from 'vitest';
import { CAPTION_PRESETS, getPresetById, getDefaultPreset } from '../src/caption-presets';

describe('CAPTION_PRESETS', () => {
  it('has unique ids', () => {
    const ids = CAPTION_PRESETS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('is not empty and has the known first preset', () => {
    expect(CAPTION_PRESETS.length).toBeGreaterThan(0);
    expect(CAPTION_PRESETS[0].id).toBe('alex-hormozi');
  });

  it('has valid preset shapes', () => {
    const validPositions = ['top', 'center', 'bottom'];
    for (const preset of CAPTION_PRESETS) {
      expect(preset.id).toBeTruthy();
      expect(preset.fontSize).toBeGreaterThan(0);
      expect(preset.wordsPerCaption).toBeGreaterThan(0);
      expect(preset.maxLines).toBeGreaterThan(0);
      expect(validPositions).toContain(preset.position);
      expect(['none', 'uppercase', 'lowercase']).toContain(preset.textTransform);
      expect(preset.enabled).toBe(true);
    }
  });
});

describe('getPresetById', () => {
  it('returns the matching preset', () => {
    const preset = getPresetById('temp-7');
    expect(preset.id).toBe('temp-7');
    expect(preset.name).toBe('Classic (Temp-7)');
  });

  it('falls back to the first preset for unknown ids', () => {
    expect(getPresetById('does-not-exist')).toBe(CAPTION_PRESETS[0]);
  });
});

describe('getDefaultPreset', () => {
  it('returns the first preset', () => {
    expect(getDefaultPreset()).toBe(CAPTION_PRESETS[0]);
  });
});
