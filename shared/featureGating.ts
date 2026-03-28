/**
 * Feature Gating System
 * 
 * Centralized entitlement checks based on subscription plan features.
 * Used by both server (tRPC procedures) and client (UI guards).
 */

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

// Default features for users with no subscription (free tier equivalent)
export const FREE_TIER_FEATURES: PlanFeatures = {
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
  gamification: true,
  pushNotifications: true,
  emailSupport: false,
  prioritySupport: false,
};

export type FeatureKey = keyof PlanFeatures;

/**
 * Check if a boolean feature is enabled for the given plan features.
 */
export function hasFeature(features: PlanFeatures | null | undefined, key: FeatureKey): boolean {
  if (!features) return FREE_TIER_FEATURES[key] as boolean;
  const value = features[key];
  if (typeof value === "boolean") return value;
  // For numeric features, treat > 0 or -1 (unlimited) as "has feature"
  if (typeof value === "number") return value !== 0;
  return false;
}

/**
 * Get the numeric limit for a feature (e.g., maxLessons).
 * Returns -1 for unlimited, 0 for not available.
 */
export function getFeatureLimit(features: PlanFeatures | null | undefined, key: FeatureKey): number {
  if (!features) return FREE_TIER_FEATURES[key] as number;
  const value = features[key];
  if (typeof value === "number") return value;
  return 0;
}

/**
 * Check if the user has reached their lesson limit.
 */
export function isLessonLimitReached(features: PlanFeatures | null | undefined, currentCount: number): boolean {
  const max = getFeatureLimit(features, "maxLessons");
  if (max === -1) return false; // unlimited
  return currentCount >= max;
}

/**
 * Get a human-readable description of what's gated and what tier is needed.
 */
export function getUpgradeMessage(feature: FeatureKey): string {
  const messages: Record<string, string> = {
    fullAnalytics: "Full analytics is available on Pro and Enterprise plans.",
    adaptiveRecommendations: "AI-powered adaptive recommendations require a Pro or Enterprise plan.",
    contentAuthoring: "Content authoring tools are available on Pro and Enterprise plans.",
    cohortManagement: "Cohort management requires a Pro or Enterprise plan.",
    scormXapiExport: "SCORM/xAPI export is available on Pro and Enterprise plans.",
    rbac: "Role-based access control requires a Pro or Enterprise plan.",
    sso: "Single Sign-On (SSO) is an Enterprise-only feature.",
    hrisIntegration: "HRIS integration is an Enterprise-only feature.",
    whiteLabel: "White-label customization is an Enterprise-only feature.",
    customOnboarding: "Custom onboarding is an Enterprise-only feature.",
    offlineAccess: "Offline access requires a Starter plan or higher.",
    emailSupport: "Email support is available on Starter plans and above.",
    prioritySupport: "Priority support is available on Pro and Enterprise plans.",
  };
  return messages[feature] || "This feature requires a higher subscription tier.";
}

/**
 * Get the minimum tier required for a feature.
 */
export function getMinimumTier(feature: FeatureKey): string {
  const tiers: Record<string, string> = {
    offlineAccess: "Starter",
    fullAnalytics: "Pro",
    adaptiveRecommendations: "Pro",
    contentAuthoring: "Pro",
    cohortManagement: "Pro",
    scormXapiExport: "Pro",
    rbac: "Pro",
    gamification: "Free",
    pushNotifications: "Free",
    basicTracking: "Free",
    sso: "Enterprise",
    hrisIntegration: "Enterprise",
    whiteLabel: "Enterprise",
    customOnboarding: "Enterprise",
    sla: "Enterprise",
    dedicatedManager: "Enterprise",
    emailSupport: "Starter",
    prioritySupport: "Pro",
  };
  return tiers[feature] || "Pro";
}
