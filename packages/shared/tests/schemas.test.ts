import { describe, expect, it } from 'vitest';
import {
  ClipRecommendationSchema,
  LLMAnalysisResponseSchema,
} from '../src/schemas';

const validClip = {
  title: 'Amazing hook',
  hook: 'Watch this',
  startTime: 12.5,
  endTime: 45.0,
  viralScore: 87,
  reason: 'Strong emotional moment',
  caption: 'Best clip ever #viral',
  hashtags: ['viral', 'fyp'],
  keywords: ['funny', 'reaction'],
  contentCategory: 'entertainment',
};

describe('ClipRecommendationSchema', () => {
  it('accepts a valid clip', () => {
    expect(ClipRecommendationSchema.safeParse(validClip).success).toBe(true);
  });

  it('accepts clips without optional keywords', () => {
    const { keywords, ...rest } = validClip;
    expect(ClipRecommendationSchema.safeParse(rest).success).toBe(true);
  });

  it('rejects missing required fields', () => {
    const { title, ...rest } = validClip;
    const result = ClipRecommendationSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects viralScore out of range', () => {
    expect(ClipRecommendationSchema.safeParse({ ...validClip, viralScore: 150 }).success).toBe(false);
    expect(ClipRecommendationSchema.safeParse({ ...validClip, viralScore: -5 }).success).toBe(false);
  });

  it('rejects startTime after endTime', () => {
    expect(
      ClipRecommendationSchema.safeParse({ ...validClip, startTime: 100, endTime: 10 }).success
    ).toBe(false);
  });

  it('rejects non-string hashtags', () => {
    expect(
      ClipRecommendationSchema.safeParse({ ...validClip, hashtags: 'viral' }).success
    ).toBe(false);
  });
});

describe('LLMAnalysisResponseSchema', () => {
  it('accepts a response with clips', () => {
    expect(
      LLMAnalysisResponseSchema.safeParse({ clips: [validClip] }).success
    ).toBe(true);
  });

  it('rejects an empty clips array', () => {
    expect(LLMAnalysisResponseSchema.safeParse({ clips: [] }).success).toBe(false);
  });
});
