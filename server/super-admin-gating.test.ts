import { describe, it, expect } from "vitest";
import { enforceFeatureAccess, enforceTierAccess, resolveUserFeatures } from "./middleware/tierGating";
import { TRPCError } from "@trpc/server";

describe("Super Admin Feature Gating Bypass", () => {
  it("super_admin should bypass contentAuthoring feature gate", async () => {
    const superAdminUser = {
      id: 1,
      orgId: null,
      appRole: "super_admin",
    };

    // Should not throw
    await expect(
      enforceFeatureAccess(superAdminUser as any, "contentAuthoring")
    ).resolves.toBeUndefined();
  });

  it("super_admin should bypass scormXapiExport feature gate", async () => {
    const superAdminUser = {
      id: 1,
      orgId: null,
      appRole: "super_admin",
    };

    // Should not throw
    await expect(
      enforceFeatureAccess(superAdminUser as any, "scormXapiExport")
    ).resolves.toBeUndefined();
  });

  it("super_admin should bypass fullAnalytics feature gate", async () => {
    const superAdminUser = {
      id: 1,
      orgId: null,
      appRole: "super_admin",
    };

    // Should not throw
    await expect(
      enforceFeatureAccess(superAdminUser as any, "fullAnalytics")
    ).resolves.toBeUndefined();
  });

  it("super_admin should get Enterprise tier features", async () => {
    const superAdminUser = {
      id: 1,
      orgId: null,
      appRole: "super_admin",
    };

    const { tier, features } = await resolveUserFeatures(superAdminUser as any);

    expect(tier).toBe("enterprise");
    expect(features.contentAuthoring).toBe(true);
    expect(features.scormXapiExport).toBe(true);
    expect(features.fullAnalytics).toBe(true);
    expect(features.maxLessons).toBe(-1);
  });

  it("super_admin should bypass tier access checks", async () => {
    const superAdminUser = {
      id: 1,
      orgId: null,
      appRole: "super_admin",
    };

    // Should not throw even for enterprise tier
    await expect(
      enforceTierAccess(superAdminUser as any, "enterprise")
    ).resolves.toBeUndefined();
  });

  it("regular user without subscription should not have contentAuthoring", async () => {
    const regularUser = {
      id: 2,
      orgId: null,
      appRole: "learner",
    };

    // Should throw
    await expect(
      enforceFeatureAccess(regularUser as any, "contentAuthoring")
    ).rejects.toThrow();
  });

  it("admin role should bypass feature gates (backward compatibility)", async () => {
    const adminUser = {
      id: 3,
      orgId: null,
      role: "admin",
      appRole: "learner",
    };

    // Should not throw
    await expect(
      enforceFeatureAccess(adminUser as any, "contentAuthoring")
    ).resolves.toBeUndefined();
  });

  it("super_admin should have access to all Pro features", async () => {
    const superAdminUser = {
      id: 1,
      orgId: null,
      appRole: "super_admin",
    };

    const { features } = await resolveUserFeatures(superAdminUser as any);

    const proFeatures = [
      "fullAnalytics",
      "adaptiveRecommendations",
      "contentAuthoring",
      "cohortManagement",
      "scormXapiExport",
      "rbac",
      "gamification",
      "prioritySupport",
    ];

    for (const feature of proFeatures) {
      expect(features[feature as keyof typeof features]).toBe(true);
    }
  });

  it("super_admin should have access to all Enterprise features", async () => {
    const superAdminUser = {
      id: 1,
      orgId: null,
      appRole: "super_admin",
    };

    const { features } = await resolveUserFeatures(superAdminUser as any);

    const enterpriseFeatures = [
      "sso",
      "hrisIntegration",
      "whiteLabel",
      "customOnboarding",
      "sla",
      "dedicatedManager",
    ];

    for (const feature of enterpriseFeatures) {
      expect(features[feature as keyof typeof features]).toBe(true);
    }
  });
});
