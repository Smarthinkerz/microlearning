import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      appRole: "super_admin",
      orgId: 1,
      timezone: "UTC",
      avatarUrl: null,
      notificationPreferences: null,
      lastActiveAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as any,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: () => {} } as any,
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      appRole: "learner",
      orgId: null,
      timezone: "UTC",
      avatarUrl: null,
      notificationPreferences: null,
      lastActiveAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as any,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: () => {} } as any,
  };
}

describe("CRM Subscription Management", () => {
  it("getSubscriptionStats returns stats object for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const stats = await caller.crm.getSubscriptionStats();
    expect(stats).toBeDefined();
    expect(typeof stats.active).toBe("number");
    expect(typeof stats.trial).toBe("number");
    expect(typeof stats.canceled).toBe("number");
    expect(stats.totalRevenue).toBeDefined();
  });

  it("listPlans returns array of plans for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const plans = await caller.crm.listPlans();
    expect(Array.isArray(plans)).toBe(true);
    expect(plans.length).toBeGreaterThan(0);
    expect(plans[0]).toHaveProperty("name");
    expect(plans[0]).toHaveProperty("tier");
  });

  it("listSubscriptions returns array for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const subs = await caller.crm.listSubscriptions();
    expect(Array.isArray(subs)).toBe(true);
  });

  it("listPayments returns array for admin", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const payments = await caller.crm.listPayments();
    expect(Array.isArray(payments)).toBe(true);
  });

  it("updatePlan modifies plan details", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    const plans = await caller.crm.listPlans();
    if (plans.length === 0) return;

    const plan = plans[0];
    const newName = plan.name + " (Test)";
    await caller.crm.updatePlan({ id: plan.id, name: newName });

    const updated = await caller.crm.listPlans();
    const found = updated.find((p: any) => p.id === plan.id);
    expect(found?.name).toBe(newName);

    // Restore original name
    await caller.crm.updatePlan({ id: plan.id, name: plan.name });
  });
});

describe("Feature Gating", () => {
  it("shared featureGating exports all required functions", async () => {
    const mod = await import("../shared/featureGating");
    expect(mod.hasFeature).toBeDefined();
    expect(mod.getFeatureLimit).toBeDefined();
    expect(mod.isLessonLimitReached).toBeDefined();
    expect(mod.getUpgradeMessage).toBeDefined();
    expect(mod.getMinimumTier).toBeDefined();
    expect(mod.FREE_TIER_FEATURES).toBeDefined();
  });

  it("FREE_TIER_FEATURES has correct defaults", async () => {
    const { FREE_TIER_FEATURES } = await import("../shared/featureGating");
    expect(FREE_TIER_FEATURES.maxLessons).toBe(5);
    expect(FREE_TIER_FEATURES.offlineAccess).toBe(false);
    expect(FREE_TIER_FEATURES.basicTracking).toBe(true);
    expect(FREE_TIER_FEATURES.fullAnalytics).toBe(false);
    expect(FREE_TIER_FEATURES.contentAuthoring).toBe(false);
    expect(FREE_TIER_FEATURES.gamification).toBe(true);
  });

  it("hasFeature returns correct values for free tier", async () => {
    const { hasFeature, FREE_TIER_FEATURES } = await import("../shared/featureGating");
    expect(hasFeature(FREE_TIER_FEATURES, "basicTracking")).toBe(true);
    expect(hasFeature(FREE_TIER_FEATURES, "fullAnalytics")).toBe(false);
    expect(hasFeature(FREE_TIER_FEATURES, "contentAuthoring")).toBe(false);
    expect(hasFeature(FREE_TIER_FEATURES, "gamification")).toBe(true);
  });

  it("hasFeature returns free tier defaults for null features", async () => {
    const { hasFeature } = await import("../shared/featureGating");
    expect(hasFeature(null, "basicTracking")).toBe(true);
    expect(hasFeature(null, "fullAnalytics")).toBe(false);
  });

  it("getFeatureLimit returns correct limits", async () => {
    const { getFeatureLimit, FREE_TIER_FEATURES } = await import("../shared/featureGating");
    expect(getFeatureLimit(FREE_TIER_FEATURES, "maxLessons")).toBe(5);
    expect(getFeatureLimit(null, "maxLessons")).toBe(5);
  });

  it("isLessonLimitReached works correctly", async () => {
    const { isLessonLimitReached, FREE_TIER_FEATURES } = await import("../shared/featureGating");
    expect(isLessonLimitReached(FREE_TIER_FEATURES, 3)).toBe(false);
    expect(isLessonLimitReached(FREE_TIER_FEATURES, 5)).toBe(true);
    expect(isLessonLimitReached(FREE_TIER_FEATURES, 10)).toBe(true);
    const unlimitedFeatures = { ...FREE_TIER_FEATURES, maxLessons: -1 };
    expect(isLessonLimitReached(unlimitedFeatures, 1000)).toBe(false);
  });

  it("getUpgradeMessage returns meaningful messages", async () => {
    const { getUpgradeMessage } = await import("../shared/featureGating");
    expect(getUpgradeMessage("fullAnalytics")).toContain("Pro");
    expect(getUpgradeMessage("sso")).toContain("Enterprise");
    expect(getUpgradeMessage("offlineAccess")).toContain("Starter");
  });

  it("getMinimumTier returns correct tiers", async () => {
    const { getMinimumTier } = await import("../shared/featureGating");
    expect(getMinimumTier("basicTracking")).toBe("Free");
    expect(getMinimumTier("fullAnalytics")).toBe("Pro");
    expect(getMinimumTier("sso")).toBe("Enterprise");
    expect(getMinimumTier("offlineAccess")).toBe("Starter");
  });

  it("getMyEntitlements returns free tier for user without subscription", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const entitlements = await caller.subscription.getMyEntitlements();
    expect(entitlements).toBeDefined();
    expect(entitlements.tier).toBe("free");
    expect(entitlements.planName).toBe("Free");
    expect(entitlements.features).toBeDefined();
    expect(entitlements.features.maxLessons).toBe(5);
  });
});

describe("Voice Router", () => {
  it("isConfigured returns configuration status", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const result = await caller.voice.isConfigured();
    expect(result).toBeDefined();
    expect(typeof result.configured).toBe("boolean");
  });

  it("getVoices returns list of available voices", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const voices = await caller.voice.getVoices();
    expect(Array.isArray(voices)).toBe(true);
    expect(voices.length).toBeGreaterThan(0);
    expect(voices[0]).toHaveProperty("id");
    expect(voices[0]).toHaveProperty("name");
    expect(voices[0]).toHaveProperty("key");
  });

  it("voices include expected default voices", async () => {
    const caller = appRouter.createCaller(createUserContext());
    const voices = await caller.voice.getVoices();
    const names = voices.map((v: any) => v.key);
    expect(names).toContain("sarah");
    expect(names).toContain("adam");
    expect(names).toContain("rachel");
  });
});
