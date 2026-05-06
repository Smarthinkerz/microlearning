/**
 * Subscription-Tier Feature Gating Middleware
 * 
 * Provides reusable tRPC middleware that enforces feature access
 * based on the user's subscription plan. Admin users bypass all checks.
 */
import { TRPCError } from "@trpc/server";
import type { FeatureKey, PlanFeatures } from "../../shared/featureGating";
import { hasFeature, FREE_TIER_FEATURES, getUpgradeMessage, getMinimumTier } from "../../shared/featureGating";
import * as db from "../db";

/**
 * Resolve the current user's plan features from their org subscription.
 * Super admin users get all features unlocked.
 * Returns FREE_TIER_FEATURES if no active subscription found.
 */
export async function resolveUserFeatures(user: { id: number; orgId: number | null; role?: string; appRole?: string }): Promise<{
  features: PlanFeatures;
  tier: string;
  planName: string;
}> {
  // Super admin users get all features
  if (user.appRole === "super_admin") {
    return {
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
      tier: "enterprise",
      planName: "Enterprise (Admin)",
    };
  }

  if (!user.orgId) {
    return { features: FREE_TIER_FEATURES, tier: "free", planName: "Free" };
  }

  const sub = await db.getOrgSubscription(user.orgId);
  if (!sub || sub.status === "canceled" || sub.status === "expired") {
    return { features: FREE_TIER_FEATURES, tier: "free", planName: "Free" };
  }

  const plan = await db.getPlanById(sub.planId);
  if (!plan?.features) {
    return { features: FREE_TIER_FEATURES, tier: "free", planName: "Free" };
  }

  return {
    features: plan.features as PlanFeatures,
    tier: plan.tier,
    planName: plan.name,
  };
}

/**
 * Enforce that the user has a specific feature enabled in their plan.
 * Admin and super_admin users always bypass the check.
 * Throws FORBIDDEN with a clear upgrade message if the feature is not available.
 */
export async function enforceFeatureAccess(
  user: { id: number; orgId: number | null; role?: string; appRole?: string },
  feature: FeatureKey
): Promise<void> {
  // Admin and super_admin users bypass all feature gating
  if (user.role === "admin" || user.appRole === "super_admin") return;

  const { features } = await resolveUserFeatures(user);

  if (!hasFeature(features, feature)) {
    const message = getUpgradeMessage(feature);
    const minTier = getMinimumTier(feature);
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `${message} Upgrade to ${minTier} or higher to unlock this feature.`,
    });
  }
}

/**
 * Enforce that the user is on a specific tier or higher.
 * Tier hierarchy: free < consumer_free < starter < consumer_premium < pro < enterprise
 */
const TIER_HIERARCHY: Record<string, number> = {
  free: 0,
  consumer_free: 1,
  starter: 2,
  consumer_premium: 3,
  pro: 4,
  enterprise: 5,
};

export async function enforceTierAccess(
  user: { id: number; orgId: number | null; role?: string; appRole?: string },
  minimumTier: string
): Promise<void> {
  // Admin and super_admin users bypass all tier checks
  if (user.role === "admin" || user.appRole === "super_admin") return;

  const { tier } = await resolveUserFeatures(user);
  const userLevel = TIER_HIERARCHY[tier] ?? 0;
  const requiredLevel = TIER_HIERARCHY[minimumTier] ?? 0;

  if (userLevel < requiredLevel) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `This feature requires a ${minimumTier} plan or higher. Your current plan is ${tier}. Please upgrade to continue.`,
    });
  }
}
