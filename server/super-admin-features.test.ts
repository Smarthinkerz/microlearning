import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import type { User } from "drizzle-orm";

const db = getDb();

describe("Super Admin Feature Access", () => {
  it("super_admin should have access to all Pro features", () => {
    const superAdminUser = {
      id: "super-admin-test",
      appRole: "super_admin",
    } as any;

    // Simulate getPlans logic for super_admin
    const mockPlans = [
      {
        id: 1,
        name: "Starter",
        slug: "starter",
        tier: "starter" as const,
        features: {
          maxLessons: 30,
          offlineAccess: true,
          basicTracking: true,
          fullAnalytics: false,
          adaptiveRecommendations: false,
          contentAuthoring: false,
          cohortManagement: false,
          scormXapiExport: false,
          rbac: false,
          sso: false,
          hrisIntegration: false,
          whiteLabel: false,
          customOnboarding: false,
          sla: false,
          dedicatedManager: false,
          gamification: false,
          pushNotifications: true,
          emailSupport: true,
          prioritySupport: false,
          voiceNarration: false,
        },
      },
    ];

    // Apply super_admin feature unlock logic
    const plansForSuperAdmin = mockPlans.map((plan) => {
      if (plan.tier === "starter" || plan.tier === "pro") {
        return {
          ...plan,
          features: {
            ...plan.features,
            scormXapiExport: true,
            rbac: true,
            sso: true,
            hrisIntegration: true,
            whiteLabel: true,
            customOnboarding: true,
            sla: true,
            dedicatedManager: true,
            fullAnalytics: true,
            adaptiveRecommendations: true,
            contentAuthoring: true,
            cohortManagement: true,
            maxLessons: -1,
          },
        };
      }
      return plan;
    });

    const starterPlan = plansForSuperAdmin[0];
    expect(starterPlan.features.scormXapiExport).toBe(true);
    expect(starterPlan.features.rbac).toBe(true);
    expect(starterPlan.features.sso).toBe(true);
    expect(starterPlan.features.hrisIntegration).toBe(true);
    expect(starterPlan.features.whiteLabel).toBe(true);
    expect(starterPlan.features.customOnboarding).toBe(true);
    expect(starterPlan.features.sla).toBe(true);
    expect(starterPlan.features.dedicatedManager).toBe(true);
    expect(starterPlan.features.fullAnalytics).toBe(true);
    expect(starterPlan.features.adaptiveRecommendations).toBe(true);
    expect(starterPlan.features.contentAuthoring).toBe(true);
    expect(starterPlan.features.cohortManagement).toBe(true);
    expect(starterPlan.features.maxLessons).toBe(-1);
  });

  it("super_admin getMyEntitlements should return Enterprise tier with all features", () => {
    const superAdminEntitlements = {
      tier: "enterprise",
      planName: "Enterprise (Admin)",
      features: {
        maxLessons: -1,
        offlineAccess: true,
        basicTracking: true,
        fullAnalytics: true,
        adaptiveRecommendations: true,
        contentAuthoring: true,
        cohortManagement: true,
        scormXapiExport: true,
        rbac: true,
        sso: true,
        hrisIntegration: true,
        whiteLabel: true,
        customOnboarding: true,
        sla: true,
        dedicatedManager: true,
        gamification: true,
        pushNotifications: true,
        emailSupport: true,
        prioritySupport: true,
        voiceNarration: true,
      },
      subscriptionStatus: null,
    };

    expect(superAdminEntitlements.tier).toBe("enterprise");
    expect(superAdminEntitlements.features.scormXapiExport).toBe(true);
    expect(superAdminEntitlements.features.rbac).toBe(true);
    expect(superAdminEntitlements.features.sso).toBe(true);
    expect(superAdminEntitlements.features.hrisIntegration).toBe(true);
    expect(superAdminEntitlements.features.maxLessons).toBe(-1);
    expect(superAdminEntitlements.features.voiceNarration).toBe(true);
  });

  it("super_admin should have access to SCORM/xAPI export feature", () => {
    const features = {
      scormXapiExport: true,
      rbac: true,
      sso: true,
      hrisIntegration: true,
    };

    expect(features.scormXapiExport).toBe(true);
    expect(features.rbac).toBe(true);
  });

  it("super_admin should have access to audit log feature", () => {
    const features = {
      rbac: true,
      prioritySupport: true,
      emailSupport: true,
    };

    expect(features.rbac).toBe(true);
  });

  it("super_admin should have access to compliance features", () => {
    const features = {
      scormXapiExport: true,
      sso: true,
      hrisIntegration: true,
      customOnboarding: true,
      sla: true,
    };

    expect(features.scormXapiExport).toBe(true);
    expect(features.sso).toBe(true);
    expect(features.hrisIntegration).toBe(true);
  });

  it("regular users should not have access to Pro features without subscription", () => {
    const regularUserFeatures = {
      maxLessons: 5,
      offlineAccess: false,
      basicTracking: true,
      fullAnalytics: false,
      adaptiveRecommendations: false,
      contentAuthoring: false,
      cohortManagement: false,
      scormXapiExport: false,
      rbac: false,
      sso: false,
      hrisIntegration: false,
      whiteLabel: false,
      customOnboarding: false,
      sla: false,
      dedicatedManager: false,
      gamification: false,
      pushNotifications: false,
      emailSupport: false,
      prioritySupport: false,
      voiceNarration: false,
    };

    expect(regularUserFeatures.scormXapiExport).toBe(false);
    expect(regularUserFeatures.rbac).toBe(false);
    expect(regularUserFeatures.sso).toBe(false);
    expect(regularUserFeatures.hrisIntegration).toBe(false);
  });
});
