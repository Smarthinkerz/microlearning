/**
 * Review Reminders Router - tRPC procedures for push notifications
 */

import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import {
  upsertReminderPreferences,
  getReminderPreferences,
  scheduleRemindersForDueLessons,
  getPendingReminders,
  markReminderSent,
  markReminderClicked,
  getReminderStats,
  deleteOldReminders,
} from "../reviewReminders";

export const reviewRemindersRouter = router({
  /**
   * Get reminder preferences for current user
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const prefs = await getReminderPreferences(ctx.user.id);
    return prefs;
  }),

  /**
   * Update reminder preferences
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        enableReminders: z.boolean().optional(),
        reminderFrequency: z.enum(["immediate", "daily", "weekly", "never"]).optional(),
        quietHoursEnabled: z.boolean().optional(),
        quietHoursStart: z.string().optional(),
        quietHoursEnd: z.string().optional(),
        enablePushNotifications: z.boolean().optional(),
        enableEmailNotifications: z.boolean().optional(),
        enableInAppNotifications: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await upsertReminderPreferences(ctx.user.id, ctx.user.orgId || 0, input);
      return { success: true };
    }),

  /**
   * Schedule reminders for lessons due for review
   */
  scheduleReminders: protectedProcedure.mutation(async ({ ctx }) => {
    await scheduleRemindersForDueLessons(ctx.user.id, ctx.user.orgId || 0);
    return { success: true };
  }),

  /**
   * Get pending reminders to send (admin only)
   */
  getPendingReminders: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(1000).default(100) }))
    .query(async ({ input }) => {
      const pending = await getPendingReminders(input.limit);
      return pending;
    }),

  /**
   * Mark reminder as sent
   */
  markSent: protectedProcedure
    .input(z.object({ reminderId: z.number() }))
    .mutation(async ({ input }) => {
      await markReminderSent(input.reminderId);
      return { success: true };
    }),

  /**
   * Mark reminder as clicked
   */
  markClicked: protectedProcedure
    .input(z.object({ reminderId: z.number() }))
    .mutation(async ({ input }) => {
      await markReminderClicked(input.reminderId);
      return { success: true };
    }),

  /**
   * Get reminder statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const stats = await getReminderStats(ctx.user.id, ctx.user.orgId || 0);
    return stats;
  }),

  /**
   * Clean up old reminders (admin only)
   */
  cleanupOldReminders: protectedProcedure.mutation(async () => {
    await deleteOldReminders();
    return { success: true };
  }),
});
