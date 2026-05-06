import {
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  boolean,
  json,
  bigint,
} from "drizzle-orm/mysql-core";

// ─── Organizations (Multi-Tenant) ────────────────────────────────────
export const organizations = mysqlTable("organizations", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  industry: varchar("industry", { length: 128 }),
  logoUrl: text("logoUrl"),
  settings: json("settings").$type<Record<string, unknown>>(),
  maxUsers: int("maxUsers").default(100),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Users ───────────────────────────────────────────────────────────
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  appRole: mysqlEnum("appRole", ["learner", "employer_admin", "content_author", "super_admin"]).default("learner").notNull(),
  orgId: int("orgId"),
  timezone: varchar("timezone", { length: 64 }).default("UTC"),
  avatarUrl: text("avatarUrl"),
  notificationPreferences: json("notificationPreferences").$type<{
    email: boolean;
    push: boolean;
    inApp: boolean;
    quietHoursStart?: string;
    quietHoursEnd?: string;
  }>(),
  // User approval and status management
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "disapproved", "blocked", "removed"]).default("pending").notNull(),
  approvedAt: timestamp("approvedAt"),
  approvedBy: int("approvedBy"),
  disapprovalReason: text("disapprovalReason"),
  blockReason: text("blockReason"),
  lastActiveAt: timestamp("lastActiveAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

// ─── Shifts ──────────────────────────────────────────────────────────
export const shifts = mysqlTable("shifts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  orgId: int("orgId").notNull(),
  title: varchar("title", { length: 255 }),
  startTime: bigint("startTime", { mode: "number" }).notNull(),
  endTime: bigint("endTime", { mode: "number" }).notNull(),
  breakStartTime: bigint("breakStartTime", { mode: "number" }),
  breakEndTime: bigint("breakEndTime", { mode: "number" }),
  shiftType: mysqlEnum("shiftType", ["morning", "afternoon", "night", "split", "custom"]).default("custom"),
  location: varchar("location", { length: 255 }),
  externalId: varchar("externalId", { length: 255 }),
  source: mysqlEnum("source", ["manual", "webhook", "import"]).default("manual"),
  isRecurring: boolean("isRecurring").default(false),
  recurrenceRule: text("recurrenceRule"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Lessons ─────────────────────────────────────────────────────────
export const lessons = mysqlTable("lessons", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  content: json("content").$type<LessonContent>(),
  contentType: mysqlEnum("contentType", ["video", "quiz", "scenario", "assessment", "mixed", "article"]).default("mixed"),
  durationMinutes: int("durationMinutes").default(5),
  difficulty: mysqlEnum("difficulty", ["beginner", "intermediate", "advanced"]).default("beginner"),
  category: varchar("category", { length: 128 }),
  tags: json("tags").$type<string[]>(),
  thumbnailUrl: text("thumbnailUrl"),
  authorId: int("authorId").notNull(),
  status: mysqlEnum("status", ["draft", "in_review", "published", "archived"]).default("draft"),
  reviewerId: int("reviewerId"),
  reviewNotes: text("reviewNotes"),
  publishedAt: timestamp("publishedAt"),
  contentSchemaVersion: int("contentSchemaVersion").default(1),
  language: varchar("language", { length: 10 }).default("en"),
  xapiActivityId: varchar("xapiActivityId", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Lesson Assignments ──────────────────────────────────────────────
export const lessonAssignments = mysqlTable("lesson_assignments", {
  id: int("id").autoincrement().primaryKey(),
  lessonId: int("lessonId").notNull(),
  userId: int("userId").notNull(),
  orgId: int("orgId").notNull(),
  assignedBy: int("assignedBy"),
  status: mysqlEnum("status", ["pending", "available", "in_progress", "completed", "expired", "skipped"]).default("pending"),
  priority: mysqlEnum("priority", ["low", "normal", "high", "urgent"]).default("normal"),
  scheduledStartTime: bigint("scheduledStartTime", { mode: "number" }),
  scheduledEndTime: bigint("scheduledEndTime", { mode: "number" }),
  dueDate: bigint("dueDate", { mode: "number" }),
  completedAt: bigint("completedAt", { mode: "number" }),
  isScheduleAware: boolean("isScheduleAware").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Lesson Attempts / Progress ──────────────────────────────────────
export const lessonAttempts = mysqlTable("lesson_attempts", {
  id: int("id").autoincrement().primaryKey(),
  assignmentId: int("assignmentId").notNull(),
  userId: int("userId").notNull(),
  lessonId: int("lessonId").notNull(),
  orgId: int("orgId").notNull(),
  startedAt: bigint("startedAt", { mode: "number" }).notNull(),
  completedAt: bigint("completedAt", { mode: "number" }),
  timeSpentSeconds: int("timeSpentSeconds").default(0),
  score: int("score"),
  maxScore: int("maxScore"),
  passed: boolean("passed"),
  responses: json("responses").$type<AttemptResponse[]>(),
  progress: int("progress").default(0),
  currentStep: int("currentStep").default(0),
  status: mysqlEnum("status", ["in_progress", "completed", "abandoned"]).default("in_progress"),
  syncStatus: mysqlEnum("syncStatus", ["synced", "pending", "conflict"]).default("synced"),
  clientTimestamp: bigint("clientTimestamp", { mode: "number" }),
  serverTimestamp: bigint("serverTimestamp", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Certificates ────────────────────────────────────────────────────
export const certificates = mysqlTable("certificates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lessonId: int("lessonId").notNull(),
  orgId: int("orgId").notNull(),
  attemptId: int("attemptId"),
  certificateNumber: varchar("certificateNumber", { length: 128 }).notNull().unique(),
  issuedAt: bigint("issuedAt", { mode: "number" }).notNull(),
  expiresAt: bigint("expiresAt", { mode: "number" }),
  pdfUrl: text("pdfUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Audit Logs ──────────────────────────────────────────────────────
export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"),
  orgId: int("orgId"),
  action: varchar("action", { length: 128 }).notNull(),
  resourceType: varchar("resourceType", { length: 64 }).notNull(),
  resourceId: int("resourceId"),
  details: json("details").$type<Record<string, unknown>>(),
  ipAddress: varchar("ipAddress", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Notifications ───────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  orgId: int("orgId"),
  title: varchar("title", { length: 255 }).notNull(),
  message: text("message").notNull(),
  type: mysqlEnum("type", ["lesson_available", "lesson_reminder", "shift_change", "assignment", "achievement", "system"]).default("system"),
  isRead: boolean("isRead").default(false).notNull(),
  actionUrl: text("actionUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Platform Settings (CRM Branding & Config) ─────────────────────
export const platformSettings = mysqlTable("platform_settings", {
  id: int("id").autoincrement().primaryKey(),
  settingKey: varchar("settingKey", { length: 128 }).notNull().unique(),
  settingValue: json("settingValue").$type<Record<string, unknown>>(),
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlatformBranding = {
  appName: string;
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  primaryHue: number;
  accentColor: string;
  theme: "dark" | "light";
  sidebarStyle: "default" | "compact" | "minimal";
  fontFamily: string;
  heroTitle: string;
  heroSubtitle: string;
  footerText: string;
  customCss: string;
};

export type PlatformSettings = typeof platformSettings.$inferSelect;
export type InsertPlatformSettings = typeof platformSettings.$inferInsert;

// ─── Subscription Plans ─────────────────────────────────────────────
export const subscriptionPlans = mysqlTable("subscription_plans", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 128 }).notNull(),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  tier: mysqlEnum("tier", ["starter", "pro", "enterprise", "consumer_free", "consumer_premium"]).notNull(),
  priceMonthly: int("priceMonthly").notNull(), // in cents (e.g. 395 = $3.95)
  priceYearly: int("priceYearly"), // in cents, annual total
  currency: varchar("currency", { length: 3 }).default("USD"),
  isPerUser: boolean("isPerUser").default(true).notNull(),
  maxUsers: int("maxUsers"), // null = unlimited
  features: json("features").$type<PlanFeatures>(),
  addOns: json("addOns").$type<AddOn[]>(),
  isActive: boolean("isActive").default(true).notNull(),
  sortOrder: int("sortOrder").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Organization Subscriptions ─────────────────────────────────────
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  planId: int("planId").notNull(),
  status: mysqlEnum("status", ["active", "trial", "past_due", "canceled", "expired"]).default("trial").notNull(),
  currentPeriodStart: bigint("currentPeriodStart", { mode: "number" }).notNull(),
  currentPeriodEnd: bigint("currentPeriodEnd", { mode: "number" }).notNull(),
  canceledAt: bigint("canceledAt", { mode: "number" }),
  trialEndsAt: bigint("trialEndsAt", { mode: "number" }),
  quantity: int("quantity").default(1), // number of user seats
  externalPaymentId: varchar("externalPaymentId", { length: 255 }), // Tap gateway charge ID
  externalCustomerId: varchar("externalCustomerId", { length: 255 }), // Tap customer ID
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Payment History ────────────────────────────────────────────────
export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  subscriptionId: int("subscriptionId"),
  amount: int("amount").notNull(), // in cents
  currency: varchar("currency", { length: 3 }).default("USD"),
  status: mysqlEnum("status", ["pending", "succeeded", "failed", "refunded"]).default("pending").notNull(),
  paymentMethod: varchar("paymentMethod", { length: 64 }), // tap, card, etc.
  externalChargeId: varchar("externalChargeId", { length: 255 }),
  description: text("description"),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  paidAt: bigint("paidAt", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── Consumer Lesson Packs (In-App Purchases) ───────────────────────
export const lessonPacks = mysqlTable("lesson_packs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  description: text("description"),
  price: int("price").notNull(), // in cents (e.g. 199 = $1.99)
  currency: varchar("currency", { length: 3 }).default("USD"),
  lessonIds: json("lessonIds").$type<number[]>(),
  category: varchar("category", { length: 128 }),
  thumbnailUrl: text("thumbnailUrl"),
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── User Pack Purchases ────────────────────────────────────────────
export const userPackPurchases = mysqlTable("user_pack_purchases", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  packId: int("packId").notNull(),
  paymentId: int("paymentId"),
  purchasedAt: bigint("purchasedAt", { mode: "number" }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// ─── WFM Webhook Configs ─────────────────────────────────────────────
export const webhookConfigs = mysqlTable("webhook_configs", {
  id: int("id").autoincrement().primaryKey(),
  orgId: int("orgId").notNull(),
  provider: varchar("provider", { length: 128 }).notNull(),
  webhookUrl: text("webhookUrl"),
  secretKey: varchar("secretKey", { length: 255 }),
  isActive: boolean("isActive").default(true).notNull(),
  lastSyncAt: timestamp("lastSyncAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// ─── Push Subscriptions (Web Push VAPID) ───────────────────────────────
export const pushSubscriptions = mysqlTable("push_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  endpoint: text("endpoint").notNull(),
  p256dh: text("p256dh").notNull(),
  auth: varchar("auth", { length: 255 }).notNull(),
  userAgent: text("userAgent"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastUsedAt: timestamp("lastUsedAt").defaultNow().notNull(),
});

// ─── Content Types ───────────────────────────────────────────────────
export type LessonContentBlock = {
  id: string;
  type: "text" | "video" | "quiz" | "scenario" | "assessment" | "image";
  data: Record<string, unknown>;
  order: number;
};

export type QuizQuestion = {
  id: string;
  question: string;
  type: "multiple_choice" | "true_false" | "fill_blank" | "matching";
  options?: { id: string; text: string; isCorrect: boolean }[];
  correctAnswer?: string;
  explanation?: string;
  points: number;
};

export type ScenarioBranch = {
  id: string;
  text: string;
  nextNodeId: string;
  feedback?: string;
  isCorrect?: boolean;
};

export type ScenarioNode = {
  id: string;
  type: "prompt" | "choice" | "outcome";
  content: string;
  branches?: ScenarioBranch[];
  imageUrl?: string;
};

export type LessonContent = {
  blocks: LessonContentBlock[];
  quizQuestions?: QuizQuestion[];
  scenarioNodes?: ScenarioNode[];
  passingScore?: number;
};

export type AttemptResponse = {
  questionId: string;
  answer: string | string[];
  isCorrect?: boolean;
  timeSpentSeconds?: number;
};

// ─── Plan Feature Types ─────────────────────────────────────────────
export type PlanFeatures = {
  maxLessons: number; // -1 = unlimited
  offlineAccess: boolean;
  basicTracking: boolean;
  fullAnalytics: boolean;
  adaptiveRecommendations: boolean;
  contentAuthoring: boolean;
  cohortManagement: boolean;
  scormXapiExport: boolean;
  rbac: boolean;
  sso: boolean;
  hrisIntegration: boolean;
  whiteLabel: boolean;
  customOnboarding: boolean;
  sla: boolean;
  dedicatedManager: boolean;
  gamification: boolean;
  pushNotifications: boolean;
  emailSupport: boolean;
  prioritySupport: boolean;
};

export type AddOn = {
  id: string;
  name: string;
  priceMonthly: number; // in cents
  description: string;
};

// ─── Type Exports ────────────────────────────────────────────────────
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Organization = typeof organizations.$inferSelect;
export type InsertOrganization = typeof organizations.$inferInsert;
export type Shift = typeof shifts.$inferSelect;
export type InsertShift = typeof shifts.$inferInsert;
export type Lesson = typeof lessons.$inferSelect;
export type InsertLesson = typeof lessons.$inferInsert;
export type LessonAssignment = typeof lessonAssignments.$inferSelect;
export type InsertLessonAssignment = typeof lessonAssignments.$inferInsert;
export type LessonAttempt = typeof lessonAttempts.$inferSelect;
export type InsertLessonAttempt = typeof lessonAttempts.$inferInsert;
export type Certificate = typeof certificates.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type WebhookConfig = typeof webhookConfigs.$inferSelect;
export type PlatformSettingsRow = typeof platformSettings.$inferSelect;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;
export type InsertSubscriptionPlan = typeof subscriptionPlans.$inferInsert;
export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = typeof payments.$inferInsert;
export type LessonPack = typeof lessonPacks.$inferSelect;
export type InsertLessonPack = typeof lessonPacks.$inferInsert;
export type UserPackPurchase = typeof userPackPurchases.$inferSelect;

// ─── Voice Audio Cache ──────────────────────────────────────────────
export const voiceAudioCache = mysqlTable("voice_audio_cache", {
  id: int("id").autoincrement().primaryKey(),
  textHash: varchar("textHash", { length: 64 }).notNull(),
  voiceId: varchar("voiceId", { length: 128 }).notNull(),
  stability: varchar("stability", { length: 8 }).notNull().default("0.50"),
  similarityBoost: varchar("similarityBoost", { length: 8 }).notNull().default("0.75"),
  style: varchar("style", { length: 8 }).notNull().default("0.00"),
  lessonId: int("lessonId"),
  audioUrl: text("audioUrl").notNull(),
  fileKey: varchar("fileKey", { length: 512 }).notNull(),
  sizeBytes: int("sizeBytes").notNull().default(0),
  charCount: int("charCount").notNull().default(0),
  hitCount: int("hitCount").notNull().default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  lastAccessedAt: timestamp("lastAccessedAt").defaultNow().notNull(),
});

export type VoiceAudioCache = typeof voiceAudioCache.$inferSelect;
export type InsertVoiceAudioCache = typeof voiceAudioCache.$inferInsert;

// ─── Admin IP Allowlist ─────────────────────────────────────────────
export const adminIpAllowlist = mysqlTable("admin_ip_allowlist", {
  id: int("id").autoincrement().primaryKey(),
  ipAddress: varchar("ipAddress", { length: 45 }).notNull(), // IPv4 or IPv6
  label: varchar("label", { length: 255 }), // e.g. "Office HQ", "VPN Exit"
  addedBy: int("addedBy"), // userId who added this entry
  isActive: boolean("isActive").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  expiresAt: timestamp("expiresAt"), // optional expiry for temporary access
});

export type AdminIpAllowlistEntry = typeof adminIpAllowlist.$inferSelect;
export type InsertAdminIpAllowlistEntry = typeof adminIpAllowlist.$inferInsert;

// ─── GDPR Consent Records ──────────────────────────────────────────
export const consents = mysqlTable("consents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  consentType: mysqlEnum("consentType", [
    "terms_of_service",
    "privacy_policy",
    "marketing_emails",
    "analytics_tracking",
    "data_processing",
    "third_party_sharing",
  ]).notNull(),
  granted: boolean("granted").default(false).notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
  version: varchar("version", { length: 32 }).default("1.0"), // policy version consented to
  grantedAt: bigint("grantedAt", { mode: "number" }),
  withdrawnAt: bigint("withdrawnAt", { mode: "number" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Consent = typeof consents.$inferSelect;
export type InsertConsent = typeof consents.$inferInsert;

// ─── Breach Events ─────────────────────────────────────────────────
export const breachEvents = mysqlTable("breach_events", {
  id: int("id").autoincrement().primaryKey(),
  eventType: mysqlEnum("eventType", [
    "brute_force",
    "bulk_data_access",
    "unauthorized_admin_access",
    "data_exfiltration",
    "anomalous_pattern",
    "manual_report",
  ]).notNull(),
  severity: mysqlEnum("severity", ["low", "medium", "high", "critical"]).notNull(),
  description: text("description").notNull(),
  affectedUserCount: int("affectedUserCount").default(0),
  affectedResourceType: varchar("affectedResourceType", { length: 128 }),
  sourceIp: varchar("sourceIp", { length: 45 }),
  detectedBy: mysqlEnum("detectedBy", ["automated", "manual"]).default("automated").notNull(),
  status: mysqlEnum("status", [
    "detected",
    "investigating",
    "contained",
    "resolved",
    "false_positive",
  ]).default("detected").notNull(),
  notifiedAt: bigint("notifiedAt", { mode: "number" }),
  resolvedAt: bigint("resolvedAt", { mode: "number" }),
  metadata: json("metadata").$type<Record<string, unknown>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BreachEvent = typeof breachEvents.$inferSelect;
export type InsertBreachEvent = typeof breachEvents.$inferInsert;

// ─── Lesson Feedback & Ratings ──────────────────────────────────────
export const lessonFeedback = mysqlTable("lesson_feedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  lessonId: int("lessonId").notNull(),
  attemptId: int("attemptId"),
  rating: int("rating").notNull(), // 1-5 stars
  comment: text("comment"),
  difficulty: mysqlEnum("difficulty", ["too_easy", "just_right", "too_hard"]),
  wouldRecommend: boolean("wouldRecommend"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type LessonFeedback = typeof lessonFeedback.$inferSelect;
export type InsertLessonFeedback = typeof lessonFeedback.$inferInsert;

// ─── Uptime History (Service Health Snapshots) ──────────────────────
export const uptimeHistory = mysqlTable("uptime_history", {
  id: int("id").autoincrement().primaryKey(),
  serviceName: varchar("serviceName", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["operational", "degraded", "down", "unknown"]).notNull(),
  latencyMs: int("latencyMs"),
  message: text("message"),
  checkedAt: bigint("checkedAt", { mode: "number" }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type UptimeHistory = typeof uptimeHistory.$inferSelect;
export type InsertUptimeHistory = typeof uptimeHistory.$inferInsert;
