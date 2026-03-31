import { useEntitlements } from "@/hooks/useEntitlements";
import type { FeatureKey } from "../../../shared/featureGating";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Crown, Sparkles, ArrowRight, Lock,
  BarChart3, Brain, PenTool, FileOutput,
  Zap, Shield, CheckCircle2
} from "lucide-react";

// ─── Feature Metadata ───────────────────────────────────────────────

interface FeatureMeta {
  title: string;
  description: string;
  icon: React.ElementType;
  benefits: string[];
  gradient: string;
  accentColor: string;
  tierLabel: string;
}

const FEATURE_META: Partial<Record<FeatureKey, FeatureMeta>> = {
  fullAnalytics: {
    title: "Advanced Analytics & Insights",
    description: "Unlock deep workforce intelligence with real-time dashboards, engagement heatmaps, and predictive completion forecasting.",
    icon: BarChart3,
    benefits: [
      "Real-time engagement dashboards",
      "Industry benchmark comparisons",
      "Predictive completion forecasting",
      "Custom report builder",
    ],
    gradient: "from-blue-600 via-indigo-600 to-violet-600",
    accentColor: "text-blue-400",
    tierLabel: "Pro",
  },
  adaptiveRecommendations: {
    title: "AI-Powered Recommendations",
    description: "Let our AI engine analyze learning patterns, schedule gaps, and performance data to deliver the right lesson at the right time.",
    icon: Brain,
    benefits: [
      "Schedule-aware lesson suggestions",
      "Collaborative filtering from peers",
      "Confidence-scored recommendations",
      "Transparent explainability",
    ],
    gradient: "from-emerald-600 via-teal-600 to-cyan-600",
    accentColor: "text-emerald-400",
    tierLabel: "Pro",
  },
  contentAuthoring: {
    title: "Content Authoring Studio",
    description: "Create, edit, and publish custom micro-lessons with our AI-assisted authoring tools. Build training content tailored to your workforce.",
    icon: PenTool,
    benefits: [
      "AI-assisted lesson generation",
      "Rich content editor with media",
      "Custom quiz and assessment builder",
      "Template library for quick starts",
    ],
    gradient: "from-amber-500 via-orange-500 to-red-500",
    accentColor: "text-amber-400",
    tierLabel: "Pro",
  },
  scormXapiExport: {
    title: "SCORM & xAPI Export",
    description: "Export your training content and learner data in industry-standard formats for seamless LMS integration and compliance reporting.",
    icon: FileOutput,
    benefits: [
      "SCORM 1.2 & 2004 package export",
      "xAPI statement streaming",
      "LMS-compatible content packaging",
      "Compliance audit trail export",
    ],
    gradient: "from-purple-600 via-fuchsia-600 to-pink-600",
    accentColor: "text-purple-400",
    tierLabel: "Pro",
  },
};

// ─── Default Fallback ───────────────────────────────────────────────

const DEFAULT_META: FeatureMeta = {
  title: "Premium Feature",
  description: "Upgrade your plan to unlock this feature and accelerate your team's learning outcomes.",
  icon: Crown,
  benefits: [
    "Full feature access",
    "Priority support",
    "Advanced capabilities",
  ],
  gradient: "from-amber-500 via-orange-500 to-red-500",
  accentColor: "text-amber-400",
  tierLabel: "Pro",
};

// ─── Component ──────────────────────────────────────────────────────

interface UpgradeCTAProps {
  feature: FeatureKey;
  /** Compact mode for inline placement */
  compact?: boolean;
  /** Custom class name */
  className?: string;
}

export function UpgradeCTA({ feature, compact = false, className = "" }: UpgradeCTAProps) {
  const { tier, can } = useEntitlements();
  const [, navigate] = useLocation();
  const meta = FEATURE_META[feature] || DEFAULT_META;
  const Icon = meta.icon;

  // Don't render if user already has access
  if (can(feature)) return null;

  if (compact) {
    return (
      <div className={`relative overflow-hidden rounded-xl border border-white/10 bg-gradient-to-r ${meta.gradient} p-[1px] ${className}`}>
        <div className="rounded-[11px] bg-card/95 backdrop-blur-sm p-5">
          <div className="flex items-center gap-4">
            <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center`}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-semibold text-foreground truncate">{meta.title}</h4>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/25">
                  <Lock className="h-2.5 w-2.5" /> {meta.tierLabel}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{meta.description}</p>
            </div>
            <Button
              size="sm"
              onClick={() => navigate("/pricing")}
              className={`flex-shrink-0 bg-gradient-to-r ${meta.gradient} text-white border-0 hover:opacity-90 transition-opacity`}
            >
              Upgrade <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`}>
      {/* Gradient border effect */}
      <div className={`absolute inset-0 bg-gradient-to-br ${meta.gradient} opacity-20 blur-xl`} />
      <div className={`relative bg-gradient-to-br ${meta.gradient} p-[1px] rounded-2xl`}>
        <div className="rounded-[15px] bg-card/[0.97] backdrop-blur-xl overflow-hidden">
          {/* Top accent bar */}
          <div className={`h-1 bg-gradient-to-r ${meta.gradient}`} />

          <div className="p-8 md:p-10">
            {/* Header section */}
            <div className="flex flex-col md:flex-row md:items-start gap-6 mb-8">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-500/15 text-amber-400 border border-amber-500/25">
                      <Lock className="h-3 w-3" /> {meta.tierLabel} Plan Required
                    </span>
                  </div>
                </div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                  {meta.title}
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed max-w-xl">
                  {meta.description}
                </p>
              </div>
            </div>

            {/* Benefits grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
              {meta.benefits.map((benefit, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg bg-white/[0.03] border border-white/[0.06]"
                >
                  <CheckCircle2 className={`h-5 w-5 flex-shrink-0 ${meta.accentColor}`} />
                  <span className="text-sm text-foreground/90">{benefit}</span>
                </div>
              ))}
            </div>

            {/* CTA section */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <Button
                size="lg"
                onClick={() => navigate("/pricing")}
                className={`bg-gradient-to-r ${meta.gradient} text-white border-0 hover:opacity-90 transition-all hover:shadow-lg hover:shadow-primary/25 px-8 h-12 text-base font-semibold`}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Upgrade to {meta.tierLabel}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>14-day free trial included</span>
                <span className="text-muted-foreground/50">|</span>
                <Zap className="h-4 w-4" />
                <span>Cancel anytime</span>
              </div>
            </div>

            {/* Current plan indicator */}
            {tier && (
              <div className="mt-6 pt-6 border-t border-white/[0.06]">
                <p className="text-xs text-muted-foreground">
                  You're currently on the <span className="font-semibold text-foreground capitalize">{tier.replace("_", " ")}</span> plan.
                  Upgrade to unlock {meta.title.toLowerCase()} and more.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
