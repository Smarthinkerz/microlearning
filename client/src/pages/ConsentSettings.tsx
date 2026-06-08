import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Shield, FileText, Mail, BarChart3, Database, Users, ArrowLeft, CheckCircle, XCircle, Clock } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { DetailSkeleton } from "@/components/ui/skeleton-variants";
import { Link } from "wouter";

const CONSENT_ICONS: Record<string, React.ReactNode> = {
  terms_of_service: <FileText className="h-5 w-5" />,
  privacy_policy: <Shield className="h-5 w-5" />,
  marketing_emails: <Mail className="h-5 w-5" />,
  analytics_tracking: <BarChart3 className="h-5 w-5" />,
  data_processing: <Database className="h-5 w-5" />,
  third_party_sharing: <Users className="h-5 w-5" />,
};

export default function ConsentSettings() {
  const { user } = useAuth();
  const [pendingChanges, setPendingChanges] = useState<Record<string, boolean>>({});

  const { data: consentData, isLoading: consentsLoading } = trpc.consent.getMyConsents.useQuery(
    undefined,
    { enabled: !!user }
  );
  const { data: policyInfo } = trpc.consent.getPolicyInfo.useQuery();

  const updateMutation = trpc.consent.updateConsent.useMutation({
    onSuccess: () => {
      toast.success("Consent updated");
      setPendingChanges({});
    },
    onError: (err: any) => {
      toast.error(err.message);
    },
  });

  const utils = trpc.useUtils();

  const handleToggle = async (consentType: string, granted: boolean, required: boolean) => {
    if (required && !granted) {
      toast.error("This consent is required to use the platform.");
      return;
    }

    await updateMutation.mutateAsync({ consentType: consentType as any, granted });
    utils.consent.getMyConsents.invalidate();
  };

  if (!user) {
    return (
      <div className="container max-w-2xl py-12">
        <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">Please log in to manage your consent preferences.</p></CardContent></Card>
      </div>
    );
  }

  if (consentsLoading) {
    return <div className="container max-w-2xl py-8"><DetailSkeleton /></div>;
  }

  return (
    <div className="container max-w-2xl py-8 page-enter">
      <div className="mb-6">
        <Link href="/settings" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Settings
        </Link>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="w-6 h-6 text-primary" />Privacy & Consent</h1>
        <p className="text-muted-foreground mt-1">
          Manage your data processing preferences. Required consents cannot be withdrawn while using the platform.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Consent Preferences
          </CardTitle>
          <CardDescription>
            Last updated: {policyInfo?.lastUpdated ?? "Loading..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {policyInfo?.types.map((type: any, index: number) => {
            const currentStatus = consentData?.consents[type.id];
            const isGranted = currentStatus?.granted ?? false;
            const isRequired = type.required;

            return (
              <div key={type.id}>
                {index > 0 && <Separator className="my-4" />}
                <div className="flex items-start justify-between gap-4 py-2">
                  <div className="flex gap-3">
                    <div className="mt-0.5 text-muted-foreground">
                      {CONSENT_ICONS[type.id]}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{type.label}</span>
                        {isRequired && (
                          <Badge variant="secondary" className="text-xs">Required</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {type.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge
                          status={isGranted ? "active" : "inactive"}
                          label={isGranted ? "Granted" : "Not granted"}
                          size="sm"
                          showIcon
                        />
                        {currentStatus?.grantedAt && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            {new Date(currentStatus.grantedAt).toLocaleDateString()}
                            {currentStatus.version && ` · v${currentStatus.version}`}
                          </span>
                        )}
                        {currentStatus?.withdrawnAt && !isGranted && (
                          <span className="text-xs text-muted-foreground tabular-nums">
                            Withdrawn {new Date(currentStatus.withdrawnAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Switch
                    checked={isGranted}
                    onCheckedChange={(checked) => handleToggle(type.id, checked, isRequired)}
                    disabled={updateMutation.isPending || consentsLoading}
                    aria-label={`Toggle ${type.label} consent`}
                  />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Your Rights Under GDPR</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            Under the General Data Protection Regulation (GDPR), you have the right to access,
            rectify, erase, and port your personal data. You can also object to processing and
            withdraw consent at any time.
          </p>
          <p>
            To exercise your rights, visit the{" "}
            <Link href="/settings" className="text-primary underline">
              Settings page
            </Link>{" "}
            to export or delete your data, or contact our Data Protection Officer.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
