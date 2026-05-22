/**
 * A/B Testing Router
 * 
 * tRPC procedures for managing experiments and tracking metrics.
 */
import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import {
  createTest,
  updateTestStatus,
  getOrAssignVariant,
  recordMetric,
  getTestResults,
  getPricingVariant,
} from "../services/abTesting";

export const abTestingRouter = router({
  /**
   * Create a new A/B test (admin only)
   */
  createTest: adminProcedure
    .input(z.object({
      name: z.string(),
      description: z.string().optional(),
      type: z.enum(["pricing", "feature", "ui", "messaging"]),
      targetAudience: z.string().optional(),
      variants: z.array(z.object({
        name: z.string(),
        weight: z.number().min(0).max(100),
        config: z.record(z.string(), z.unknown()).optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const testId = await createTest(
        input.name,
        input.description || "",
        input.type as "pricing" | "feature" | "ui" | "messaging",
        input.targetAudience || "all",
        ctx.user.id,
        input.variants
      );
      return { testId, success: true };
    }),

  /**
   * Update test status (admin only)
   */
  updateStatus: adminProcedure
    .input(z.object({
      testId: z.number(),
      status: z.enum(["draft", "active", "paused", "completed"]),
    }))
    .mutation(async ({ input }) => {
      await updateTestStatus(input.testId, input.status);
      return { success: true };
    }),

  /**
   * Get or assign variant for current user
   */
  getVariant: protectedProcedure
    .input(z.object({
      testId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const assignment = await getOrAssignVariant(ctx.user.id, input.testId);
      return assignment;
    }),

  /**
   * Record a metric event
   */
  recordMetric: protectedProcedure
    .input(z.object({
      testId: z.number(),
      variantId: z.number(),
      metricName: z.string(),
      value: z.number().default(1),
    }))
    .mutation(async ({ input }) => {
      await recordMetric(input.testId, input.variantId, input.metricName, input.value);
      return { success: true };
    }),

  /**
   * Get test results (admin only)
   */
  getResults: adminProcedure
    .input(z.object({
      testId: z.number(),
    }))
    .query(async ({ input }) => {
      const results = await getTestResults(input.testId);
      return results;
    }),

  /**
   * Get pricing variant for current user
   */
  getPricingVariant: protectedProcedure.query(async ({ ctx }) => {
    const variant = await getPricingVariant(ctx.user.id);
    return variant;
  }),
});
