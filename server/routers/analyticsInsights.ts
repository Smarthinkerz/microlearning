/**
 * Analytics Insights Router
 * 
 * Provides endpoints for actionable insights, alerts, benchmarks, and cohort analysis.
 */
import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import {
  generateInsights,
  generateAlerts,
  getIndustryBenchmarks,
  getCohortAnalysis,
} from "../services/analyticsInsights";

export const analyticsInsightsRouter = router({
  /**
   * Get actionable insights for the organization.
   */
  getInsights: adminProcedure.query(async ({ ctx }) => {
    const orgId = (ctx.user as any).orgId;
    if (!orgId) return [];
    return generateInsights(orgId);
  }),

  /**
   * Get engagement alerts for individual users.
   */
  getAlerts: adminProcedure
    .input(z.object({
      severity: z.enum(["info", "warning", "critical", "success"]).optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const orgId = (ctx.user as any).orgId;
      if (!orgId) return [];
      const alerts = await generateAlerts(orgId);
      if (input?.severity) {
        return alerts.filter(a => a.severity === input.severity);
      }
      return alerts;
    }),

  /**
   * Get industry benchmark comparisons.
   */
  getBenchmarks: adminProcedure.query(async ({ ctx }) => {
    const orgId = (ctx.user as any).orgId;
    if (!orgId) return [];
    return getIndustryBenchmarks(orgId);
  }),

  /**
   * Get cohort analysis by department/team.
   */
  getCohorts: adminProcedure.query(async ({ ctx }) => {
    const orgId = (ctx.user as any).orgId;
    if (!orgId) return [];
    return getCohortAnalysis(orgId);
  }),
});
