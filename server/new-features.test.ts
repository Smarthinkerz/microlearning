import { describe, it, expect } from "vitest";

// ─── Rate Limiter Tests ─────────────────────────────────────────────
describe("Rate Limiter", () => {
  it("should export rate limiter middleware", async () => {
    const mod = await import("./middleware/rateLimiter");
    expect(mod.generalLimiter).toBeDefined();
    expect(mod.aiLimiter).toBeDefined();
    expect(mod.authLimiter).toBeDefined();
    expect(mod.voiceLimiter).toBeDefined();
    expect(mod.strictLimiter).toBeDefined();
    expect(mod.trpcRateLimiter).toBeDefined();
  });

  it("should have correct rate limit configurations", async () => {
    const mod = await import("./middleware/rateLimiter");
    // All limiters should be functions (Express middleware)
    expect(typeof mod.generalLimiter).toBe("function");
    expect(typeof mod.aiLimiter).toBe("function");
    expect(typeof mod.authLimiter).toBe("function");
    expect(typeof mod.trpcRateLimiter).toBe("function");
  });
});

// ─── JSON Validation Tests ──────────────────────────────────────────
describe("JSON Validation", () => {
  it("should export validation schemas and helpers", async () => {
    const mod = await import("./utils/jsonValidation");
    expect(mod.safeParseJson).toBeDefined();
    expect(mod.validateLessonContent).toBeDefined();
    expect(mod.validateAttemptResponses).toBeDefined();
    expect(mod.validatePlanFeatures).toBeDefined();
    expect(mod.validateNotificationPrefs).toBeDefined();
    expect(mod.lessonContentSchema).toBeDefined();
    expect(mod.planFeaturesSchema).toBeDefined();
  });

  it("should validate lesson content with schema", async () => {
    const mod = await import("./utils/jsonValidation");
    const validContent = { steps: [{ type: "text", content: "Hello" }] };
    const result = mod.validateLessonContent(validContent);
    expect(result).toBeDefined();
  });

  it("should validate plan features with schema", async () => {
    const mod = await import("./utils/jsonValidation");
    const features = { maxLessons: 30, offlineAccess: true };
    const result = mod.validatePlanFeatures(features);
    expect(result).toBeDefined();
  });

  it("should use safeParseJson with schema and fallback", async () => {
    const { z } = await import("zod");
    const mod = await import("./utils/jsonValidation");
    const schema = z.object({ name: z.string() });
    const fallback = { name: "default" };
    // Valid data
    const result = mod.safeParseJson(schema, { name: "test" }, fallback);
    expect(result).toEqual({ name: "test" });
    // Invalid data returns fallback
    const result2 = mod.safeParseJson(schema, { name: 123 }, fallback);
    expect(result2).toEqual(fallback);
  });
});

// ─── Offline Sync Tests ─────────────────────────────────────────────
describe("Offline Sync Router", () => {
  it("should export offlineSyncRouter", async () => {
    const mod = await import("./routers/offlineSync");
    expect(mod.offlineSyncRouter).toBeDefined();
  });
});

// ─── Push Notification Tests ────────────────────────────────────────
describe("Push Notification Service", () => {
  it("should export push notification functions", async () => {
    const mod = await import("./services/pushNotification");
    expect(mod.sendPush).toBeDefined();
    expect(mod.sendPushToUser).toBeDefined();
    expect(mod.sendPushToOrg).toBeDefined();
    expect(mod.calculateOptimalNotificationTime).toBeDefined();
    expect(mod.generateShiftReminders).toBeDefined();
    expect(mod.generateVapidKeys).toBeDefined();
    expect(mod.getVapidPublicKey).toBeDefined();
  });

  it("should generate valid VAPID keys", async () => {
    const mod = await import("./services/pushNotification");
    const keys = mod.generateVapidKeys();
    expect(keys.publicKey).toBeTruthy();
    expect(keys.privateKey).toBeTruthy();
    expect(keys.publicKey.length).toBeGreaterThan(10);
    expect(keys.privateKey.length).toBeGreaterThan(10);
  });

  it("should return a VAPID public key", async () => {
    const mod = await import("./services/pushNotification");
    const key = mod.getVapidPublicKey();
    expect(typeof key).toBe("string");
  });
});

// ─── AI Recommendation Tests ────────────────────────────────────────
describe("AI Recommendation Service", () => {
  it("should export recommendation functions", async () => {
    const mod = await import("./services/aiRecommendation");
    expect(mod.generateRecommendations).toBeDefined();
    expect(mod.generateAIExplanation).toBeDefined();
  });

  it("should have correct function signatures", async () => {
    const mod = await import("./services/aiRecommendation");
    expect(typeof mod.generateRecommendations).toBe("function");
    expect(typeof mod.generateAIExplanation).toBe("function");
  });
});

// ─── Security Service Tests ─────────────────────────────────────────
describe("Security Service", () => {
  it("should export security functions", async () => {
    const mod = await import("./services/security");
    expect(mod.generateTOTPSecret).toBeDefined();
    expect(mod.verifyTOTP).toBeDefined();
    expect(mod.encryptField).toBeDefined();
    expect(mod.decryptField).toBeDefined();
    expect(mod.generateSecureToken).toBeDefined();
    expect(mod.hashPassword).toBeDefined();
  });

  it("should generate TOTP secret with correct format", async () => {
    const mod = await import("./services/security");
    const result = mod.generateTOTPSecret("testuser@example.com");
    expect(result.secret).toBeTruthy();
    expect(result.secret.length).toBeGreaterThan(10);
    expect(result.uri).toBeTruthy();
    expect(result.uri).toContain("otpauth://totp/");
    expect(result.backupCodes).toBeDefined();
    expect(Array.isArray(result.backupCodes)).toBe(true);
    expect(result.backupCodes.length).toBeGreaterThan(0);
  });

  it("should encrypt and decrypt fields correctly", async () => {
    const mod = await import("./services/security");
    const original = "sensitive-data-12345";
    const encrypted = mod.encryptField(original);
    expect(encrypted).not.toBe(original);
    expect(encrypted.length).toBeGreaterThan(original.length);

    const decrypted = mod.decryptField(encrypted);
    expect(decrypted).toBe(original);
  });

  it("should generate secure tokens", async () => {
    const mod = await import("./services/security");
    const token = mod.generateSecureToken(32);
    expect(token.length).toBeGreaterThan(20);
    // Two tokens should be different
    const token2 = mod.generateSecureToken(32);
    expect(token).not.toBe(token2);
  });

  it("should hash and verify passwords", async () => {
    const mod = await import("./services/security");
    const { hash, salt } = mod.hashPassword("testPassword123");
    expect(hash.length).toBeGreaterThan(10);
    expect(salt.length).toBeGreaterThan(5);
    expect(mod.verifyPassword("testPassword123", hash, salt)).toBe(true);
    expect(mod.verifyPassword("wrongPassword", hash, salt)).toBe(false);
  });
});

// ─── HRIS Connector Tests ───────────────────────────────────────────
describe("HRIS Connector Service", () => {
  it("should export HRIS connector functions", async () => {
    const mod = await import("./services/hrisConnector");
    expect(mod.testHRISConnection).toBeDefined();
    expect(mod.syncEmployees).toBeDefined();
    expect(mod.parseEmployeeCSV).toBeDefined();
  });

  it("should parse CSV employee data", async () => {
    const mod = await import("./services/hrisConnector");
    const csv = "employeeId,firstName,lastName,email,department,jobTitle\n001,John,Doe,john@test.com,Engineering,Developer";
    const employees = mod.parseEmployeeCSV(csv);
    expect(Array.isArray(employees)).toBe(true);
    expect(employees.length).toBeGreaterThan(0);
  });
});

// ─── Analytics Insights Tests ───────────────────────────────────────
describe("Analytics Insights Service", () => {
  it("should export analytics functions", async () => {
    const mod = await import("./services/analyticsInsights");
    expect(mod.generateInsights).toBeDefined();
    expect(mod.getIndustryBenchmarks).toBeDefined();
    expect(mod.generateAlerts).toBeDefined();
    expect(mod.getCohortAnalysis).toBeDefined();
  });

  it("should return industry benchmarks (async, requires orgId)", async () => {
    const mod = await import("./services/analyticsInsights");
    // getIndustryBenchmarks takes orgId, not industry string
    expect(typeof mod.getIndustryBenchmarks).toBe("function");
  });
});

// ─── Marketplace & Gamification Tests ───────────────────────────────
describe("Marketplace Service", () => {
  it("should export marketplace functions", async () => {
    const mod = await import("./services/marketplace");
    expect(mod.getMarketplacePacks).toBeDefined();
    expect(mod.getActiveChallenges).toBeDefined();
    expect(mod.checkAchievements).toBeDefined();
    expect(mod.getAllAchievements).toBeDefined();
    expect(mod.getLeaderboard).toBeDefined();
  });

  it("should return marketplace packs", async () => {
    const mod = await import("./services/marketplace");
    const packs = await mod.getMarketplacePacks();
    expect(Array.isArray(packs)).toBe(true);
    expect(packs.length).toBeGreaterThan(0);
    packs.forEach((pack: any) => {
      expect(pack.id).toBeTruthy();
      expect(pack.title).toBeTruthy();
      expect(pack.industry).toBeTruthy();
      expect(pack.lessonCount).toBeGreaterThan(0);
    });
  });

  it("should return active challenges", async () => {
    const mod = await import("./services/marketplace");
    const challenges = mod.getActiveChallenges();
    expect(Array.isArray(challenges)).toBe(true);
    expect(challenges.length).toBeGreaterThanOrEqual(3); // daily, weekly, monthly
    
    const types = challenges.map((c: any) => c.type);
    expect(types).toContain("daily");
    expect(types).toContain("weekly");
    expect(types).toContain("monthly");
  });

  it("should return all achievements", async () => {
    const mod = await import("./services/marketplace");
    const achievements = mod.getAllAchievements();
    expect(Array.isArray(achievements)).toBe(true);
    expect(achievements.length).toBeGreaterThan(10);
    achievements.forEach((a: any) => {
      expect(a.id).toBeTruthy();
      expect(a.name).toBeTruthy();
      expect(a.tier).toBeTruthy();
      expect(a.xpReward).toBeGreaterThan(0);
    });
  });
});

// ─── Job Queue Tests ────────────────────────────────────────────────
describe("Job Queue Service", () => {
  it("should export job queue singleton", async () => {
    const mod = await import("./services/jobQueue");
    expect(mod.jobQueue).toBeDefined();
    expect(mod.jobQueue.addJob).toBeDefined();
    expect(mod.jobQueue.getJob).toBeDefined();
    expect(mod.jobQueue.getJobs).toBeDefined();
    expect(mod.jobQueue.getStats).toBeDefined();
  });

  it("should add and track jobs", async () => {
    const mod = await import("./services/jobQueue");
    const jobId = await mod.jobQueue.addJob("send_push_notification", { userId: 1 });
    expect(jobId).toBeTruthy();
    expect(jobId.startsWith("job_")).toBe(true);

    const job = mod.jobQueue.getJob(jobId);
    expect(job).toBeDefined();
    expect(job!.name).toBe("send_push_notification");
    expect(job!.data.userId).toBe(1);
  });

  it("should return queue statistics", async () => {
    const mod = await import("./services/jobQueue");
    const stats = mod.jobQueue.getStats();
    expect(stats.total).toBeGreaterThanOrEqual(0);
    expect(stats.handlers.length).toBeGreaterThan(0);
    expect(stats.handlers).toContain("send_push_notification");
    expect(stats.handlers).toContain("sync_hris");
  });
});

// ─── Query Cache Tests ──────────────────────────────────────────────
describe("Query Cache Service", () => {
  it("should export cache instances", async () => {
    const mod = await import("./services/queryCache");
    expect(mod.hotCache).toBeDefined();
    expect(mod.warmCache).toBeDefined();
    expect(mod.coldCache).toBeDefined();
    expect(mod.cacheKeys).toBeDefined();
  });

  it("should cache and retrieve values", async () => {
    const mod = await import("./services/queryCache");
    mod.hotCache.set("test_key", { data: "hello" });
    const result = mod.hotCache.get<{ data: string }>("test_key");
    expect(result).toEqual({ data: "hello" });
  });

  it("should return undefined for missing keys", async () => {
    const mod = await import("./services/queryCache");
    const result = mod.hotCache.get("nonexistent_key_xyz");
    expect(result).toBeUndefined();
  });

  it("should invalidate keys", async () => {
    const mod = await import("./services/queryCache");
    mod.hotCache.set("to_delete", "value");
    expect(mod.hotCache.get("to_delete")).toBe("value");
    mod.hotCache.invalidate("to_delete");
    expect(mod.hotCache.get("to_delete")).toBeUndefined();
  });

  it("should invalidate by prefix", async () => {
    const mod = await import("./services/queryCache");
    mod.hotCache.set("prefix:a", 1);
    mod.hotCache.set("prefix:b", 2);
    mod.hotCache.set("other:c", 3);
    const removed = mod.hotCache.invalidatePrefix("prefix:");
    expect(removed).toBe(2);
    expect(mod.hotCache.get("other:c")).toBe(3);
  });

  it("should return cache statistics", async () => {
    const mod = await import("./services/queryCache");
    const stats = mod.hotCache.getStats();
    expect(stats.size).toBeGreaterThanOrEqual(0);
    expect(stats.maxSize).toBeGreaterThan(0);
    expect(typeof stats.hitRate).toBe("number");
  });

  it("should use getOrSet correctly", async () => {
    const mod = await import("./services/queryCache");
    let callCount = 0;
    const factory = async () => {
      callCount++;
      return { computed: true };
    };

    const first = await mod.warmCache.getOrSet("getOrSet_test", factory);
    expect(first).toEqual({ computed: true });
    expect(callCount).toBe(1);

    const second = await mod.warmCache.getOrSet("getOrSet_test", factory);
    expect(second).toEqual({ computed: true });
    expect(callCount).toBe(1); // Factory should NOT be called again
  });

  it("should generate correct cache keys", async () => {
    const mod = await import("./services/queryCache");
    expect(mod.cacheKeys.orgStats(1)).toBe("org:1:stats");
    expect(mod.cacheKeys.userProfile(42)).toBe("user:42:profile");
    expect(mod.cacheKeys.publishedLessons()).toBe("lessons:published");
  });
});

// ─── i18n Tests ─────────────────────────────────────────────────────
describe("i18n Framework", () => {
  it("should export i18n utilities", async () => {
    const mod = await import("../client/src/lib/i18n");
    expect(mod.t).toBeDefined();
    expect(mod.getAvailableLocales).toBeDefined();
    expect(mod.isRTL).toBeDefined();
    expect(mod.LOCALE_NAMES).toBeDefined();
  });

  it("should have 10+ supported locales", async () => {
    const mod = await import("../client/src/lib/i18n");
    const locales = mod.getAvailableLocales();
    expect(locales.length).toBeGreaterThanOrEqual(10);
  });

  it("should correctly identify RTL locales", async () => {
    const mod = await import("../client/src/lib/i18n");
    expect(mod.isRTL("ar")).toBe(true);
    expect(mod.isRTL("en")).toBe(false);
  });
});

// ─── Content Library Expansion Tests ────────────────────────────────
describe("Content Library Expansion", () => {
  it("should export generateExpandedLibrary", async () => {
    const mod = await import("./contentLibraryExpansion");
    expect(mod.generateExpandedLibrary).toBeDefined();
  });

  it("should generate 50+ expanded lessons", async () => {
    const mod = await import("./contentLibraryExpansion");
    const lessons = mod.generateExpandedLibrary();
    expect(Array.isArray(lessons)).toBe(true);
    expect(lessons.length).toBeGreaterThanOrEqual(50);
  });

  it("should have valid lesson structure", async () => {
    const mod = await import("./contentLibraryExpansion");
    const lessons = mod.generateExpandedLibrary();
    lessons.slice(0, 5).forEach((lesson: any) => {
      expect(lesson.title).toBeTruthy();
      expect(lesson.description).toBeTruthy();
      expect(lesson.category).toBeTruthy();
      expect(lesson.durationMinutes).toBeGreaterThan(0);
      expect(lesson.content).toBeDefined();
      expect(Array.isArray(lesson.tags)).toBe(true);
    });
  });
});
