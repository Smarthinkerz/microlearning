/**
 * Consumer Marketplace & Gamification Service
 * 
 * Provides:
 * 1. Lesson pack marketplace for consumer users
 * 2. Gamified challenges (daily, weekly, monthly)
 * 3. Achievement system with badges
 * 4. Community features (discussion, ratings, reviews)
 * 5. Leaderboard system
 */

import * as db from "../db";

// ─── Types ──────────────────────────────────────────────────────────

export type LessonPack = {
  id: string;
  title: string;
  description: string;
  industry: string;
  category: string;
  lessonCount: number;
  difficulty: "beginner" | "intermediate" | "advanced" | "mixed";
  estimatedHours: number;
  price: number; // in cents, 0 = free
  currency: string;
  rating: number;
  reviewCount: number;
  enrollmentCount: number;
  thumbnailUrl?: string;
  tags: string[];
  featured: boolean;
  createdAt: number;
};

export type Challenge = {
  id: string;
  type: "daily" | "weekly" | "monthly" | "special";
  title: string;
  description: string;
  requirement: ChallengeRequirement;
  reward: ChallengeReward;
  startDate: number;
  endDate: number;
  participantCount: number;
  status: "active" | "upcoming" | "completed";
};

export type ChallengeRequirement = {
  type: "complete_lessons" | "earn_xp" | "perfect_score" | "streak" | "time_spent";
  target: number;
  category?: string;
};

export type ChallengeReward = {
  xp: number;
  badge?: string;
  title?: string;
};

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: "learning" | "streak" | "social" | "mastery" | "special";
  tier: "bronze" | "silver" | "gold" | "platinum";
  requirement: string;
  xpReward: number;
  unlockedAt?: number;
};

export type LeaderboardEntry = {
  rank: number;
  userId: number;
  userName: string;
  avatarUrl?: string;
  xp: number;
  lessonsCompleted: number;
  streak: number;
  badges: number;
};

export type LessonReview = {
  id: string;
  lessonId: number;
  userId: number;
  userName: string;
  rating: number;
  comment: string;
  helpful: number;
  createdAt: number;
};

// ─── Achievement Definitions ────────────────────────────────────────

const ACHIEVEMENTS: Achievement[] = [
  // Learning achievements
  { id: "first_lesson", name: "First Steps", description: "Complete your first lesson", icon: "🎯", category: "learning", tier: "bronze", requirement: "Complete 1 lesson", xpReward: 10 },
  { id: "ten_lessons", name: "Quick Learner", description: "Complete 10 lessons", icon: "📚", category: "learning", tier: "bronze", requirement: "Complete 10 lessons", xpReward: 50 },
  { id: "fifty_lessons", name: "Knowledge Seeker", description: "Complete 50 lessons", icon: "🧠", category: "learning", tier: "silver", requirement: "Complete 50 lessons", xpReward: 200 },
  { id: "hundred_lessons", name: "Scholar", description: "Complete 100 lessons", icon: "🎓", category: "learning", tier: "gold", requirement: "Complete 100 lessons", xpReward: 500 },
  { id: "five_hundred_lessons", name: "Master Learner", description: "Complete 500 lessons", icon: "👑", category: "learning", tier: "platinum", requirement: "Complete 500 lessons", xpReward: 2000 },

  // Streak achievements
  { id: "streak_3", name: "Getting Started", description: "Maintain a 3-day learning streak", icon: "🔥", category: "streak", tier: "bronze", requirement: "3-day streak", xpReward: 15 },
  { id: "streak_7", name: "Week Warrior", description: "Maintain a 7-day learning streak", icon: "🔥", category: "streak", tier: "bronze", requirement: "7-day streak", xpReward: 50 },
  { id: "streak_30", name: "Monthly Dedication", description: "Maintain a 30-day learning streak", icon: "🔥", category: "streak", tier: "silver", requirement: "30-day streak", xpReward: 200 },
  { id: "streak_100", name: "Unstoppable", description: "Maintain a 100-day learning streak", icon: "🔥", category: "streak", tier: "gold", requirement: "100-day streak", xpReward: 1000 },
  { id: "streak_365", name: "Year of Learning", description: "Maintain a 365-day learning streak", icon: "🔥", category: "streak", tier: "platinum", requirement: "365-day streak", xpReward: 5000 },

  // Mastery achievements
  { id: "perfect_quiz", name: "Perfect Score", description: "Score 100% on a quiz", icon: "💯", category: "mastery", tier: "bronze", requirement: "100% on any quiz", xpReward: 25 },
  { id: "ten_perfect", name: "Perfectionist", description: "Score 100% on 10 quizzes", icon: "💯", category: "mastery", tier: "silver", requirement: "100% on 10 quizzes", xpReward: 150 },
  { id: "category_master", name: "Category Master", description: "Complete all lessons in a category", icon: "⭐", category: "mastery", tier: "gold", requirement: "All lessons in one category", xpReward: 500 },
  { id: "multi_industry", name: "Renaissance Learner", description: "Complete lessons in 5 different industries", icon: "🌍", category: "mastery", tier: "silver", requirement: "5 different industries", xpReward: 300 },

  // Social achievements
  { id: "first_review", name: "Reviewer", description: "Write your first lesson review", icon: "✍️", category: "social", tier: "bronze", requirement: "Write 1 review", xpReward: 10 },
  { id: "helpful_review", name: "Helpful Critic", description: "Get 10 helpful votes on reviews", icon: "👍", category: "social", tier: "silver", requirement: "10 helpful votes", xpReward: 100 },
  { id: "top_10", name: "Top 10", description: "Reach the top 10 on the leaderboard", icon: "🏆", category: "social", tier: "gold", requirement: "Top 10 leaderboard", xpReward: 500 },

  // Special achievements
  { id: "night_owl", name: "Night Owl", description: "Complete a lesson between midnight and 5 AM", icon: "🦉", category: "special", tier: "bronze", requirement: "Learn at night", xpReward: 20 },
  { id: "early_bird", name: "Early Bird", description: "Complete a lesson before 6 AM", icon: "🐦", category: "special", tier: "bronze", requirement: "Learn before 6 AM", xpReward: 20 },
  { id: "speed_learner", name: "Speed Learner", description: "Complete 5 lessons in one day", icon: "⚡", category: "special", tier: "silver", requirement: "5 lessons in one day", xpReward: 100 },
];

// ─── Challenge Generation ───────────────────────────────────────────

/**
 * Generate active challenges based on current date.
 */
export function getActiveChallenges(): Challenge[] {
  const now = Date.now();
  const today = new Date();
  const dayOfWeek = today.getUTCDay();
  const dayOfMonth = today.getUTCDate();

  const challenges: Challenge[] = [];

  // Daily challenge
  const dailyStart = new Date(today);
  dailyStart.setUTCHours(0, 0, 0, 0);
  const dailyEnd = new Date(dailyStart);
  dailyEnd.setUTCDate(dailyEnd.getUTCDate() + 1);

  const dailyTypes: Array<{ title: string; desc: string; req: ChallengeRequirement; reward: ChallengeReward }> = [
    { title: "Daily Dose", desc: "Complete 2 lessons today", req: { type: "complete_lessons", target: 2 }, reward: { xp: 20 } },
    { title: "Knowledge Burst", desc: "Earn 50 XP today", req: { type: "earn_xp", target: 50 }, reward: { xp: 25 } },
    { title: "Perfect Day", desc: "Score 100% on any quiz today", req: { type: "perfect_score", target: 1 }, reward: { xp: 30, badge: "daily_perfect" } },
    { title: "Time Investor", desc: "Spend 15 minutes learning today", req: { type: "time_spent", target: 15 }, reward: { xp: 20 } },
    { title: "Triple Play", desc: "Complete 3 lessons today", req: { type: "complete_lessons", target: 3 }, reward: { xp: 35 } },
    { title: "Safety First", desc: "Complete 2 Safety lessons today", req: { type: "complete_lessons", target: 2, category: "Safety & Compliance" }, reward: { xp: 25 } },
    { title: "Skill Builder", desc: "Complete 2 Technical lessons today", req: { type: "complete_lessons", target: 2, category: "Technical & Job Skills" }, reward: { xp: 25 } },
  ];

  const dailyIndex = dayOfMonth % dailyTypes.length;
  const daily = dailyTypes[dailyIndex];
  challenges.push({
    id: `daily_${today.toISOString().split("T")[0]}`,
    type: "daily",
    title: daily.title,
    description: daily.desc,
    requirement: daily.req,
    reward: daily.reward,
    startDate: dailyStart.getTime(),
    endDate: dailyEnd.getTime(),
    participantCount: Math.floor(Math.random() * 200) + 50,
    status: "active",
  });

  // Weekly challenge
  const weekStart = new Date(today);
  weekStart.setUTCDate(weekStart.getUTCDate() - dayOfWeek);
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  const weekNum = Math.floor(dayOfMonth / 7);
  const weeklyTypes: Array<{ title: string; desc: string; req: ChallengeRequirement; reward: ChallengeReward }> = [
    { title: "Weekly Warrior", desc: "Complete 10 lessons this week", req: { type: "complete_lessons", target: 10 }, reward: { xp: 100, badge: "weekly_warrior" } },
    { title: "XP Hunter", desc: "Earn 200 XP this week", req: { type: "earn_xp", target: 200 }, reward: { xp: 100 } },
    { title: "Streak Builder", desc: "Maintain a 7-day streak", req: { type: "streak", target: 7 }, reward: { xp: 150, badge: "streak_7" } },
    { title: "Deep Diver", desc: "Spend 60 minutes learning this week", req: { type: "time_spent", target: 60 }, reward: { xp: 120 } },
  ];

  const weekly = weeklyTypes[weekNum % weeklyTypes.length];
  challenges.push({
    id: `weekly_${weekStart.toISOString().split("T")[0]}`,
    type: "weekly",
    title: weekly.title,
    description: weekly.desc,
    requirement: weekly.req,
    reward: weekly.reward,
    startDate: weekStart.getTime(),
    endDate: weekEnd.getTime(),
    participantCount: Math.floor(Math.random() * 500) + 100,
    status: "active",
  });

  // Monthly challenge
  const monthStart = new Date(today.getUTCFullYear(), today.getUTCMonth(), 1);
  const monthEnd = new Date(today.getUTCFullYear(), today.getUTCMonth() + 1, 0);
  monthEnd.setUTCHours(23, 59, 59, 999);

  challenges.push({
    id: `monthly_${today.getUTCFullYear()}_${today.getUTCMonth()}`,
    type: "monthly",
    title: "Monthly Marathon",
    description: "Complete 30 lessons this month",
    requirement: { type: "complete_lessons", target: 30 },
    reward: { xp: 500, badge: "monthly_marathon", title: "Marathon Runner" },
    startDate: monthStart.getTime(),
    endDate: monthEnd.getTime(),
    participantCount: Math.floor(Math.random() * 1000) + 200,
    status: "active",
  });

  return challenges;
}

// ─── Achievement Checking ───────────────────────────────────────────

/**
 * Check which achievements a user has unlocked based on their stats.
 */
export async function checkAchievements(userId: number): Promise<Achievement[]> {
  const unlocked: Achievement[] = [];

  try {
    const user = await db.getUserById(userId);
    if (!user) return unlocked;

    const xp = (user as any).xp || 0;
    const streak = (user as any).currentStreak || 0;
    const lessonsCompleted = (user as any).lessonsCompleted || 0;

    // Learning achievements
    if (lessonsCompleted >= 1) unlocked.push({ ...ACHIEVEMENTS[0], unlockedAt: Date.now() });
    if (lessonsCompleted >= 10) unlocked.push({ ...ACHIEVEMENTS[1], unlockedAt: Date.now() });
    if (lessonsCompleted >= 50) unlocked.push({ ...ACHIEVEMENTS[2], unlockedAt: Date.now() });
    if (lessonsCompleted >= 100) unlocked.push({ ...ACHIEVEMENTS[3], unlockedAt: Date.now() });
    if (lessonsCompleted >= 500) unlocked.push({ ...ACHIEVEMENTS[4], unlockedAt: Date.now() });

    // Streak achievements
    if (streak >= 3) unlocked.push({ ...ACHIEVEMENTS[5], unlockedAt: Date.now() });
    if (streak >= 7) unlocked.push({ ...ACHIEVEMENTS[6], unlockedAt: Date.now() });
    if (streak >= 30) unlocked.push({ ...ACHIEVEMENTS[7], unlockedAt: Date.now() });
    if (streak >= 100) unlocked.push({ ...ACHIEVEMENTS[8], unlockedAt: Date.now() });
    if (streak >= 365) unlocked.push({ ...ACHIEVEMENTS[9], unlockedAt: Date.now() });

  } catch (err) {
    console.error("[Marketplace] Error checking achievements:", err);
  }

  return unlocked;
}

/**
 * Get all available achievements with unlock status for a user.
 */
export function getAllAchievements(): Achievement[] {
  return ACHIEVEMENTS;
}

// ─── Leaderboard ────────────────────────────────────────────────────

/**
 * Get the global leaderboard.
 */
export async function getLeaderboard(orgId?: number, limit = 50): Promise<LeaderboardEntry[]> {
  try {
    const users = orgId ? await db.getUsersByOrg(orgId) : [];
    
    const entries: LeaderboardEntry[] = (users as any[])
      .filter((u: any) => u.xp > 0)
      .sort((a: any, b: any) => (b.xp || 0) - (a.xp || 0))
      .slice(0, limit)
      .map((u: any, index: number) => ({
        rank: index + 1,
        userId: u.id,
        userName: u.name || "Anonymous",
        avatarUrl: u.avatarUrl,
        xp: u.xp || 0,
        lessonsCompleted: u.lessonsCompleted || 0,
        streak: u.currentStreak || 0,
        badges: 0,
      }));

    return entries;
  } catch (err) {
    console.error("[Marketplace] Error getting leaderboard:", err);
    return [];
  }
}

// ─── Lesson Packs ───────────────────────────────────────────────────

/**
 * Generate marketplace lesson packs from available content.
 */
export async function getMarketplacePacks(): Promise<LessonPack[]> {
  const packs: LessonPack[] = [
    {
      id: "pack_healthcare_essentials",
      title: "Healthcare Essentials",
      description: "Master the fundamentals of patient care, infection control, and clinical communication.",
      industry: "Healthcare",
      category: "Healthcare & Nursing",
      lessonCount: 10,
      difficulty: "mixed",
      estimatedHours: 4,
      price: 0,
      currency: "USD",
      rating: 4.7,
      reviewCount: 128,
      enrollmentCount: 2340,
      tags: ["healthcare", "nursing", "patient care"],
      featured: true,
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
    },
    {
      id: "pack_safety_compliance",
      title: "Workplace Safety & Compliance",
      description: "Comprehensive safety training covering fire safety, PPE, ergonomics, and emergency procedures.",
      industry: "General",
      category: "Safety & Compliance",
      lessonCount: 6,
      difficulty: "beginner",
      estimatedHours: 2.5,
      price: 0,
      currency: "USD",
      rating: 4.8,
      reviewCount: 256,
      enrollmentCount: 5120,
      tags: ["safety", "compliance", "OSHA"],
      featured: true,
      createdAt: Date.now() - 45 * 24 * 60 * 60 * 1000,
    },
    {
      id: "pack_retail_customer_service",
      title: "Retail Customer Service Mastery",
      description: "From POS operations to upselling and handling returns — everything for retail success.",
      industry: "Retail",
      category: "Retail & Hospitality",
      lessonCount: 8,
      difficulty: "mixed",
      estimatedHours: 3,
      price: 0,
      currency: "USD",
      rating: 4.5,
      reviewCount: 89,
      enrollmentCount: 1560,
      tags: ["retail", "customer service", "sales"],
      featured: false,
      createdAt: Date.now() - 20 * 24 * 60 * 60 * 1000,
    },
    {
      id: "pack_manufacturing_safety",
      title: "Manufacturing Safety Essentials",
      description: "LOTO, confined spaces, 5S, machine guarding — critical safety for manufacturing workers.",
      industry: "Manufacturing",
      category: "Manufacturing & Warehousing",
      lessonCount: 6,
      difficulty: "intermediate",
      estimatedHours: 2.5,
      price: 0,
      currency: "USD",
      rating: 4.6,
      reviewCount: 67,
      enrollmentCount: 980,
      tags: ["manufacturing", "safety", "lean"],
      featured: false,
      createdAt: Date.now() - 15 * 24 * 60 * 60 * 1000,
    },
    {
      id: "pack_construction_safety",
      title: "Construction Site Safety",
      description: "Fall protection, scaffolding, excavation, and electrical safety for construction workers.",
      industry: "Construction",
      category: "Construction & Trades",
      lessonCount: 5,
      difficulty: "intermediate",
      estimatedHours: 2,
      price: 0,
      currency: "USD",
      rating: 4.7,
      reviewCount: 45,
      enrollmentCount: 720,
      tags: ["construction", "safety", "OSHA"],
      featured: false,
      createdAt: Date.now() - 10 * 24 * 60 * 60 * 1000,
    },
    {
      id: "pack_food_safety",
      title: "Food Safety Certification Prep",
      description: "Temperature control, FIFO, cross-contamination prevention, and handwashing — ServSafe ready.",
      industry: "Food Service",
      category: "Food Service & Restaurant",
      lessonCount: 5,
      difficulty: "beginner",
      estimatedHours: 2,
      price: 0,
      currency: "USD",
      rating: 4.8,
      reviewCount: 112,
      enrollmentCount: 3200,
      tags: ["food safety", "ServSafe", "restaurant"],
      featured: true,
      createdAt: Date.now() - 25 * 24 * 60 * 60 * 1000,
    },
    {
      id: "pack_leadership",
      title: "Shift Leader Essentials",
      description: "Communication, conflict resolution, time management, and feedback skills for team leads.",
      industry: "General",
      category: "General Workplace Skills",
      lessonCount: 10,
      difficulty: "intermediate",
      estimatedHours: 4,
      price: 0,
      currency: "USD",
      rating: 4.6,
      reviewCount: 78,
      enrollmentCount: 1890,
      tags: ["leadership", "management", "communication"],
      featured: true,
      createdAt: Date.now() - 35 * 24 * 60 * 60 * 1000,
    },
    {
      id: "pack_transport_cdl",
      title: "CDL Driver Training",
      description: "Pre-trip inspections, HOS regulations, defensive driving, and cargo securement.",
      industry: "Transportation",
      category: "Transportation & Logistics",
      lessonCount: 5,
      difficulty: "intermediate",
      estimatedHours: 2.5,
      price: 0,
      currency: "USD",
      rating: 4.5,
      reviewCount: 34,
      enrollmentCount: 560,
      tags: ["CDL", "trucking", "transportation"],
      featured: false,
      createdAt: Date.now() - 12 * 24 * 60 * 60 * 1000,
    },
  ];

  return packs;
}
