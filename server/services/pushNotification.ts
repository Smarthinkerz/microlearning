/**
 * Push Notification Service
 * 
 * Server-side push notification system using Web Push API (VAPID).
 * Supports shift-aware scheduling, quiet hours, and batched delivery.
 * 
 * Architecture:
 * - Uses Web Push (VAPID) for browser-native push notifications
 * - No FCM dependency — works with all modern browsers
 * - Shift-aware: schedules notifications around shift times
 * - Respects user quiet hours and notification preferences
 */
import webpush from "web-push";
import * as db from "../db";

// VAPID keys should be generated once and stored as env vars
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || "";
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || "";
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:admin@learnshift.app";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// ─── Types ──────────────────────────────────────────────────────────

export type PushPayload = {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{ action: string; title: string; icon?: string }>;
  requireInteraction?: boolean;
  silent?: boolean;
};

export type PushSubscriptionData = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export type ScheduledNotification = {
  userId: number;
  payload: PushPayload;
  scheduledFor: number; // UTC timestamp
  type: "lesson_reminder" | "shift_prep" | "achievement" | "deadline" | "system";
  priority: "high" | "normal" | "low";
};

// ─── Core Push Functions ────────────────────────────────────────────

/**
 * Send a push notification to a specific subscription.
 */
export async function sendPush(
  subscription: PushSubscriptionData,
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    return { success: false, error: "VAPID keys not configured" };
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      JSON.stringify(payload),
      {
        TTL: 3600, // 1 hour TTL
        urgency: "normal",
      }
    );
    return { success: true };
  } catch (err: unknown) {
    const error = err as { statusCode?: number; message?: string };
    // Handle expired/invalid subscriptions
    if (error.statusCode === 410 || error.statusCode === 404) {
      // Subscription is no longer valid — remove it
      return { success: false, error: "subscription_expired" };
    }
    return { success: false, error: error.message || "Unknown push error" };
  }
}

/**
 * Send push notification to all subscriptions for a user.
 */
export async function sendPushToUser(
  userId: number,
  payload: PushPayload
): Promise<{ sent: number; failed: number; expired: number }> {
  const subscriptions = await db.getPushSubscriptions(userId);
  let sent = 0;
  let failed = 0;
  let expired = 0;

  for (const sub of subscriptions) {
    const subData: PushSubscriptionData = {
      endpoint: sub.endpoint,
      keys: { p256dh: sub.p256dh, auth: sub.auth },
    };
    const result = await sendPush(subData, payload);
    if (result.success) {
      sent++;
    } else if (result.error === "subscription_expired") {
      expired++;
      // Remove expired subscription
      await db.removePushSubscription(sub.endpoint);
    } else {
      failed++;
    }
  }

  return { sent, failed, expired };
}

/**
 * Send push notification to all users in an organization.
 */
export async function sendPushToOrg(
  orgId: number,
  payload: PushPayload,
  options?: { respectQuietHours?: boolean }
): Promise<{ totalSent: number; totalFailed: number; skippedQuietHours: number }> {
  const users = await db.getUsersByOrg(orgId);
  let totalSent = 0;
  let totalFailed = 0;
  let skippedQuietHours = 0;

  for (const user of users) {
    // Check quiet hours if requested
    if (options?.respectQuietHours) {
      const isQuiet = await isInQuietHours(user.id);
      if (isQuiet) {
        skippedQuietHours++;
        continue;
      }
    }

    const result = await sendPushToUser(user.id, payload);
    totalSent += result.sent;
    totalFailed += result.failed;
  }

  return { totalSent, totalFailed, skippedQuietHours };
}

// ─── Shift-Aware Scheduling ────────────────────────────────────────

/**
 * Calculate optimal notification time based on user's shift schedule.
 * Sends "lesson before shift" reminders at the right time.
 */
export async function calculateOptimalNotificationTime(
  userId: number,
  targetDate: Date = new Date()
): Promise<number | null> {
  const shifts = await db.getShiftsByUser(userId);
  if (!shifts || shifts.length === 0) return null;

  // Find the next upcoming shift
  const now = Date.now();
  const upcomingShifts = shifts
    .filter(s => s.startTime > now)
    .sort((a, b) => a.startTime - b.startTime);

  if (upcomingShifts.length === 0) return null;

  const nextShift = upcomingShifts[0];
  
  // Send notification 30 minutes before shift starts
  // This gives the user time to complete a micro-lesson
  const notifyTime = nextShift.startTime - (30 * 60 * 1000);

  // Don't send if the notification time has already passed
  if (notifyTime < now) return null;

  // Check if user is in quiet hours at that time
  const isQuiet = await isInQuietHoursAt(userId, notifyTime);
  if (isQuiet) {
    // Try 60 minutes before shift instead
    const altTime = nextShift.startTime - (60 * 60 * 1000);
    if (altTime > now && !(await isInQuietHoursAt(userId, altTime))) {
      return altTime;
    }
    return null;
  }

  return notifyTime;
}

/**
 * Generate shift-aware lesson reminder notifications for all users.
 * Called periodically by the scheduler.
 */
export async function generateShiftReminders(): Promise<{
  scheduled: number;
  skipped: number;
}> {
  // Get all users with upcoming shifts in the next 2 hours
  const twoHoursFromNow = Date.now() + (2 * 60 * 60 * 1000);
  const usersWithShifts = await db.getUsersWithUpcomingShifts(twoHoursFromNow);
  
  let scheduled = 0;
  let skipped = 0;

  for (const row of usersWithShifts) {
    const userId = (row as any).user?.id ?? (row as any).id;
    if (!userId) { skipped++; continue; }
    const optimalTime = await calculateOptimalNotificationTime(userId);
    if (!optimalTime) {
      skipped++;
      continue;
    }

    // Check if user has incomplete assignments
    const assignments = await db.getAssignmentsByUser(userId, "available");
    if (!assignments || assignments.length === 0) {
      skipped++;
      continue;
    }

    const payload: PushPayload = {
      title: "Time for a Quick Lesson!",
      body: `You have ${assignments.length} lesson${assignments.length > 1 ? "s" : ""} to complete before your shift. Start a 5-minute micro-lesson now!`,
      icon: "/favicon.ico",
      tag: `shift-reminder-${userId}-${Date.now()}`,
      data: {
        type: "shift_reminder",
        assignmentCount: assignments.length,
        url: "/dashboard/lessons",
      },
      actions: [
        { action: "start_lesson", title: "Start Lesson" },
        { action: "dismiss", title: "Later" },
      ],
      requireInteraction: true,
    };

    await sendPushToUser(userId, payload);
    scheduled++;
  }

  return { scheduled, skipped };
}

// ─── Quiet Hours ────────────────────────────────────────────────────

async function isInQuietHours(userId: number): Promise<boolean> {
  return isInQuietHoursAt(userId, Date.now());
}

async function isInQuietHoursAt(userId: number, timestamp: number): Promise<boolean> {
  const user = await db.getUserById(userId);
  const prefs = (user?.notificationPreferences as any) ?? {};
  if (!prefs?.quietHoursStart || !prefs?.quietHoursEnd) return false;

  const date = new Date(timestamp);
  const currentHour = date.getHours();
  const currentMinute = date.getMinutes();
  const currentTime = currentHour * 60 + currentMinute;

  const [startH, startM] = (prefs.quietHoursStart as string).split(":").map(Number);
  const [endH, endM] = (prefs.quietHoursEnd as string).split(":").map(Number);
  const startTime = startH * 60 + startM;
  const endTime = endH * 60 + endM;

  // Handle overnight quiet hours (e.g., 22:00 - 07:00)
  if (startTime > endTime) {
    return currentTime >= startTime || currentTime < endTime;
  }

  return currentTime >= startTime && currentTime < endTime;
}

// ─── VAPID Key Generation Utility ───────────────────────────────────

export function generateVapidKeys(): { publicKey: string; privateKey: string } {
  return webpush.generateVAPIDKeys();
}

export function getVapidPublicKey(): string {
  return VAPID_PUBLIC_KEY;
}

export function isPushConfigured(): boolean {
  return Boolean(VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY);
}
