/**
 * Marketplace & Gamification Router
 * 
 * Provides endpoints for lesson packs, challenges, achievements, leaderboard, and reviews.
 */
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import {
  getMarketplacePacks,
  getActiveChallenges,
  checkAchievements,
  getAllAchievements,
  getLeaderboard,
} from "../services/marketplace";

export const marketplaceRouter = router({
  /**
   * Get available lesson packs in the marketplace.
   */
  getPacks: publicProcedure
    .input(z.object({
      industry: z.string().optional(),
      featured: z.boolean().optional(),
    }).optional())
    .query(async ({ input }) => {
      let packs = await getMarketplacePacks();
      if (input?.industry) {
        packs = packs.filter(p => p.industry === input.industry);
      }
      if (input?.featured) {
        packs = packs.filter(p => p.featured);
      }
      return packs;
    }),

  /**
   * Get active challenges (daily, weekly, monthly).
   */
  getChallenges: protectedProcedure.query(() => {
    return getActiveChallenges();
  }),

  /**
   * Get user's achievements and progress.
   */
  getAchievements: protectedProcedure.query(async ({ ctx }) => {
    const unlocked = await checkAchievements(ctx.user.id);
    const all = getAllAchievements();
    return {
      all,
      unlocked,
      totalUnlocked: unlocked.length,
      totalAvailable: all.length,
      totalXpEarned: unlocked.reduce((sum, a) => sum + a.xpReward, 0),
    };
  }),

  /**
   * Get the leaderboard.
   */
  getLeaderboard: protectedProcedure
    .input(z.object({
      orgId: z.number().optional(),
      limit: z.number().min(1).max(100).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const orgId = input?.orgId || (ctx.user as any).orgId;
      return getLeaderboard(orgId, input?.limit || 50);
    }),

  /**
   * Get marketplace statistics.
   */
  getStats: publicProcedure.query(async () => {
    const packs = await getMarketplacePacks();
    return {
      totalPacks: packs.length,
      totalLessons: packs.reduce((sum, p) => sum + p.lessonCount, 0),
      totalEnrollments: packs.reduce((sum, p) => sum + p.enrollmentCount, 0),
      industries: Array.from(new Set(packs.map(p => p.industry))),
      avgRating: packs.length > 0
        ? Math.round((packs.reduce((sum, p) => sum + p.rating, 0) / packs.length) * 10) / 10
        : 0,
    };
  }),
});
