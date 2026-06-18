/**
 * Push Notification Router
 *
 * tRPC procedures for managing push subscriptions and sending notifications.
 */
import { z } from "zod";
import { protectedProcedure, adminProcedure, publicProcedure, router } from "../_core/trpc";
import * as db from "../db";
import {
  sendPushToUser,
  sendPushToOrg,
  getVapidPublicKey,
  isPushConfigured,
  generateShiftReminders,
  type PushPayload,
} from "../services/pushNotification";

export const pushRouter = router({
  /** Get VAPID public key for client-side subscription. */
  getVapidKey: publicProcedure.query(() => {
    return {
      publicKey: getVapidPublicKey(),
      configured: isPushConfigured(),
    };
  }),

  /** Register a push subscription for the current user. */
  subscribe: protectedProcedure
    .input(
      z.object({
        endpoint: z.string().url(),
        keys: z.object({
          p256dh: z.string(),
          auth: z.string(),
        }),
        userAgent: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await db.savePushSubscription({
        userId: ctx.user.id,
        endpoint: input.endpoint,
        p256dh: input.keys.p256dh,
        auth: input.keys.auth,
        userAgent: input.userAgent,
      });
      return { success: true };
    }),

  /** Unsubscribe from push notifications. */
  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string().url() }))
    .mutation(async ({ input }) => {
      await db.removePushSubscription(input.endpoint);
      return { success: true };
    }),

  /** Send a push notification to a specific user (admin only). */
  sendToUser: adminProcedure
    .input(
      z.object({
        userId: z.number(),
        title: z.string(),
        body: z.string(),
        data: z.record(z.string(), z.unknown()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const payload: PushPayload = {
        title: input.title,
        body: input.body,
        icon: "/favicon.ico",
        data: input.data,
      };
      return sendPushToUser(input.userId, payload);
    }),

  /** Send a push notification to all users in an org (admin only). */
  sendToOrg: adminProcedure
    .input(
      z.object({
        orgId: z.number(),
        title: z.string(),
        body: z.string(),
        respectQuietHours: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const payload: PushPayload = {
        title: input.title,
        body: input.body,
        icon: "/favicon.ico",
      };
      return sendPushToOrg(input.orgId, payload, {
        respectQuietHours: input.respectQuietHours,
      });
    }),

  /** Trigger shift-aware lesson reminders (admin or cron). */
  triggerShiftReminders: adminProcedure.mutation(async () => {
    return generateShiftReminders();
  }),

  /** Update notification preferences for the current user. */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        email: z.boolean().optional(),
        push: z.boolean().optional(),
        inApp: z.boolean().optional(),
        quietHoursStart: z.string().optional(),
        quietHoursEnd: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const currentUser = await db.getUserById(ctx.user.id);
      const currentNotifPrefs = (currentUser?.notificationPreferences as any) ?? {};
      const updatedPrefs = {
        email: input.email ?? currentNotifPrefs.email ?? true,
        push: input.push ?? currentNotifPrefs.push ?? true,
        inApp: input.inApp ?? currentNotifPrefs.inApp ?? true,
        quietHoursStart: input.quietHoursStart ?? currentNotifPrefs.quietHoursStart,
        quietHoursEnd: input.quietHoursEnd ?? currentNotifPrefs.quietHoursEnd,
      };
      await db.updateUser(ctx.user.id, { notificationPreferences: updatedPrefs });
      return updatedPrefs;
    }),

  /** Get notification preferences for the current user. */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.getUserById(ctx.user.id);
    const prefs = (user?.notificationPreferences as any) ?? {};
    return {
      email: prefs.email ?? true,
      push: prefs.push ?? true,
      inApp: prefs.inApp ?? true,
      quietHoursStart: prefs.quietHoursStart ?? null,
      quietHoursEnd: prefs.quietHoursEnd ?? null,
    };
  }),
});
