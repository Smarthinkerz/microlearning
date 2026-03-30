import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import {
  reportManualBreach,
  processUnnotifiedBreaches,
} from "../services/breachDetection";

/**
 * Admin-only guard for breach management.
 */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const breachRouter = router({
  /** List all breach events (admin only) */
  list: adminProcedure
    .input(z.object({ limit: z.number().min(1).max(200).optional() }).optional())
    .query(async ({ input }) => {
      const events = await db.getBreachEvents(input?.limit ?? 50);
      return events;
    }),

  /** Get a specific breach event by ID */
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const event = await db.getBreachEventById(input.id);
      if (!event) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Breach event not found" });
      }
      return event;
    }),

  /** Update breach event status */
  updateStatus: adminProcedure
    .input(
      z.object({
        id: z.number(),
        status: z.enum(["detected", "investigating", "contained", "resolved", "false_positive"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const resolvedAt = ["resolved", "false_positive"].includes(input.status)
        ? Date.now()
        : undefined;

      await db.updateBreachEventStatus(input.id, input.status, resolvedAt);

      await db.createAuditLog({
        userId: ctx.user.id,
        action: "breach.status_update",
        resourceType: "breach_event",
        details: {
          breachId: input.id,
          newStatus: input.status,
        } as any,
      });

      return { success: true };
    }),

  /** Manually report a breach event */
  report: adminProcedure
    .input(
      z.object({
        description: z.string().min(10).max(2000),
        affectedUserCount: z.number().min(0),
        severity: z.enum(["low", "medium", "high", "critical"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const breachId = await reportManualBreach(
        input.description,
        input.affectedUserCount,
        input.severity,
        ctx.user.id
      );

      return { success: true, breachId };
    }),

  /** Trigger processing of unnotified breaches (admin only) */
  processUnnotified: adminProcedure.mutation(async () => {
    const count = await processUnnotifiedBreaches();
    return { success: true, notifiedCount: count };
  }),

  /** Get breach statistics summary */
  stats: adminProcedure.query(async () => {
    const events = await db.getBreachEvents(200);

    const total = events.length;
    const bySeverity = {
      critical: events.filter((e: any) => e.severity === "critical").length,
      high: events.filter((e: any) => e.severity === "high").length,
      medium: events.filter((e: any) => e.severity === "medium").length,
      low: events.filter((e: any) => e.severity === "low").length,
    };
    const byStatus = {
      detected: events.filter((e: any) => e.status === "detected").length,
      investigating: events.filter((e: any) => e.status === "investigating").length,
      contained: events.filter((e: any) => e.status === "contained").length,
      resolved: events.filter((e: any) => e.status === "resolved").length,
      false_positive: events.filter((e: any) => e.status === "false_positive").length,
    };
    const unnotified = events.filter((e: any) => !e.notifiedAt && e.status !== "false_positive").length;

    return { total, bySeverity, byStatus, unnotified };
  }),
});
