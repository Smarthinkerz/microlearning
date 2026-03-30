/**
 * AI Recommendation Router
 * 
 * tRPC procedures for data-driven lesson recommendations
 * with confidence scoring and explainability.
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  generateRecommendations,
  generateAIExplanation,
  type RecommendationContext,
} from "../services/aiRecommendation";
import * as db from "../db";

export const aiRecommendationRouter = router({
  /**
   * Get personalized lesson recommendations for the current user.
   */
  getRecommendations: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(20).optional(),
      availableMinutes: z.number().optional(),
      deviceType: z.enum(["mobile", "desktop", "tablet"]).optional(),
      preferredCategories: z.array(z.string()).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const context: RecommendationContext = {
        userId: ctx.user.id,
        orgId: ctx.user.orgId || undefined,
        currentTime: Date.now(),
        timezone: ctx.user.timezone || "UTC",
        deviceType: input?.deviceType,
        availableMinutes: input?.availableMinutes,
        preferredCategories: input?.preferredCategories,
      };

      const recommendations = await generateRecommendations(
        context,
        input?.limit || 5
      );

      return {
        recommendations,
        generatedAt: Date.now(),
        context: {
          userId: ctx.user.id,
          timezone: context.timezone,
          availableMinutes: context.availableMinutes,
        },
      };
    }),

  /**
   * Get AI-enhanced explanation for a specific recommendation.
   */
  getExplanation: protectedProcedure
    .input(z.object({
      lessonId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      // Generate a fresh recommendation for this lesson
      const context: RecommendationContext = {
        userId: ctx.user.id,
        orgId: ctx.user.orgId || undefined,
        currentTime: Date.now(),
        timezone: ctx.user.timezone || "UTC",
      };

      const recommendations = await generateRecommendations(context, 20);
      const rec = recommendations.find(r => r.lessonId === input.lessonId);

      if (!rec) {
        return {
          explanation: "This lesson is available in your library. Start learning today!",
          signals: [],
        };
      }

      // Get user context for AI explanation
      const attempts = await db.getAttemptsByUser(ctx.user.id);
      const completedCount = attempts.filter(a => a.status === "completed").length;
      
      // Find weak categories
      const categoryScores = new Map<string, { total: number; count: number }>();
      for (const attempt of attempts) {
        if (attempt.score !== null && attempt.maxScore !== null && attempt.maxScore > 0) {
          const lesson = await db.getLessonById(attempt.lessonId);
          if (lesson) {
            const cat = lesson.category || "General";
            const existing = categoryScores.get(cat) || { total: 0, count: 0 };
            categoryScores.set(cat, {
              total: existing.total + (attempt.score / attempt.maxScore) * 100,
              count: existing.count + 1,
            });
          }
        }
      }
      const weakCategories = Array.from(categoryScores.entries())
        .filter(([_, v]) => v.total / v.count < 70)
        .map(([k]) => k);

      const aiExplanation = await generateAIExplanation(rec, {
        name: ctx.user.name || "Learner",
        completedCount,
        weakCategories,
      });

      return {
        explanation: aiExplanation,
        signals: rec.signals,
        confidence: rec.confidenceScore,
        priority: rec.priority,
      };
    }),

  /**
   * Get recommendation statistics for the current user.
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const attempts = await db.getAttemptsByUser(ctx.user.id);
    const completed = attempts.filter(a => a.status === "completed");
    const inProgress = attempts.filter(a => a.status === "in_progress");

    // Calculate category distribution
    const categoryMap = new Map<string, number>();
    for (const attempt of completed) {
      const lesson = await db.getLessonById(attempt.lessonId);
      if (lesson) {
        const cat = lesson.category || "General";
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      }
    }

    // Calculate average score
    const scores = completed
      .filter(a => a.score !== null && a.maxScore !== null && (a.maxScore ?? 0) > 0)
      .map(a => ((a.score ?? 0) / (a.maxScore ?? 1)) * 100);
    const avgScore = scores.length > 0
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    return {
      totalCompleted: completed.length,
      inProgress: inProgress.length,
      averageScore: avgScore,
      categoryDistribution: Object.fromEntries(categoryMap),
      learningStreak: 0, // TODO: calculate from timestamps
    };
  }),
});
