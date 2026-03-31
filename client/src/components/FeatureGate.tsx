import { useEntitlements } from "@/hooks/useEntitlements";
import type { FeatureKey } from "../../../shared/featureGating";
import { Lock } from "lucide-react";
import { UpgradeCTA } from "@/components/UpgradeCTA";

interface FeatureGateProps {
  feature: FeatureKey;
  children: React.ReactNode;
  /** Show a compact inline lock instead of a full card */
  inline?: boolean;
  /** Custom fallback component */
  fallback?: React.ReactNode;
  /** Hide completely instead of showing upgrade prompt */
  hideIfLocked?: boolean;
}

/**
 * Declarative feature gate component.
 * Wraps content that should only be visible to users with the required feature.
 */
export function FeatureGate({ feature, children, inline, fallback, hideIfLocked }: FeatureGateProps) {
  const { can } = useEntitlements();

  if (can(feature)) {
    return <>{children}</>;
  }

  if (hideIfLocked) return null;
  if (fallback) return <>{fallback}</>;

  if (inline) {
    return <UpgradeCTA feature={feature} compact />;
  }

  return <UpgradeCTA feature={feature} />;
}

/**
 * Inline badge showing the minimum tier required for a feature.
 */
export function TierBadge({ feature }: { feature: FeatureKey }) {
  const { can, minimumTier } = useEntitlements();

  if (can(feature)) return null;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/30">
      <Lock className="h-3 w-3" /> {minimumTier(feature)}
    </span>
  );
}
