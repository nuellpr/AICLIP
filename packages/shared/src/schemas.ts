import { z } from 'zod';

export const ClipRecommendationSchema = z.object({
  title: z.string(),
  hook: z.string(),
  startTime: z.number(),
  endTime: z.number(),
  viralScore: z.number().min(0).max(100),
  reason: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()),
  keywords: z.array(z.string()).optional(),
  contentCategory: z.string()
});

export const LLMAnalysisResponseSchema = z.object({
  clips: z.array(ClipRecommendationSchema)
});

export type ClipRecommendation = z.infer<typeof ClipRecommendationSchema>;
export type LLMAnalysisResponse = z.infer<typeof LLMAnalysisResponseSchema>;
