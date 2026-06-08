import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/skeleton-variants";
import { Award, Download, Calendar, Share2, ExternalLink, AlertTriangle, Trophy } from "lucide-react";
import { toast } from "sonner";

function getCertStatus(cert: { expiresAt?: number | null }): "active" | "overdue" | "pending" {
  if (!cert.expiresAt) return "active";
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  if (cert.expiresAt < now) return "overdue";
  if (cert.expiresAt - now < thirtyDays) return "pending";
  return "active";
}

export default function Certificates() {
  const { data: certificates, isLoading } = trpc.certificate.getMyCertificates.useQuery();

  const handleShare = async (cert: any) => {
    const text = `I earned a certificate #${cert.certificateNumber} on LearnShift!`;
    if (navigator.share) {
      await navigator.share({ title: "My Certificate", text, url: cert.pdfUrl ?? window.location.href });
    } else {
      await navigator.clipboard.writeText(cert.pdfUrl ?? window.location.href);
      toast.success("Certificate link copied to clipboard!");
    }
  };

  const activeCerts = (certificates ?? []).filter((c: any) => getCertStatus(c) === "active");
  const expiringSoon = (certificates ?? []).filter((c: any) => getCertStatus(c) === "pending");
  const expired = (certificates ?? []).filter((c: any) => getCertStatus(c) === "overdue");

  return (
    <div className="space-y-6 page-enter">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            My Certificates
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            View, download, and share your earned certificates
          </p>
        </div>
        {!isLoading && certificates && certificates.length > 0 && (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="tabular-nums font-semibold text-foreground">{certificates.length}</span> earned
          </div>
        )}
      </div>

      {/* Expiry warnings */}
      {expiringSoon.length > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-warning/10 border border-warning/30">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-warning">
              {expiringSoon.length} certificate{expiringSoon.length !== 1 ? "s" : ""} expiring soon
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Complete renewal lessons to keep your certifications current.
            </p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : !certificates || certificates.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No certificates yet"
          description="Complete lessons and pass assessments to earn your first certificate. Certificates demonstrate your skills to employers."
          action={{ label: "Browse Lessons", onClick: () => window.location.assign("/lessons") }}
        />
      ) : (
        <div className="space-y-6">
          {/* Active certificates */}
          {activeCerts.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Active ({activeCerts.length})
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {activeCerts.map((cert: any) => (
                  <CertificateCard key={cert.id} cert={cert} status="active" onShare={handleShare} />
                ))}
              </div>
            </section>
          )}

          {/* Expiring soon */}
          {expiringSoon.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-warning uppercase tracking-wide mb-3">
                Expiring Soon ({expiringSoon.length})
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {expiringSoon.map((cert: any) => (
                  <CertificateCard key={cert.id} cert={cert} status="pending" onShare={handleShare} />
                ))}
              </div>
            </section>
          )}

          {/* Expired */}
          {expired.length > 0 && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                Expired ({expired.length})
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 opacity-60">
                {expired.map((cert: any) => (
                  <CertificateCard key={cert.id} cert={cert} status="overdue" onShare={handleShare} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function CertificateCard({
  cert,
  status,
  onShare,
}: {
  cert: any;
  status: "active" | "pending" | "overdue";
  onShare: (cert: any) => void;
}) {
  return (
    <Card className="group hover:border-primary/30 transition-smooth hover:shadow-md">
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
            status === "active" ? "bg-success/15" :
            status === "pending" ? "bg-warning/15" :
            "bg-muted"
          }`}>
            <Award className={`h-6 w-6 ${
              status === "active" ? "text-success" :
              status === "pending" ? "text-warning" :
              "text-muted-foreground"
            }`} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold leading-snug">
                Lesson #{cert.lessonId}
              </p>
              <StatusBadge
                status={status}
                label={status === "active" ? "Valid" : status === "pending" ? "Expiring" : "Expired"}
                size="sm"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 font-mono tracking-wide">
              #{cert.certificateNumber}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Issued {new Date(cert.issuedAt).toLocaleDateString()}
              </span>
              {cert.expiresAt && (
                <span className={`flex items-center gap-1 ${status === "pending" ? "text-warning font-medium" : status === "overdue" ? "text-destructive" : ""}`}>
                  <Calendar className="h-3 w-3" />
                  {status === "overdue" ? "Expired" : "Expires"} {new Date(cert.expiresAt).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/50">
          {cert.pdfUrl ? (
            <Button variant="outline" size="sm" asChild className="flex-1 gap-2 touch-target">
              <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer" download>
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </a>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled className="flex-1 gap-2">
              <Download className="h-3.5 w-3.5" />
              PDF Pending
            </Button>
          )}
          <Button
            variant="ghost" size="sm"
            className="gap-2 touch-target"
            onClick={() => onShare(cert)}
            aria-label="Share certificate"
          >
            <Share2 className="h-3.5 w-3.5" />
          </Button>
          {cert.pdfUrl && (
            <Button variant="ghost" size="sm" asChild className="touch-target" aria-label="View certificate">
              <a href={cert.pdfUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
