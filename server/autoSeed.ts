import { SEED_LESSONS } from "./seedLessons";
import * as db from "./db";

/**
 * Auto-seeds the lesson library on server startup if fewer than 30 published lessons exist.
 * Creates a default organization if none exists.
 * Runs once, silently, with no user interaction required.
 */
export async function autoSeedLessons() {
  try {
    const dbInstance = await db.getDb();
    if (!dbInstance) {
      console.log("[AutoSeed] Database not available, skipping seed.");
      return;
    }

    const count = await db.getPublishedLessonsCount();
    if (count >= 30) {
      console.log(`[AutoSeed] Library already has ${count} lessons, skipping.`);
      return;
    }

    // Ensure at least one organization exists
    let orgId: number;
    const orgs = await db.getAllOrganizations();
    if (orgs.length > 0) {
      orgId = orgs[0].id;
    } else {
      const newOrg = await db.createOrganization({
        name: "Smarthinkerz LearnShift",
        slug: "platform-default",
        industry: "General",
        maxUsers: 1000,
      });
      orgId = (newOrg as any).id ?? 1;
      console.log(`[AutoSeed] Created default organization (id: ${orgId}).`);
    }

    // Build lesson records from seed data
    const lessonsToInsert = SEED_LESSONS.map(sl => ({
      orgId,
      title: sl.title,
      description: sl.description,
      content: sl.content,
      contentType: sl.contentType as any,
      durationMinutes: sl.durationMinutes,
      difficulty: sl.difficulty as any,
      category: sl.category,
      tags: sl.tags,
      language: sl.language,
      authorId: 1, // system author
      status: "published" as const,
      publishedAt: new Date(),
      thumbnailUrl: sl.thumbnailUrl || null,
    }));

    await db.bulkCreateLessons(lessonsToInsert);
    console.log(`[AutoSeed] Seeded ${lessonsToInsert.length} lessons into the library.`);

    // Seed subscription plans
    await autoSeedPlans();
  } catch (err) {
    console.error("[AutoSeed] Failed to seed lessons:", err);
  }
}

export async function autoSeedPlans() {
  try {
    const existingCount = await db.getPlansCount();
    if (existingCount > 0) {
      console.log(`[AutoSeed] Plans already exist (${existingCount}), skipping.`);
      return;
    }

    const defaultPlans = [
      {
        name: "Starter",
        slug: "starter",
        tier: "starter" as const,
        priceMonthly: 395,
        priceYearly: 3950,
        isPerUser: true,
        sortOrder: 1,
        features: {
          maxLessons: 30, offlineAccess: true, basicTracking: true, fullAnalytics: false,
          adaptiveRecommendations: false, contentAuthoring: false, cohortManagement: false,
          scormXapiExport: false, rbac: false, sso: false, hrisIntegration: false,
          whiteLabel: false, customOnboarding: false, sla: false, dedicatedManager: false,
          gamification: false, pushNotifications: true, emailSupport: true, prioritySupport: false,
          voiceNarration: false,
        },
      },
      {
        name: "Pro",
        slug: "pro",
        tier: "pro" as const,
        priceMonthly: 895,
        priceYearly: 8950,
        isPerUser: true,
        sortOrder: 2,
        features: {
          maxLessons: -1, offlineAccess: true, basicTracking: true, fullAnalytics: true,
          adaptiveRecommendations: true, contentAuthoring: true, cohortManagement: true,
          scormXapiExport: true, rbac: true, sso: false, hrisIntegration: false,
          whiteLabel: false, customOnboarding: false, sla: false, dedicatedManager: false,
          gamification: true, pushNotifications: true, emailSupport: true, prioritySupport: true,
          voiceNarration: true,
        },
      },
      {
        name: "Enterprise",
        slug: "enterprise",
        tier: "enterprise" as const,
        priceMonthly: 1200,
        priceYearly: 12000,
        isPerUser: true,
        sortOrder: 3,
        features: {
          maxLessons: -1, offlineAccess: true, basicTracking: true, fullAnalytics: true,
          adaptiveRecommendations: true, contentAuthoring: true, cohortManagement: true,
          scormXapiExport: true, rbac: true, sso: true, hrisIntegration: true,
          whiteLabel: true, customOnboarding: true, sla: true, dedicatedManager: true,
          gamification: true, pushNotifications: true, emailSupport: true, prioritySupport: true,
          voiceNarration: true,
        },
      },
      {
        name: "Free",
        slug: "consumer-free",
        tier: "consumer_free" as const,
        priceMonthly: 0,
        isPerUser: false,
        sortOrder: 4,
        features: {
          maxLessons: 5, offlineAccess: false, basicTracking: true, fullAnalytics: false,
          adaptiveRecommendations: false, contentAuthoring: false, cohortManagement: false,
          scormXapiExport: false, rbac: false, sso: false, hrisIntegration: false,
          whiteLabel: false, customOnboarding: false, sla: false, dedicatedManager: false,
          gamification: true, pushNotifications: true, emailSupport: false, prioritySupport: false,
          voiceNarration: false,
        },
      },
      {
        name: "Premium",
        slug: "consumer-premium",
        tier: "consumer_premium" as const,
        priceMonthly: 299,
        priceYearly: 2990,
        isPerUser: false,
        sortOrder: 5,
        features: {
          maxLessons: -1, offlineAccess: true, basicTracking: true, fullAnalytics: false,
          adaptiveRecommendations: true, contentAuthoring: false, cohortManagement: false,
          scormXapiExport: false, rbac: false, sso: false, hrisIntegration: false,
          whiteLabel: false, customOnboarding: false, sla: false, dedicatedManager: false,
          gamification: true, pushNotifications: true, emailSupport: true, prioritySupport: false,
          voiceNarration: true,
        },
      },
    ];

    for (const plan of defaultPlans) {
      await db.createPlan(plan);
    }
    console.log(`[AutoSeed] Seeded ${defaultPlans.length} subscription plans.`);
  } catch (err) {
    console.error("[AutoSeed] Failed to seed plans:", err);
  }
}
