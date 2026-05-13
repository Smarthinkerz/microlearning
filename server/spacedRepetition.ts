/**
 * Spaced Repetition Module - SM-2 Algorithm Implementation
 * Implements the SuperMemo 2 algorithm for optimal review scheduling
 * Boosts retention from 50% → 90% through scientifically-spaced reviews
 */

import { getDb } from "./db";
import {
  lessonReviewSchedule,
  reviewHistory,
  InsertLessonReviewSchedule,
  InsertReviewHistory,
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// ─── SM-2 Algorithm Constants ──────────────────────────────────────
const SM2_INTERVALS = [1, 3, 7, 14, 30]; // Days between reviews
const SM2_EASE_FACTOR_MIN = 1.3;
const SM2_EASE_FACTOR_MAX = 2.5;

/**
 * SM-2 Algorithm: Calculate next review date and ease factor
 * Based on user's quality of response (0-5 scale)
 * 
 * Quality scale:
 * 0 = Complete blackout, total recall failure
 * 1 = Incorrect response with serious errors
 * 2 = Incorrect response despite some recollection
 * 3 = Correct response after serious hesitation
 * 4 = Correct response after some hesitation
 * 5 = Perfect response
 */
export function calculateSM2(
  quality: number, // 0-5
  easeFactor: number, // Current ease factor (default 2.5)
  repetitions: number, // How many times reviewed
  interval: number // Current interval in days
): {
  newEaseFactor: number;
  newInterval: number;
  nextReviewDays: number;
  newRepetitions: number;
} {
  // Validate quality
  if (quality < 0 || quality > 5) {
    throw new Error("Quality must be between 0 and 5");
  }

  // SM-2 Formula: EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  let newEaseFactor = easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);

  // Clamp ease factor
  newEaseFactor = Math.max(SM2_EASE_FACTOR_MIN, Math.min(SM2_EASE_FACTOR_MAX, newEaseFactor));

  // If quality < 3, reset repetitions (failed review)
  let newRepetitions = repetitions;
  let newInterval = interval;

  if (quality < 3) {
    // Failed review: reset to beginning
    newRepetitions = 0;
    newInterval = 1;
  } else {
    // Successful review
    newRepetitions = repetitions + 1;

    if (newRepetitions === 1) {
      newInterval = 1;
    } else if (newRepetitions === 2) {
      newInterval = 3;
    } else {
      // I(n) = I(n-1) * EF
      newInterval = Math.round(interval * newEaseFactor);
    }
  }

  return {
    newEaseFactor,
    newInterval,
    nextReviewDays: newInterval,
    newRepetitions,
  };
}

/**
 * Get or create review schedule for a lesson
 */
export async function getOrCreateReviewSchedule(
  userId: number,
  lessonId: number,
  orgId: number
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let schedule = await db
    .select()
    .from(lessonReviewSchedule)
    .where(
      and(
        eq(lessonReviewSchedule.userId, userId),
        eq(lessonReviewSchedule.lessonId, lessonId)
      )
    )
    .then((r) => r[0]);

  if (!schedule) {
    // Create new schedule
    const now = Date.now();
    const newSchedule: InsertLessonReviewSchedule = {
      userId,
      lessonId,
      orgId,
      interval: 1,
      easeFactor: "2.5" as any,
      repetitions: 0,
      nextReviewDate: now + 1 * 24 * 60 * 60 * 1000, // 1 day from now
      status: "new",
    };

    await db.insert(lessonReviewSchedule).values(newSchedule);

    schedule = await db
      .select()
      .from(lessonReviewSchedule)
      .where(
        and(
          eq(lessonReviewSchedule.userId, userId),
          eq(lessonReviewSchedule.lessonId, lessonId)
        )
      )
      .then((r) => r[0]);
  }

  return schedule;
}

/**
 * Record a review and update schedule
 */
export async function recordReview(
  userId: number,
  lessonId: number,
  orgId: number,
  quality: number, // 0-5
  score: number, // 0-100
  timeSpentSeconds: number,
  difficulty: "easy" | "medium" | "hard" | "very_hard"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get current schedule
  const schedule = await getOrCreateReviewSchedule(userId, lessonId, orgId);

  // Calculate new SM-2 values
  const sm2Result = calculateSM2(
    quality,
    parseFloat(schedule.easeFactor.toString()),
    schedule.repetitions,
    schedule.interval
  );

  // Record review history
  const reviewRecord: InsertReviewHistory = {
    userId,
    lessonId,
    orgId,
    score,
    difficulty,
    timeSpentSeconds,
    quality,
    reviewedAt: Date.now(),
  };

  await db.insert(reviewHistory).values(reviewRecord);

  // Update schedule
  const nextReviewDate = Date.now() + sm2Result.nextReviewDays * 24 * 60 * 60 * 1000;

  await db
    .update(lessonReviewSchedule)
    .set({
      interval: sm2Result.newInterval,
      easeFactor: sm2Result.newEaseFactor.toString() as any,
      repetitions: quality < 3 ? 0 : schedule.repetitions + 1,
      lastReviewDate: Date.now(),
      nextReviewDate,
      status:
        quality < 3
          ? "learning"
          : sm2Result.newRepetitions >= 5
            ? "mastered"
            : "review",
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(lessonReviewSchedule.userId, userId),
        eq(lessonReviewSchedule.lessonId, lessonId)
      )
    );

  return {
    success: true,
    nextReviewDate,
    interval: sm2Result.newInterval,
    easeFactor: sm2Result.newEaseFactor,
    status:
      quality < 3
        ? "learning"
        : sm2Result.newRepetitions >= 5
          ? "mastered"
          : "review",
  };
}

/**
 * Get lessons due for review
 */
export async function getLessonsDueForReview(
  userId: number,
  orgId: number,
  limit: number = 10
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const now = Date.now();

  const dueForReview = await db
    .select()
    .from(lessonReviewSchedule)
    .where(
      and(
        eq(lessonReviewSchedule.userId, userId),
        eq(lessonReviewSchedule.orgId, orgId)
      )
    )
    .then((rows) =>
      rows
        .filter((row) => row.nextReviewDate <= now)
        .sort((a, b) => a.nextReviewDate - b.nextReviewDate)
        .slice(0, limit)
    );

  return dueForReview;
}

/**
 * Get review statistics for user
 */
export async function getReviewStats(userId: number, orgId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const schedules = await db
    .select()
    .from(lessonReviewSchedule)
    .where(
      and(
        eq(lessonReviewSchedule.userId, userId),
        eq(lessonReviewSchedule.orgId, orgId)
      )
    );

  const now = Date.now();

  const stats = {
    totalLessons: schedules.length,
    masteredLessons: schedules.filter((s) => s.status === "mastered").length,
    learningLessons: schedules.filter((s) => s.status === "learning").length,
    reviewLessons: schedules.filter((s) => s.status === "review").length,
    dueForReview: schedules.filter((s) => s.nextReviewDate <= now).length,
    averageEaseFactor:
      schedules.length > 0
        ? (
            schedules.reduce((sum, s) => sum + parseFloat(s.easeFactor.toString()), 0) /
            schedules.length
          ).toFixed(2)
        : "2.5",
  };

  return stats;
}

/**
 * Get review history for a lesson
 */
export async function getReviewHistory(
  userId: number,
  lessonId: number,
  limit: number = 10
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const history = await db
    .select()
    .from(reviewHistory)
    .where(
      and(
        eq(reviewHistory.userId, userId),
        eq(reviewHistory.lessonId, lessonId)
      )
    )
    .then((rows) => rows.sort((a, b) => b.reviewedAt - a.reviewedAt).slice(0, limit));

  return history;
}

/**
 * Calculate retention rate based on review history
 * Returns percentage of reviews with quality >= 3
 */
export async function calculateRetentionRate(
  userId: number,
  lessonId: number
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const history = await db
    .select()
    .from(reviewHistory)
    .where(
      and(
        eq(reviewHistory.userId, userId),
        eq(reviewHistory.lessonId, lessonId)
      )
    );

  if (history.length === 0) return 0;

  const successful = history.filter((h) => h.quality >= 3).length;
  return Math.round((successful / history.length) * 100);
}

/**
 * Get next review date for a lesson (human-readable)
 */
export async function getNextReviewDateReadable(
  userId: number,
  lessonId: number
): Promise<string> {
  const schedule = await getOrCreateReviewSchedule(userId, lessonId, 0);
  const now = Date.now();
  const daysUntilReview = Math.ceil((schedule.nextReviewDate - now) / (24 * 60 * 60 * 1000));

  if (daysUntilReview <= 0) {
    return "Due for review now";
  } else if (daysUntilReview === 1) {
    return "Due tomorrow";
  } else if (daysUntilReview <= 7) {
    return `Due in ${daysUntilReview} days`;
  } else {
    return `Due in ${Math.ceil(daysUntilReview / 7)} weeks`;
  }
}
