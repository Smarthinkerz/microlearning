import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useMemo } from "react";
import type { PlanFeatures, FeatureKey } from "../../../shared/featureGating";
import { hasFeature, getFeatureLimit, isLessonLimitReached, getUpgradeMessage, getMinimumTier, FREE_TIER_FEATURES } from "../../../shared/featureGating";

export function useEntitlements() {
  const { user } = useAuth();
  const { data: entitlements, isLoading } = trpc.subscription.getMyEntitlements.useQuery(undefined, {
    enabled: !!user,
    staleTime: 60_000, // Cache for 1 minute
  });

  const features = useMemo<PlanFeatures>(() => {
    return (entitlements?.features as PlanFeatures) || FREE_TIER_FEATURES;
  }, [entitlements]);

  return {
    isLoading,
    tier: entitlements?.tier || "free",
    planName: entitlements?.planName || "Free",
    subscriptionStatus: entitlements?.subscriptionStatus || null,
    trialEndsAt: entitlements?.trialEndsAt,
    currentPeriodEnd: entitlements?.currentPeriodEnd,
    features,

    /** Check if a boolean feature is enabled */
    can: (key: FeatureKey) => hasFeature(features, key),

    /** Get the numeric limit for a feature */
    limit: (key: FeatureKey) => getFeatureLimit(features, key),

    /** Check if the lesson limit is reached */
    isLessonLimitReached: (currentCount: number) => isLessonLimitReached(features, currentCount),

    /** Get upgrade message for a gated feature */
    upgradeMessage: (key: FeatureKey) => getUpgradeMessage(key),

    /** Get the minimum tier required for a feature */
    minimumTier: (key: FeatureKey) => getMinimumTier(key),

    /** Check if user is on a paid plan */
    isPaid: entitlements?.tier !== "free" && entitlements?.tier !== "consumer_free",

    /** Check if user is on trial */
    isTrial: entitlements?.subscriptionStatus === "trial",

    /** Check if user is on enterprise */
    isEnterprise: entitlements?.tier === "enterprise",
  };
}
