/**
 * Gamification Router - tRPC procedures for achievements, points, and leaderboards
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  checkAndUnlockAchievements,
  addPoints,
  updateLeaderboards,
  getLeaderboard,
  getUserStats,
  seedAchievements,
} from "../gamification";

export const gamificationRouter = router({
  /**
   * Get user's current achievements and stats
   */
  getUserAchievements: protectedProcedure.query(async ({ ctx }) => {
    const stats = await getUserStats(ctx.user.id);
    return stats;
  }),

  /**
   * Get leaderboard for specified scope
   */
  getLeaderboard: protectedProcedure
    .input(
      z.object({
        scope: z.enum(["personal", "team", "organization", "global"]),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const leaderboard = await getLeaderboard(
        input.scope,
        ctx.user.id,
        ctx.user.orgId || undefined,
        input.limit
      );
      return leaderboard;
    }),

  /**
   * Check and unlock achievements for user
   * Called after lesson completion
   */
  checkAchievements: protectedProcedure.mutation(async ({ ctx }) => {
    const newlyUnlocked = await checkAndUnlockAchievements(ctx.user.id);
    return {
      success: true,
      newAchievements: newlyUnlocked,
    };
  }),

  /**
   * Add points to user (internal use)
   */
  addPoints: protectedProcedure
    .input(
      z.object({
        points: z.number().min(1),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await addPoints(ctx.user.id, input.points, input.reason);
      return result;
    }),

  /**
   * Update leaderboards (admin only)
   */
  updateLeaderboards: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        orgId: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Only allow users to update their own leaderboards or admins
      if (ctx.user.id !== input.userId && ctx.user.appRole !== "super_admin") {
        throw new Error("Unauthorized");
      }

      await updateLeaderboards(input.userId, input.orgId);
      return { success: true };
    }),
});
