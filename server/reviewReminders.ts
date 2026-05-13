/**
 * Review Reminders Module
 * Manages push notifications for lessons due for review
 */

import { getDb } from "./db";
import {
  reviewReminders,
  reminderPreferences,
  lessonReviewSchedule,
  InsertReviewReminder,
} from "../drizzle/schema";
import { eq, and, lte, isNull } from "drizzle-orm";

/**
 * Create or update reminder preferences for user
 */
export async function upsertReminderPreferences(
  userId: number,
  orgId: number,
  preferences: Partial<{
    enableReminders: boolean;
    reminderFrequency: string;
    quietHoursEnabled: boolean;
    quietHoursStart: string;
    quietHoursEnd: string;
    enablePushNotifications: boolean;
    enableEmailNotifications: boolean;
    enableInAppNotifications: boolean;
  }>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(reminderPreferences)
    .where(eq(reminderPreferences.userId, userId))
    .then((r) => r[0]);

  if (existing) {
    await db
      .update(reminderPreferences)
      .set({
        ...preferences,
        updatedAt: new Date(),
      } as any)
      .where(eq(reminderPreferences.userId, userId));
  } else {
    await db.insert(reminderPreferences).values({
      userId,
      orgId,
      ...preferences,
    } as any);
  }
}

/**
 * Get reminder preferences for user
 */
export async function getReminderPreferences(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const prefs = await db
    .select()
    .from(reminderPreferences)
    .where(eq(reminderPreferences.userId, userId))
    .then((r) => r[0]);

  // Return defaults if not found
  return prefs || {
    enableReminders: true,
    reminderFrequency: "daily",
    quietHoursEnabled: false,
    enablePushNotifications: true,
    enableEmailNotifications: false,
    enableInAppNotifications: true,
  };
}

/**
 * Schedule reminders for lessons due for review
 */
export async function scheduleRemindersForDueLessons(
  userId: number,
  orgId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get user's reminder preferences
  const prefs = await getReminderPreferences(userId);
  if (!prefs.enableReminders) return;

  // Get lessons due for review
  const now = Date.now();
  const dueLessons = await db
    .select()
    .from(lessonReviewSchedule)
    .where(
      and(
        eq(lessonReviewSchedule.userId, userId),
        eq(lessonReviewSchedule.orgId, orgId),
        lte(lessonReviewSchedule.nextReviewDate, now + 24 * 60 * 60 * 1000) // Due within 24 hours
      )
    );

  // Create reminders for each due lesson
  for (const lesson of dueLessons) {
    // Check if reminder already exists
    const existing = await db
      .select()
      .from(reviewReminders)
      .where(
        and(
          eq(reviewReminders.userId, userId),
          eq(reviewReminders.lessonId, lesson.lessonId),
          isNull(reviewReminders.sentAt)
        )
      )
      .then((r) => r[0]);

    if (!existing) {
      // Determine reminder type
      let reminderType = "due_now";
      const hoursUntilDue = (lesson.nextReviewDate - now) / (60 * 60 * 1000);

      if (hoursUntilDue > 24) {
        reminderType = "due_this_week";
      } else if (hoursUntilDue > 0) {
        reminderType = "due_tomorrow";
      }

      // Schedule reminder
      const reminderTime = calculateReminderTime(
        lesson.nextReviewDate,
        prefs.quietHoursStart,
        prefs.quietHoursEnd,
        prefs.quietHoursEnabled
      );

      const newReminder: InsertReviewReminder = {
        userId,
        lessonId: lesson.lessonId,
        orgId,
        reminderTime,
        reminderType: reminderType as any,
        sent: false,
      } as any;

      await db.insert(reviewReminders).values(newReminder);
    }
  }
}

/**
 * Get pending reminders to send
 */
export async function getPendingReminders(limit: number = 100) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = Date.now();

  const pending = await db
    .select()
    .from(reviewReminders)
    .where(
      and(
        eq(reviewReminders.sent, false),
        lte(reviewReminders.reminderTime, now)
      )
    )
    .then((r) => r.slice(0, limit));

  return pending;
}

/**
 * Mark reminder as sent
 */
export async function markReminderSent(reminderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(reviewReminders)
    .set({
      sent: true,
      sentAt: Date.now(),
      updatedAt: new Date(),
    })
    .where(eq(reviewReminders.id, reminderId));
}

/**
 * Mark reminder as clicked
 */
export async function markReminderClicked(reminderId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .update(reviewReminders)
    .set({
      clicked: true,
      clickedAt: Date.now(),
      updatedAt: new Date(),
    })
    .where(eq(reviewReminders.id, reminderId));
}

/**
 * Get reminder statistics
 */
export async function getReminderStats(userId: number, orgId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const reminders = await db
    .select()
    .from(reviewReminders)
    .where(
      and(
        eq(reviewReminders.userId, userId),
        eq(reviewReminders.orgId, orgId)
      )
    );

  const stats = {
    totalReminders: reminders.length,
    sentReminders: reminders.filter((r) => r.sent).length,
    clickedReminders: reminders.filter((r) => r.clicked).length,
    clickThroughRate:
      reminders.filter((r) => r.sent).length > 0
        ? (
            (reminders.filter((r) => r.clicked).length /
              reminders.filter((r) => r.sent).length) *
            100
          ).toFixed(1)
        : "0",
  };

  return stats;
}

/**
 * Calculate optimal reminder time (respecting quiet hours)
 */
function calculateReminderTime(
  nextReviewDate: number,
  quietHoursStart?: string | null,
  quietHoursEnd?: string | null,
  quietHoursEnabled?: boolean
): number {
  if (!quietHoursEnabled || !quietHoursStart || !quietHoursEnd) {
    // Send reminder 1 hour before due time
    return nextReviewDate - 60 * 60 * 1000;
  }

  const reviewDate = new Date(nextReviewDate);
  const [startHour, startMin] = quietHoursStart.split(":").map(Number);
  const [endHour, endMin] = quietHoursEnd.split(":").map(Number);

  // Create quiet hours range for that day
  const quietStart = new Date(reviewDate);
  quietStart.setHours(startHour, startMin, 0, 0);

  const quietEnd = new Date(reviewDate);
  quietEnd.setHours(endHour, endMin, 0, 0);

  // If review time is during quiet hours, schedule for after quiet hours
  if (nextReviewDate >= quietStart.getTime() && nextReviewDate <= quietEnd.getTime()) {
    return quietEnd.getTime();
  }

  // Otherwise, send 1 hour before
  return nextReviewDate - 60 * 60 * 1000;
}

/**
 * Delete old reminders (older than 30 days)
 */
export async function deleteOldReminders() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

  await db
    .delete(reviewReminders)
    .where(
      and(
        eq(reviewReminders.sent, true),
        lte(reviewReminders.sentAt, thirtyDaysAgo)
      )
    );
}
