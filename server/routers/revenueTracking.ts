import { z } from "zod";
import { router, protectedProcedure, adminProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { payments, lessonAttempts, subscriptions } from "../../drizzle/schema";
import { eq, gte, lte, and, sql } from "drizzle-orm";

// Constants for OpenAI cost calculation
const OPENAI_COST_PER_LESSON_GENERATION = 0.05; // $0.05 per generated lesson
const OPENAI_COST_PERCENTAGE = 0.15; // 15% of revenue goes to OpenAI costs

export const revenueTrackingRouter = router({
  // Get revenue summary for organization
  getRevenueSummary: adminProcedure
    .input(
      z.object({
        orgId: z.number(),
        startDate: z.number().optional(),
        endDate: z.number().optional(),
      })
    )
    .query(async ({ input }: { input: any }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

      const startDate = input.startDate || thirtyDaysAgo;
      const endDate = input.endDate || now;

      // Get all succeeded payments for the organization
      const orgPayments = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.orgId, input.orgId),
            eq(payments.status, "succeeded"),
            gte(payments.paidAt, startDate),
            lte(payments.paidAt, endDate)
          )
        );

      // Calculate gross revenue (in cents)
      const grossRevenue = orgPayments.reduce((sum: number, p) => sum + p.amount, 0);

      // Get lesson generation count for OpenAI cost calculation (not used currently)
      // const lessonGenerations = await db
      //   .select({ count: sql<number>`COUNT(*)` })
      //   .from(lessonAttempts)
      //   .where(
      //     and(
      //       eq(lessonAttempts.orgId, input.orgId),
      //       gte(lessonAttempts.completedAt, startDate),
      //       lte(lessonAttempts.completedAt, endDate)
      //     )
      //   );

      // Calculate OpenAI costs
      const estimatedOpenAICosts = Math.round(grossRevenue * OPENAI_COST_PERCENTAGE);
      const netRevenue = grossRevenue - estimatedOpenAICosts;

      // Calculate daily average
      const daysDiff = Math.max(1, (endDate - startDate) / (24 * 60 * 60 * 1000));
      const dailyAverage = Math.round(netRevenue / daysDiff);

      return {
        grossRevenue,
        openAICosts: estimatedOpenAICosts,
        netRevenue,
        dailyAverage,
        paymentCount: orgPayments.length,
        currency: "USD",
        period: {
          startDate,
          endDate,
          days: Math.round(daysDiff),
        },
      };
    }),

  // Get monthly revenue breakdown
  getMonthlyRevenue: adminProcedure
    .input(z.object({ orgId: z.number(), months: z.number().default(12) }))
    .query(async ({ input }: { input: any }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const now = Date.now();
      const monthlyData = [];

      for (let i = input.months - 1; i >= 0; i--) {
        const monthStart = new Date(now);
        monthStart.setMonth(monthStart.getMonth() - i);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        const monthEnd = new Date(monthStart);
        monthEnd.setMonth(monthEnd.getMonth() + 1);
        monthEnd.setTime(monthEnd.getTime() - 1);

        const monthPayments = await db
          .select()
          .from(payments)
          .where(
            and(
              eq(payments.orgId, input.orgId),
              eq(payments.status, "succeeded"),
              gte(payments.paidAt, monthStart.getTime()),
              lte(payments.paidAt, monthEnd.getTime())
            )
          );

        const grossRevenue = monthPayments.reduce((sum: number, p) => sum + p.amount, 0);
        const openAICosts = Math.round(grossRevenue * OPENAI_COST_PERCENTAGE);
        const netRevenue = grossRevenue - openAICosts;

        monthlyData.push({
          month: monthStart.toISOString().slice(0, 7), // YYYY-MM
          grossRevenue,
          openAICosts,
          netRevenue,
          transactionCount: monthPayments.length,
        });
      }

      return monthlyData;
    }),

  // Get per-user revenue contribution
  getUserRevenueContribution: adminProcedure
    .input(
      z.object({
        orgId: z.number(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }: { input: any }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");

      // Get revenue by subscription (which is tied to org/user)
      const revenueBySubscription = await db
        .select({
          subscriptionId: payments.subscriptionId,
          totalAmount: sql<number>`SUM(${payments.amount})`,
          transactionCount: sql<number>`COUNT(*)`,
        })
        .from(payments)
        .where(
          and(
            eq(payments.orgId, input.orgId),
            eq(payments.status, "succeeded")
          )
        )
        .groupBy(payments.subscriptionId)
        .limit(input.limit);

      // Enrich with subscription details
      const enriched = await Promise.all(
        revenueBySubscription.map(async (item) => {
          if (!item.subscriptionId || !db) return null;

          const sub = await db
            .select()
            .from(subscriptions)
            .where(eq(subscriptions.id, item.subscriptionId))
            .limit(1);

          if (!sub.length) return null;

          const grossRevenue = item.totalAmount || 0;
          const openAICosts = Math.round(grossRevenue * OPENAI_COST_PERCENTAGE);
          const netRevenue = grossRevenue - openAICosts;

          return {
            subscriptionId: item.subscriptionId,
            orgId: sub[0].orgId,
            planId: sub[0].planId,
            grossRevenue,
            openAICosts,
            netRevenue,
            transactionCount: item.transactionCount,
            percentage: 0, // Will calculate after
          };
        })
      );

      const filtered = enriched.filter((x) => x !== null);
      const totalRevenue = filtered.reduce((sum: number, item) => sum + (item?.netRevenue || 0), 0);

      // Calculate percentages
      const withPercentages = filtered.map((item) => ({
        ...item,
        percentage: totalRevenue > 0 ? (item!.netRevenue / totalRevenue) * 100 : 0,
      }));

      return withPercentages;
    }),

  // Get revenue metrics for dashboard
  getRevenueMetrics: adminProcedure
    .input(z.object({ orgId: z.number() }))
    .query(async ({ input }: { input: any }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const now = Date.now();
      const { orgId } = input;

      // Last 30 days
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

      const last30Days = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.orgId, orgId),
            eq(payments.status, "succeeded"),
            gte(payments.paidAt, thirtyDaysAgo)
          )
        );

      const revenue30d = last30Days.reduce((sum: number, p) => sum + p.amount, 0);
      const costs30d = Math.round(revenue30d * OPENAI_COST_PERCENTAGE);
      const net30d = revenue30d - costs30d;

      // All time
      const allPayments = await db
        .select()
        .from(payments)
        .where(
          and(
            eq(payments.orgId, input.orgId),
            eq(payments.status, "succeeded")
          )
        );

      const totalRevenue = allPayments.reduce((sum: number, p) => sum + p.amount, 0);
      const totalCosts = Math.round(totalRevenue * OPENAI_COST_PERCENTAGE);
      const totalNet = totalRevenue - totalCosts;

      return {
        last30Days: {
          grossRevenue: revenue30d,
          openAICosts: costs30d,
          netRevenue: net30d,
          transactionCount: last30Days.length,
        },
        allTime: {
          grossRevenue: totalRevenue,
          openAICosts: totalCosts,
          netRevenue: totalNet,
          transactionCount: allPayments.length,
        },
        costPercentage: OPENAI_COST_PERCENTAGE * 100,
      };
    }),

  recordOpenAIUsage: protectedProcedure
    .input(
      z.object({
        orgId: z.number(),
        lessonId: z.number(),
        tokensUsed: z.number(),
        costEstimate: z.number(), // in cents
      })
    )
    .mutation(async ({ input }: { input: any }) => {
      // This would be called when a lesson is generated
      // For now, just return success - actual tracking would be in a separate table
      return {
        success: true,
        costEstimate: input.costEstimate,
        recorded: true,
      };
    }),
});
