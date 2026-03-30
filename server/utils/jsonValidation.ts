import { z } from "zod";

/**
 * Runtime JSON column validation utilities.
 * Validates JSON data read from database columns to prevent deserialization crashes.
 * Returns a safe default when validation fails instead of throwing.
 */

// ─── Lesson Content Validation ──────────────────────────────────────
const contentBlockSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "video", "quiz", "scenario", "assessment", "image"]),
  data: z.record(z.string(), z.unknown()),
  order: z.number(),
});

const quizQuestionSchema = z.object({
  id: z.string(),
  question: z.string(),
  type: z.enum(["multiple_choice", "true_false", "fill_blank", "matching"]),
  options: z.array(z.object({
    id: z.string(),
    text: z.string(),
    isCorrect: z.boolean(),
  })).optional(),
  correctAnswer: z.string().optional(),
  explanation: z.string().optional(),
  points: z.number(),
});

const scenarioBranchSchema = z.object({
  id: z.string(),
  text: z.string(),
  nextNodeId: z.string(),
  feedback: z.string().optional(),
  isCorrect: z.boolean().optional(),
});

const scenarioNodeSchema = z.object({
  id: z.string(),
  type: z.enum(["prompt", "choice", "outcome"]),
  content: z.string(),
  branches: z.array(scenarioBranchSchema).optional(),
  imageUrl: z.string().optional(),
});

export const lessonContentSchema = z.object({
  blocks: z.array(contentBlockSchema),
  quizQuestions: z.array(quizQuestionSchema).optional(),
  scenarioNodes: z.array(scenarioNodeSchema).optional(),
  passingScore: z.number().optional(),
});

// ─── Plan Features Validation ───────────────────────────────────────
export const planFeaturesSchema = z.object({
  maxLessons: z.number(),
  offlineAccess: z.boolean(),
  basicTracking: z.boolean(),
  fullAnalytics: z.boolean(),
  adaptiveRecommendations: z.boolean(),
  contentAuthoring: z.boolean(),
  cohortManagement: z.boolean(),
  scormXapiExport: z.boolean(),
  rbac: z.boolean(),
  sso: z.boolean(),
  hrisIntegration: z.boolean(),
  whiteLabel: z.boolean(),
  customOnboarding: z.boolean(),
  sla: z.boolean(),
  dedicatedManager: z.boolean(),
  gamification: z.boolean(),
  pushNotifications: z.boolean(),
  emailSupport: z.boolean(),
  prioritySupport: z.boolean(),
});

// ─── Notification Preferences Validation ────────────────────────────
export const notificationPrefsSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
  inApp: z.boolean(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
});

// ─── Attempt Response Validation ────────────────────────────────────
export const attemptResponseSchema = z.array(z.object({
  questionId: z.string(),
  answer: z.union([z.string(), z.array(z.string())]),
  isCorrect: z.boolean().optional(),
  timeSpentSeconds: z.number().optional(),
}));

// ─── Safe Parse Helper ──────────────────────────────────────────────
/**
 * Safely validates a JSON value against a Zod schema.
 * Returns the validated data on success, or the fallback on failure.
 * Logs validation errors for monitoring.
 */
export function safeParseJson<T>(
  schema: z.ZodType<T>,
  data: unknown,
  fallback: T,
  context?: string,
): T {
  if (data === null || data === undefined) return fallback;
  const result = schema.safeParse(data);
  if (result.success) return result.data;
  
  console.warn(
    `[JSON Validation] ${context || "Unknown"}: Invalid data detected.`,
    result.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; ")
  );
  return fallback;
}

// ─── Convenience Validators ─────────────────────────────────────────
export function validateLessonContent(data: unknown) {
  return safeParseJson(
    lessonContentSchema,
    data,
    { blocks: [] },
    "LessonContent"
  );
}

export function validatePlanFeatures(data: unknown) {
  return safeParseJson(
    planFeaturesSchema,
    data,
    {
      maxLessons: 5, offlineAccess: false, basicTracking: true,
      fullAnalytics: false, adaptiveRecommendations: false,
      contentAuthoring: false, cohortManagement: false,
      scormXapiExport: false, rbac: false, sso: false,
      hrisIntegration: false, whiteLabel: false, customOnboarding: false,
      sla: false, dedicatedManager: false, gamification: false,
      pushNotifications: false, emailSupport: false, prioritySupport: false,
    },
    "PlanFeatures"
  );
}

export function validateNotificationPrefs(data: unknown) {
  return safeParseJson(
    notificationPrefsSchema,
    data,
    { email: true, push: true, inApp: true },
    "NotificationPreferences"
  );
}

export function validateAttemptResponses(data: unknown) {
  return safeParseJson(
    attemptResponseSchema,
    data,
    [],
    "AttemptResponses"
  );
}
