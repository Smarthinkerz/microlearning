/**
 * Gamification Module - Achievements, Points, and Leaderboards
 * Handles all gamification logic including achievement unlocking, point calculations, and leaderboard management
 */

import { getDb } from "./db";
import {
  achievements,
  userAchievements,
  userPoints,
  leaderboardCache,
  lessonAttempts,
  users,
} from "../drizzle/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";

// ─── Achievement Definitions ────────────────────────────────────────
export const ACHIEVEMENT_DEFINITIONS = [
  {
    name: "First Lesson",
    description: "Complete your first lesson",
    icon: "🎓",
    category: "learning" as const,
    rarity: "common" as const,
    points: 10,
    criteria: { type: "lesson_count" as const, value: 1 },
  },
  {
    name: "Perfect Score",
    description: "Score 100% on a lesson",
    icon: "⭐",
    category: "performance" as const,
    rarity: "uncommon" as const,
    points: 25,
    criteria: { type: "perfect_score" as const, value: 1 },
  },
  {
    name: "7-Day Streak",
    description: "Complete lessons 7 days in a row",
    icon: "🔥",
    category: "consistency" as const,
    rarity: "rare" as const,
    points: 50,
    criteria: { type: "streak_days" as const, value: 7 },
  },
  {
    name: "30-Day Streak",
    description: "Complete lessons 30 days in a row",
    icon: "🌟",
    category: "consistency" as const,
    rarity: "epic" as const,
    points: 100,
    criteria: { type: "streak_days" as const, value: 30 },
  },
  {
    name: "Lesson Master",
    description: "Complete 10 lessons",
    icon: "🏆",
    category: "learning" as const,
    rarity: "uncommon" as const,
    points: 30,
    criteria: { type: "lesson_count" as const, value: 10 },
  },
  {
    name: "Lesson Expert",
    description: "Complete 25 lessons",
    icon: "👑",
    category: "learning" as const,
    rarity: "rare" as const,
    points: 75,
    criteria: { type: "lesson_count" as const, value: 25 },
  },
  {
    name: "Lesson Legend",
    description: "Complete 50 lessons",
    icon: "💎",
    category: "learning" as const,
    rarity: "legendary" as const,
    points: 150,
    criteria: { type: "lesson_count" as const, value: 50 },
  },
  {
    name: "Quick Learner",
    description: "Complete 5 lessons with 90%+ score",
    icon: "⚡",
    category: "performance" as const,
    rarity: "uncommon" as const,
    points: 40,
    criteria: { type: "completion_rate" as const, value: 90 },
  },
  {
    name: "Master Communicator",
    description: "Score 100% on 5 communication lessons",
    icon: "💬",
    category: "mastery" as const,
    rarity: "rare" as const,
    points: 60,
    criteria: { type: "score_threshold" as const, value: 100 },
  },
  {
    name: "Safety Champion",
    description: "Score 100% on 5 safety lessons",
    icon: "🛡️",
    category: "mastery" as const,
    rarity: "rare" as const,
    points: 60,
    criteria: { type: "score_threshold" as const, value: 100 },
  },
  {
    name: "Consistency King",
    description: "Maintain a 14-day streak",
    icon: "👑",
    category: "consistency" as const,
    rarity: "epic" as const,
    points: 80,
    criteria: { type: "streak_days" as const, value: 14 },
  },
  {
    name: "Rising Star",
    description: "Reach level 5",
    icon: "✨",
    category: "learning" as const,
    rarity: "uncommon" as const,
    points: 35,
    criteria: { type: "custom" as const, value: "level_5" },
  },
];

// ─── Points System ─────────────────────────────────────────────────
export const POINTS_RULES = {
  LESSON_COMPLETION: 1,
  PERFECT_SCORE: 5,
  STREAK_BONUS: 10,
  FIRST_COMPLETION: 2,
};

const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 3500, 5000, 7000, 10000];

// ─── Achievement Checking ──────────────────────────────────────────
export async function checkAndUnlockAchievements(userId: number) {
  const dbInstance = await getDb();
  if (!dbInstance) throw new Error("Database not available");

  const attempts = (await dbInstance
    .select()
    .from(lessonAttempts)
    .where(eq(lessonAttempts.userId, userId))) as any[];

  const currentAchievements = (await dbInstance
    .select()
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId))) as any[];

  const unlockedAchievementIds = new Set(
    currentAchievements.map((a: any) => a.achievementId)
  );

  const allAchievements = (await dbInstance
    .select()
    .from(achievements)
    .where(eq(achievements.isActive, true))) as any[];

  const newlyUnlocked = [];

  for (const achievement of allAchievements) {
    if (unlockedAchievementIds.has(achievement.id)) continue;

    const shouldUnlock = checkAchievementCriteria(
      achievement.criteria as any,
      attempts,
      userId
    );

    if (shouldUnlock) {
      await dbInstance.insert(userAchievements).values({
        userId,
        achievementId: achievement.id,
        unlockedAt: new Date(),
      });
      newlyUnlocked.push(achievement);
    }
  }

  return newlyUnlocked;
}

function checkAchievementCriteria(
  criteria: any,
  attempts: any[],
  userId: number
): boolean {
  switch (criteria.type) {
    case "lesson_count":
      return attempts.length >= criteria.value;

    case "perfect_score":
      return attempts.some((a: any) => a.score === 100);

    case "streak_days":
      return calculateCurrentStreak(attempts) >= criteria.value;

    case "completion_rate":
      const avgScore =
        attempts.length > 0
          ? (attempts as any[]).reduce((sum: number, a: any) => sum + (a.score || 0), 0) / attempts.length
          : 0;
      return avgScore >= criteria.value;

    case "score_threshold":
      return attempts.filter((a: any) => a.score >= criteria.value).length >= 5;

    case "custom":
      return false;

    default:
      return false;
  }
}

// ─── Streak Calculation ────────────────────────────────────────────
export function calculateCurrentStreak(attempts: any[]): number {
  if (attempts.length === 0) return 0;

  const sorted = [...attempts].sort(
    (a: any, b: any) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  let streak = 0;
  let currentDate = new Date();
  currentDate.setHours(0, 0, 0, 0);

  for (const attempt of sorted) {
    const attemptDate = new Date((attempt as any).completedAt as string);
    attemptDate.setHours(0, 0, 0, 0);

    const dayDiff = Math.floor(
      (currentDate.getTime() - attemptDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (dayDiff === streak) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

// ─── Points Management ─────────────────────────────────────────────
export async function addPoints(
  userId: number,
  points: number,
  reason: string
) {
  const dbInstance = await getDb();
  if (!dbInstance) throw new Error("Database not available");

  let userPointsRecord = await dbInstance
    .select()
    .from(userPoints)
    .where(eq(userPoints.userId, userId))
    .then((r: any[]) => r[0]);

  if (!userPointsRecord) {
    await dbInstance.insert(userPoints).values({
      userId,
      totalPoints: 0,
      level: 1,
      currentLevelPoints: 0,
      nextLevelThreshold: LEVEL_THRESHOLDS[1],
    });
    userPointsRecord = await dbInstance
      .select()
      .from(userPoints)
      .where(eq(userPoints.userId, userId))
      .then((r: any[]) => r[0]);
  }

  const newTotalPoints = (userPointsRecord?.totalPoints || 0) + points;
  let newLevel = userPointsRecord?.level || 1;
  let newCurrentLevelPoints = (userPointsRecord?.currentLevelPoints || 0) + points;

  while (
    newCurrentLevelPoints >= LEVEL_THRESHOLDS[newLevel] &&
    newLevel < LEVEL_THRESHOLDS.length - 1
  ) {
    newCurrentLevelPoints -= LEVEL_THRESHOLDS[newLevel];
    newLevel++;
  }

  await dbInstance
    .update(userPoints)
    .set({
      totalPoints: newTotalPoints,
      level: newLevel,
      currentLevelPoints: newCurrentLevelPoints,
      nextLevelThreshold:
        newLevel < LEVEL_THRESHOLDS.length
          ? LEVEL_THRESHOLDS[newLevel]
          : LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1],
      updatedAt: new Date(),
    })
    .where(eq(userPoints.userId, userId));

  return {
    totalPoints: newTotalPoints,
    level: newLevel,
    currentLevelPoints: newCurrentLevelPoints,
    leveledUp: newLevel > (userPointsRecord?.level || 1),
  };
}

// ─── Leaderboard Management ────────────────────────────────────────
export async function updateLeaderboards(
  userId: number,
  orgId?: number
) {
  const dbInstance = await getDb();
  if (!dbInstance) throw new Error("Database not available");

  const userPointsRecord = await dbInstance
    .select()
    .from(userPoints)
    .where(eq(userPoints.userId, userId))
    .then((r: any[]) => r[0]);

  const userAttempts = (await dbInstance
    .select()
    .from(lessonAttempts)
    .where(eq(lessonAttempts.userId, userId))) as any[];

  const perfectScores = userAttempts.filter((a: any) => a.score === 100).length;
  const currentStreak = calculateCurrentStreak(userAttempts);

  if (!userPointsRecord) return;

  await dbInstance
    .delete(leaderboardCache)
    .where(
      and(
        eq(leaderboardCache.userId, userId),
        eq(leaderboardCache.scope, "personal")
      )
    );

  await dbInstance.insert(leaderboardCache).values({
    userId,
    scope: "personal",
    rank: 1,
    points: userPointsRecord.totalPoints,
    level: userPointsRecord.level,
    lessonsCompleted: userAttempts.length,
    perfectScores,
    currentStreak,
  });

  if (orgId) {
    const orgUsers = (await dbInstance
      .select()
      .from(users)
      .where(eq(users.orgId, orgId))) as any[];

    const leaderboardData = [];

    for (const user of orgUsers) {
      const points = await dbInstance
        .select()
        .from(userPoints)
        .where(eq(userPoints.userId, user.id))
        .then((r: any[]) => r[0]);

      const attempts = (await dbInstance
        .select()
        .from(lessonAttempts)
        .where(eq(lessonAttempts.userId, user.id))) as any[];

      leaderboardData.push({
        userId: user.id,
        orgId,
        scope: "organization" as const,
        points: points?.totalPoints || 0,
        level: points?.level || 1,
        lessonsCompleted: attempts.length,
        perfectScores: attempts.filter((a: any) => a.score === 100).length,
        currentStreak: calculateCurrentStreak(attempts),
      });
    }

    leaderboardData.sort((a: any, b: any) => b.points - a.points);

    await dbInstance
      .delete(leaderboardCache)
      .where(
        and(
          eq(leaderboardCache.orgId, orgId),
          eq(leaderboardCache.scope, "organization")
        )
      );

    for (let i = 0; i < leaderboardData.length; i++) {
      await dbInstance.insert(leaderboardCache).values({
        ...(leaderboardData[i] as any),
        rank: i + 1,
      });
    }
  }
}

// ─── Leaderboard Retrieval ─────────────────────────────────────────
export async function getLeaderboard(
  scope: "personal" | "team" | "organization" | "global",
  userId?: number,
  orgId?: number,
  limit: number = 50
) {
  const dbInstance = await getDb();
  if (!dbInstance) throw new Error("Database not available");

  const whereConditions: any[] = [eq(leaderboardCache.scope, scope)];
  if (scope === "organization" && orgId) {
    whereConditions.push(eq(leaderboardCache.orgId, orgId));
  }

  const entries = await dbInstance
    .select()
    .from(leaderboardCache)
    .where(and(...whereConditions))
    .orderBy(desc(leaderboardCache.points))
    .limit(limit);

  const enriched = await Promise.all(
    entries.map(async (entry: any) => {
      const user = await dbInstance
        .select()
        .from(users)
        .where(eq(users.id, entry.userId))
        .then((r: any[]) => r[0]);

      return {
        ...entry,
        userName: user?.name || "Unknown",
        userEmail: user?.email || "",
        userAvatar: user?.avatarUrl || "",
      };
    })
  );

  return enriched;
}

// ─── User Stats ────────────────────────────────────────────────────
export async function getUserStats(userId: number) {
  const dbInstance = await getDb();
  if (!dbInstance) throw new Error("Database not available");

  const userPointsRecord = await dbInstance
    .select()
    .from(userPoints)
    .where(eq(userPoints.userId, userId))
    .then((r: any[]) => r[0]);

  const userAchievementsList = (await dbInstance
    .select()
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId))) as any[];

  const attempts = (await dbInstance
    .select()
    .from(lessonAttempts)
    .where(eq(lessonAttempts.userId, userId))) as any[];

  const avgScore =
    attempts.length > 0
      ? (attempts as any[]).reduce((sum: number, a: any) => sum + (a.score || 0), 0) / attempts.length
      : 0;

  return {
    totalPoints: userPointsRecord?.totalPoints || 0,
    level: userPointsRecord?.level || 1,
    currentLevelPoints: userPointsRecord?.currentLevelPoints || 0,
    nextLevelThreshold: userPointsRecord?.nextLevelThreshold || 100,
    achievementsCount: userAchievementsList.length,
    lessonsCompleted: attempts.length,
    perfectScores: attempts.filter((a: any) => a.score === 100).length,
    currentStreak: calculateCurrentStreak(attempts),
    averageScore: Math.round(avgScore),
  };
}

// ─── Initialize Achievements (Seed) ────────────────────────────────
export async function seedAchievements() {
  const dbInstance = await getDb();
  if (!dbInstance) throw new Error("Database not available");

  const existingCount = await dbInstance
    .select()
    .from(achievements)
    .then((r: any[]) => r.length);

  if (existingCount > 0) {
    console.log(
      `[Gamification] Achievements already seeded (${existingCount} found), skipping.`
    );
    return;
  }

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    await dbInstance.insert(achievements).values({
      ...def,
      isActive: true,
    });
  }

  console.log(
    `[Gamification] Seeded ${ACHIEVEMENT_DEFINITIONS.length} achievements`
  );
}
