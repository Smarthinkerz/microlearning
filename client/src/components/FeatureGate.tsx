import { useEntitlements } from "@/hooks/useEntitlements";
import type { FeatureKey } from "../../../shared/featureGating";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, Crown } from "lucide-react";
import { useLocation } from "wouter";

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
  const { can, upgradeMessage, minimumTier } = useEntitlements();
  const [, navigate] = useLocation();

  if (can(feature)) {
    return <>{children}</>;
  }

  if (hideIfLocked) return null;

  if (fallback) return <>{fallback}</>;

  if (inline) {
    return (
      <div className="flex items-center gap-2 text-muted-foreground text-sm py-1">
        <Lock className="h-3.5 w-3.5 text-amber-400" />
        <span>{minimumTier(feature)}+ plan required</span>
      </div>
    );
  }

  return (
    <Card className="border-amber-500/30 bg-amber-500/5">
      <CardContent className="p-6 text-center space-y-3">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 mb-2">
          <Crown className="h-6 w-6 text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">Upgrade Required</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          {upgradeMessage(feature)}
        </p>
        <Button
          onClick={() => navigate("/pricing")}
          className="bg-amber-500 hover:bg-amber-600 text-white"
        >
          <Crown className="mr-2 h-4 w-4" /> View Plans
        </Button>
      </CardContent>
    </Card>
  );
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
