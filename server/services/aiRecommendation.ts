/**
 * Data-Driven AI Recommendation Engine
 * 
 * Replaces prompt-only AI with a hybrid approach:
 * 1. Collaborative filtering: "users like you also completed..."
 * 2. Content-based filtering: skill gaps + learning path optimization
 * 3. Contextual signals: shift schedule, time of day, device, energy level
 * 4. LLM reasoning: generates explanations and personalizes presentation
 * 
 * Each recommendation includes:
 * - Confidence score (0-1, calibrated)
 * - Explainability text (why this was recommended)
 * - Source signals (which data points drove the recommendation)
 */
import { invokeLLM } from "../_core/llm";
import * as db from "../db";

// ─── Types ──────────────────────────────────────────────────────────

export type RecommendationSignal = {
  source: "collaborative" | "content_gap" | "schedule" | "performance" | "recency" | "popularity";
  weight: number;
  description: string;
};

export type LessonRecommendation = {
  lessonId: number;
  title: string;
  category: string;
  durationMinutes: number;
  confidenceScore: number; // 0-1
  explanation: string;
  signals: RecommendationSignal[];
  priority: "high" | "medium" | "low";
  estimatedRelevance: number; // 0-100
};

export type RecommendationContext = {
  userId: number;
  orgId?: number;
  currentTime: number;
  timezone: string;
  deviceType?: "mobile" | "desktop" | "tablet";
  availableMinutes?: number;
  preferredCategories?: string[];
};

// ─── Signal Computation ─────────────────────────────────────────────

/**
 * Compute collaborative filtering signal.
 * Finds lessons completed by similar users (same org, similar role, similar completion patterns).
 */
async function computeCollaborativeSignal(
  userId: number,
  orgId: number | undefined,
  completedLessonIds: Set<number>
): Promise<Map<number, RecommendationSignal>> {
  const signals = new Map<number, RecommendationSignal>();
  
  if (!orgId) return signals;

  // Get all lesson completions in the org (excluding current user)
  const orgAttempts = await db.getOrgCompletionPatterns(orgId, userId);
  
  // Count how many other users completed each lesson
  const lessonPopularity = new Map<number, number>();
  for (const attempt of orgAttempts) {
    if (!completedLessonIds.has(attempt.lessonId)) {
      lessonPopularity.set(
        attempt.lessonId,
        (lessonPopularity.get(attempt.lessonId) || 0) + 1
      );
    }
  }

  // Normalize and create signals
  const maxPop = Math.max(...Array.from(lessonPopularity.values()), 1);
  for (const [lessonId, count] of Array.from(lessonPopularity.entries())) {
    const normalizedWeight = count / maxPop;
    signals.set(lessonId, {
      source: "collaborative",
      weight: normalizedWeight * 0.25, // 25% max weight
      description: `${count} colleague${count > 1 ? "s" : ""} in your organization completed this lesson`,
    });
  }

  return signals;
}

/**
 * Compute content gap signal.
 * Identifies skill areas where the user has low coverage.
 */
async function computeContentGapSignal(
  userId: number,
  completedLessonIds: Set<number>
): Promise<Map<number, RecommendationSignal>> {
  const signals = new Map<number, RecommendationSignal>();

  // Get all available lessons
  const allLessons = await db.getAllPublishedLessons();
  
  // Group completed lessons by category
  const completedByCategory = new Map<string, number>();
  const totalByCategory = new Map<string, number>();

  for (const lesson of allLessons) {
    const cat = lesson.category || "General";
    totalByCategory.set(cat, (totalByCategory.get(cat) || 0) + 1);
    if (completedLessonIds.has(lesson.id)) {
      completedByCategory.set(cat, (completedByCategory.get(cat) || 0) + 1);
    }
  }

  // Find categories with low completion rates
  for (const lesson of allLessons) {
    if (completedLessonIds.has(lesson.id)) continue;
    
    const cat = lesson.category || "General";
    const completed = completedByCategory.get(cat) || 0;
    const total = totalByCategory.get(cat) || 1;
    const coverageRate = completed / total;

    // Lower coverage = higher signal weight
    if (coverageRate < 0.5) {
      signals.set(lesson.id, {
        source: "content_gap",
        weight: (1 - coverageRate) * 0.3, // 30% max weight
        description: `You've completed ${Math.round(coverageRate * 100)}% of ${cat} lessons — this fills a knowledge gap`,
      });
    }
  }

  return signals;
}

/**
 * Compute schedule-aware signal.
 * Recommends lessons that fit the user's available time window.
 */
async function computeScheduleSignal(
  userId: number,
  availableMinutes: number | undefined,
  currentTime: number
): Promise<Map<number, RecommendationSignal>> {
  const signals = new Map<number, RecommendationSignal>();

  // Get upcoming shifts
  const shifts = await db.getShiftsByUser(userId);
  const upcomingShift = shifts?.find(s => s.startTime > currentTime);
  
  let effectiveMinutes = availableMinutes || 15; // Default 15 min
  
  if (upcomingShift) {
    const minutesUntilShift = (upcomingShift.startTime - currentTime) / (60 * 1000);
    if (minutesUntilShift < effectiveMinutes) {
      effectiveMinutes = Math.max(5, Math.floor(minutesUntilShift - 5)); // Leave 5 min buffer
    }
  }

  // Get all available lessons and score by duration fit
  const allLessons = await db.getAllPublishedLessons();
  for (const lesson of allLessons) {
    const duration = lesson.durationMinutes || 10;
    if (duration <= effectiveMinutes) {
      // Perfect fit = higher weight
      const fitRatio = duration / effectiveMinutes;
      const weight = fitRatio > 0.5 ? 0.2 : 0.1; // Prefer lessons that use most of available time
      
      signals.set(lesson.id, {
        source: "schedule",
        weight,
        description: upcomingShift
          ? `Fits in your ${effectiveMinutes}-minute window before your shift`
          : `${duration}-minute lesson fits your available time`,
      });
    }
  }

  return signals;
}

/**
 * Compute performance-based signal.
 * Recommends lessons in areas where the user scored poorly.
 */
async function computePerformanceSignal(
  userId: number
): Promise<Map<number, RecommendationSignal>> {
  const signals = new Map<number, RecommendationSignal>();

  const attempts = await db.getAttemptsByUser(userId);
  
  // Find categories where user scored below 70%
  const categoryScores = new Map<string, { total: number; count: number }>();
  const lessonCategories = new Map<number, string>();

  for (const attempt of attempts) {
    if (attempt.score !== null && attempt.maxScore !== null && attempt.maxScore > 0) {
      const scorePercent = (attempt.score / attempt.maxScore) * 100;
      // We need to get the lesson category - store it for later
      const lesson = await db.getLessonById(attempt.lessonId);
      if (lesson) {
        const cat = lesson.category || "General";
        lessonCategories.set(attempt.lessonId, cat);
        const existing = categoryScores.get(cat) || { total: 0, count: 0 };
        categoryScores.set(cat, {
          total: existing.total + scorePercent,
          count: existing.count + 1,
        });
      }
    }
  }

  // Get lessons in weak categories
  const allLessons = await db.getAllPublishedLessons();
  for (const lesson of allLessons) {
    const cat = lesson.category || "General";
    const scores = categoryScores.get(cat);
    if (scores && scores.count > 0) {
      const avgScore = scores.total / scores.count;
      if (avgScore < 70) {
        signals.set(lesson.id, {
          source: "performance",
          weight: ((70 - avgScore) / 70) * 0.25, // 25% max weight
          description: `Your average score in ${cat} is ${Math.round(avgScore)}% — this lesson can help improve`,
        });
      }
    }
  }

  return signals;
}

// ─── Recommendation Engine ──────────────────────────────────────────

/**
 * Generate personalized lesson recommendations.
 * Combines multiple signals, ranks lessons, and generates explanations.
 */
export async function generateRecommendations(
  context: RecommendationContext,
  limit: number = 5
): Promise<LessonRecommendation[]> {
  const { userId, orgId, currentTime, availableMinutes } = context;

  // Get user's completed lessons
  const userAttempts = await db.getAttemptsByUser(userId);
  const completedLessonIds = new Set(
    userAttempts
      .filter(a => a.status === "completed")
      .map(a => a.lessonId)
  );

  // Compute all signals in parallel
  const [collaborative, contentGap, schedule, performance] = await Promise.all([
    computeCollaborativeSignal(userId, orgId, completedLessonIds),
    computeContentGapSignal(userId, completedLessonIds),
    computeScheduleSignal(userId, availableMinutes, currentTime),
    computePerformanceSignal(userId),
  ]);

  // Merge signals per lesson
  const lessonScores = new Map<number, {
    totalWeight: number;
    signals: RecommendationSignal[];
  }>();

  const allSignalMaps = [collaborative, contentGap, schedule, performance];
  for (const signalMap of allSignalMaps) {
    for (const [lessonId, signal] of Array.from(signalMap.entries())) {
      if (completedLessonIds.has(lessonId)) continue;
      
      const existing = lessonScores.get(lessonId) || { totalWeight: 0, signals: [] };
      existing.totalWeight += signal.weight;
      existing.signals.push(signal);
      lessonScores.set(lessonId, existing);
    }
  }

  // Sort by total weight and take top N
  const ranked = Array.from(lessonScores.entries())
    .sort((a, b) => b[1].totalWeight - a[1].totalWeight)
    .slice(0, limit);

  // Fetch lesson details and build recommendations
  const recommendations: LessonRecommendation[] = [];
  for (const [lessonId, scoreData] of ranked) {
    const lesson = await db.getLessonById(lessonId);
    if (!lesson) continue;

    // Calibrate confidence score (normalize to 0-1)
    const maxPossibleWeight = 1.0; // Sum of all max weights
    const confidence = Math.min(scoreData.totalWeight / maxPossibleWeight, 1);

    // Determine priority based on confidence
    const priority = confidence > 0.7 ? "high" : confidence > 0.4 ? "medium" : "low";

    // Generate explanation from top signals
    const topSignals = scoreData.signals
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 3);
    
    const explanation = topSignals.map(s => s.description).join(". ") + ".";

    recommendations.push({
      lessonId,
      title: lesson.title,
      category: lesson.category || "General",
      durationMinutes: lesson.durationMinutes || 10,
      confidenceScore: Math.round(confidence * 100) / 100,
      explanation,
      signals: scoreData.signals,
      priority,
      estimatedRelevance: Math.round(confidence * 100),
    });
  }

  return recommendations;
}

/**
 * Generate AI-enhanced explanation for a recommendation.
 * Uses LLM to create a personalized, conversational explanation.
 */
export async function generateAIExplanation(
  recommendation: LessonRecommendation,
  userContext: { name: string; completedCount: number; weakCategories: string[] }
): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a learning coach for shift workers. Generate a brief, encouraging 1-2 sentence explanation for why a specific lesson is recommended. Be specific about the data signals, not generic. Keep it under 50 words.`,
        },
        {
          role: "user",
          content: JSON.stringify({
            lesson: recommendation.title,
            category: recommendation.category,
            duration: recommendation.durationMinutes,
            confidence: recommendation.confidenceScore,
            signals: recommendation.signals.map(s => s.description),
            userName: userContext.name,
            completedLessons: userContext.completedCount,
            weakAreas: userContext.weakCategories,
          }),
        },
      ],
    });

    const content = response.choices?.[0]?.message?.content;
    return (typeof content === "string" ? content : null) || recommendation.explanation;
  } catch {
    // Fallback to signal-based explanation
    return recommendation.explanation;
  }
}

// ─── Helper DB Functions ────────────────────────────────────────────

// These are added to db.ts separately
