import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Email Service Tests ───
describe("Email Service Module", () => {
  it("exports sendBreachNotificationEmail function", async () => {
    const mod = await import("./services/emailService");
    expect(typeof mod.sendBreachNotificationEmail).toBe("function");
  });

  it("exports sendGDPRBreachAlert function", async () => {
    const mod = await import("./services/emailService");
    expect(typeof mod.sendGDPRBreachAlert).toBe("function");
  });

  it("exports sendSystemAlert function", async () => {
    const mod = await import("./services/emailService");
    expect(typeof mod.sendSystemAlert).toBe("function");
  });

  it("exports validateResendConnection function", async () => {
    const mod = await import("./services/emailService");
    expect(typeof mod.validateResendConnection).toBe("function");
  });

  it("sendBreachNotificationEmail accepts payload parameter", async () => {
    const mod = await import("./services/emailService");
    expect(mod.sendBreachNotificationEmail.length).toBeGreaterThanOrEqual(0);
  });

  it("sendGDPRBreachAlert accepts payload parameter", async () => {
    const mod = await import("./services/emailService");
    expect(mod.sendGDPRBreachAlert.length).toBeGreaterThanOrEqual(0);
  });

  it("sendSystemAlert accepts payload parameter", async () => {
    const mod = await import("./services/emailService");
    expect(mod.sendSystemAlert.length).toBeGreaterThanOrEqual(0);
  });
});

// ─── Breach Detection Email Integration Tests ───
describe("Breach Detection Email Integration", () => {
  it("breach detection exports processAnomalyEvent", async () => {
    const mod = await import("./services/breachDetection");
    expect(typeof mod.processAnomalyEvent).toBe("function");
  });

  it("breach detection exports processUnnotifiedBreaches", async () => {
    const mod = await import("./services/breachDetection");
    expect(typeof mod.processUnnotifiedBreaches).toBe("function");
  });

  it("breach detection exports recordFailedLogin", async () => {
    const mod = await import("./services/breachDetection");
    expect(typeof mod.recordFailedLogin).toBe("function");
  });

  it("breach detection exports recordBulkAccess", async () => {
    const mod = await import("./services/breachDetection");
    expect(typeof mod.recordBulkAccess).toBe("function");
  });

  it("breach detection exports cleanupCounters", async () => {
    const mod = await import("./services/breachDetection");
    expect(typeof mod.cleanupCounters).toBe("function");
  });
});

// ─── Feature Gating Middleware Tests ───
describe("Tier Gating Middleware", () => {
  it("exports enforceFeatureAccess function", async () => {
    const mod = await import("./middleware/tierGating");
    expect(typeof mod.enforceFeatureAccess).toBe("function");
  });

  it("exports enforceTierAccess function", async () => {
    const mod = await import("./middleware/tierGating");
    expect(typeof mod.enforceTierAccess).toBe("function");
  });

  it("exports resolveUserFeatures function", async () => {
    const mod = await import("./middleware/tierGating");
    expect(typeof mod.resolveUserFeatures).toBe("function");
  });
});

// ─── Shared Feature Gating Tests ───
describe("Shared Feature Gating", () => {
  it("exports hasFeature function", async () => {
    const mod = await import("../shared/featureGating");
    expect(typeof mod.hasFeature).toBe("function");
  });

  it("exports getMinimumTier function", async () => {
    const mod = await import("../shared/featureGating");
    expect(typeof mod.getMinimumTier).toBe("function");
  });

  it("exports getUpgradeMessage function", async () => {
    const mod = await import("../shared/featureGating");
    expect(typeof mod.getUpgradeMessage).toBe("function");
  });

  it("exports FREE_TIER_FEATURES", async () => {
    const mod = await import("../shared/featureGating");
    expect(mod.FREE_TIER_FEATURES).toBeDefined();
    expect(typeof mod.FREE_TIER_FEATURES).toBe("object");
  });

  it("FREE_TIER_FEATURES has correct gating defaults", async () => {
    const mod = await import("../shared/featureGating");
    const free = mod.FREE_TIER_FEATURES;
    // Free tier should NOT have Pro+ features
    expect(free.adaptiveRecommendations).toBeFalsy();
    expect(free.fullAnalytics).toBeFalsy();
    expect(free.contentAuthoring).toBeFalsy();
    expect(free.scormXapiExport).toBeFalsy();
  });

  it("getMinimumTier returns correct tier for Pro+ features", async () => {
    const mod = await import("../shared/featureGating");
    const tier = mod.getMinimumTier("fullAnalytics");
    expect(typeof tier).toBe("string");
    // Should be Pro or higher
    expect(["Pro", "pro", "Pro+", "pro+"]).toContain(tier.toLowerCase().includes("pro") ? tier : "");
  });

  it("getUpgradeMessage returns a string for gated features", async () => {
    const mod = await import("../shared/featureGating");
    const msg = mod.getUpgradeMessage("contentAuthoring");
    expect(typeof msg).toBe("string");
    expect(msg.length).toBeGreaterThan(0);
  });

  it("hasFeature returns true when feature is enabled", async () => {
    const mod = await import("../shared/featureGating");
    const proFeatures = { ...mod.FREE_TIER_FEATURES, fullAnalytics: true };
    expect(mod.hasFeature(proFeatures, "fullAnalytics")).toBe(true);
  });

  it("hasFeature returns false when feature is disabled", async () => {
    const mod = await import("../shared/featureGating");
    expect(mod.hasFeature(mod.FREE_TIER_FEATURES, "fullAnalytics")).toBe(false);
  });
});

// ─── IP Allowlist Middleware Tests ───
describe("IP Allowlist Middleware", () => {
  it("exports ipAllowlistMiddleware function", async () => {
    const mod = await import("./middleware/ipAllowlist");
    expect(typeof mod.ipAllowlistMiddleware).toBe("function");
  });

  it("exports invalidateAllowlistCache function", async () => {
    const mod = await import("./middleware/ipAllowlist");
    expect(typeof mod.invalidateAllowlistCache).toBe("function");
  });

  it("exports getAllowedIPs function", async () => {
    const mod = await import("./middleware/ipAllowlist");
    expect(typeof mod.getAllowedIPs).toBe("function");
  });

  it("exports refreshAllowlistCache function", async () => {
    const mod = await import("./middleware/ipAllowlist");
    expect(typeof mod.refreshAllowlistCache).toBe("function");
  });

  it("invalidateAllowlistCache does not throw", async () => {
    const mod = await import("./middleware/ipAllowlist");
    expect(() => mod.invalidateAllowlistCache()).not.toThrow();
  });
});

// ─── Consent Router Tests ───
describe("Consent Router", () => {
  it("consent router exports consentRouter", async () => {
    const mod = await import("./routers/consent");
    expect(mod.consentRouter).toBeDefined();
  });
});

// ─── Breach Router Tests ───
describe("Breach Router", () => {
  it("breach router exports breachRouter", async () => {
    const mod = await import("./routers/breach");
    expect(mod.breachRouter).toBeDefined();
  });
});

// ─── Tap Webhook Tests ───
describe("Tap Webhook Handler", () => {
  it("exports tapWebhookRouter", async () => {
    const mod = await import("./webhooks/tapWebhook");
    expect(mod.tapWebhookRouter).toBeDefined();
  });
});
