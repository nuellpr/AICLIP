import { z } from 'zod';

export const ClipRecommendationSchema = z.object({
  title: z.string().min(1),
  hook: z.string(),
  startTime: z.number().nonnegative(),
  endTime: z.number().nonnegative(),
  viralScore: z.number().min(0).max(100),
  reason: z.string(),
  caption: z.string(),
  hashtags: z.array(z.string()),
  keywords: z.array(z.string()).optional(),
  contentCategory: z.string()
}).refine(c => c.endTime > c.startTime, {
  message: 'endTime must be greater than startTime'
});

export const LLMAnalysisResponseSchema = z.object({
  clips: z.array(ClipRecommendationSchema).min(1)
});

export type ClipRecommendation = z.infer<typeof ClipRecommendationSchema>;
export type LLMAnalysisResponse = z.infer<typeof LLMAnalysisResponseSchema>;
