/**
 * Spaced Repetition Router - tRPC procedures for SM-2 algorithm
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  getOrCreateReviewSchedule,
  recordReview,
  getLessonsDueForReview,
  getReviewStats,
  getReviewHistory,
  calculateRetentionRate,
  getNextReviewDateReadable,
} from "../spacedRepetition";

export const spacedRepetitionRouter = router({
  /**
   * Get lessons due for review
   */
  getLessonsDueForReview: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      const dueForReview = await getLessonsDueForReview(
        ctx.user.id,
        ctx.user.orgId || 0,
        input.limit
      );
      return dueForReview;
    }),

  /**
   * Record a review and update schedule
   */
  recordReview: protectedProcedure
    .input(
      z.object({
        lessonId: z.number(),
        quality: z.number().min(0).max(5), // 0-5 scale
        score: z.number().min(0).max(100),
        timeSpentSeconds: z.number().min(0),
        difficulty: z.enum(["easy", "medium", "hard", "very_hard"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await recordReview(
        ctx.user.id,
        input.lessonId,
        ctx.user.orgId || 0,
        input.quality,
        input.score,
        input.timeSpentSeconds,
        input.difficulty
      );
      return result;
    }),

  /**
   * Get review statistics
   */
  getReviewStats: protectedProcedure.query(async ({ ctx }) => {
    const stats = await getReviewStats(ctx.user.id, ctx.user.orgId || 0);
    return stats;
  }),

  /**
   * Get review history for a lesson
   */
  getReviewHistory: protectedProcedure
    .input(z.object({ lessonId: z.number(), limit: z.number().min(1).max(50).default(10) }))
    .query(async ({ ctx, input }) => {
      const history = await getReviewHistory(ctx.user.id, input.lessonId, input.limit);
      return history;
    }),

  /**
   * Get retention rate for a lesson
   */
  getRetentionRate: protectedProcedure
    .input(z.object({ lessonId: z.number() }))
    .query(async ({ ctx, input }) => {
      const rate = await calculateRetentionRate(ctx.user.id, input.lessonId);
      return { retentionRate: rate };
    }),

  /**
   * Get next review date (human-readable)
   */
  getNextReviewDate: protectedProcedure
    .input(z.object({ lessonId: z.number() }))
    .query(async ({ ctx, input }) => {
      const nextReviewDate = await getNextReviewDateReadable(ctx.user.id, input.lessonId);
      return { nextReviewDate };
    }),

  /**
   * Get or create review schedule
   */
  getSchedule: protectedProcedure
    .input(z.object({ lessonId: z.number() }))
    .query(async ({ ctx, input }) => {
      const schedule = await getOrCreateReviewSchedule(
        ctx.user.id,
        input.lessonId,
        ctx.user.orgId || 0
      );
      return schedule;
    }),
});
