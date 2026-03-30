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
  /**
   * Get VAPID public key for client-side subscription.
   */
  getVapidKey: publicProcedure.query(() => {
    return {
      publicKey: getVapidPublicKey(),
      configured: isPushConfigured(),
    };
  }),

  /**
   * Register a push subscription for the current user.
   */
  subscribe: protectedProcedure
    .input(z.object({
      endpoint: z.string().url(),
      keys: z.object({
        p256dh: z.string(),
        auth: z.string(),
      }),
      userAgent: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await db.savePushSubscription(
        ctx.user.id,
        input.endpoint,
        input.keys.p256dh,
        input.keys.auth,
        input.userAgent
      );
      return { success: true };
    }),

  /**
   * Unsubscribe from push notifications.
   */
  unsubscribe: protectedProcedure
    .input(z.object({
      endpoint: z.string().url(),
    }))
    .mutation(async ({ input }) => {
      await db.removePushSubscription(input.endpoint);
      return { success: true };
    }),

  /**
   * Send a push notification to a specific user (admin only).
   */
  sendToUser: adminProcedure
    .input(z.object({
      userId: z.number(),
      title: z.string(),
      body: z.string(),
      data: z.record(z.string(), z.unknown()).optional(),
    }))
    .mutation(async ({ input }) => {
      const payload: PushPayload = {
        title: input.title,
        body: input.body,
        icon: "/favicon.ico",
        data: input.data,
      };
      return sendPushToUser(input.userId, payload);
    }),

  /**
   * Send a push notification to all users in an org (admin only).
   */
  sendToOrg: adminProcedure
    .input(z.object({
      orgId: z.number(),
      title: z.string(),
      body: z.string(),
      respectQuietHours: z.boolean().optional(),
    }))
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

  /**
   * Trigger shift-aware lesson reminders (admin or cron).
   */
  triggerShiftReminders: adminProcedure.mutation(async () => {
    return generateShiftReminders();
  }),

  /**
   * Update notification preferences for the current user.
   */
  updatePreferences: protectedProcedure
    .input(z.object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      inApp: z.boolean().optional(),
      quietHoursStart: z.string().optional(),
      quietHoursEnd: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const currentPrefs = await db.getUserNotificationPrefs(ctx.user.id);
      const updatedPrefs = {
        email: input.email ?? currentPrefs?.email ?? true,
        push: input.push ?? currentPrefs?.push ?? true,
        inApp: input.inApp ?? currentPrefs?.inApp ?? true,
        quietHoursStart: input.quietHoursStart ?? currentPrefs?.quietHoursStart,
        quietHoursEnd: input.quietHoursEnd ?? currentPrefs?.quietHoursEnd,
      };
      await db.updateUser(ctx.user.id, { notificationPreferences: updatedPrefs });
      return updatedPrefs;
    }),

  /**
   * Get notification preferences for the current user.
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const prefs = await db.getUserNotificationPrefs(ctx.user.id);
    return prefs || { email: true, push: true, inApp: true };
  }),
});
