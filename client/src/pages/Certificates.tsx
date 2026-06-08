import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { CardSkeleton } from "@/components/ui/skeleton-variants";
import {
  Award,
  Download,
  Calendar,
  Share2,
  ExternalLink,
  AlertTriangle,
  Trophy,
  Search,
  X,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { useMemo, useState } from "react";

type CertStatus = "active" | "pending" | "overdue";
type FilterValue = "all" | "active" | "expiring" | "expired";

function getCertStatus(cert: { expiresAt?: number | null }): CertStatus {
  if (!cert.expiresAt) return "active";
  const now = Date.now();
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  if (cert.expiresAt < now) return "overdue";
  if (cert.expiresAt - now < thirtyDays) return "pending";
  return "active";
}

const FILTER_OPTIONS: { value: FilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "expiring", label: "Expiring Soon" },
  { value: "expired", label: "Expired" },
];

export default function Certificates() {
  const { data: certificates, isLoading } = trpc.certificate.getMyCertificates.useQuery();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterValue>("all");

  const handleShare = async (cert: any) => {
    const text = `I earned a certificate #${cert.certificateNumber} on LearnShift!`;
    if (navigator.share) {
      await navigator.share({ title: "My Certificate", text, url: cert.pdfUrl ?? window.location.href });
    } else {
      await navigator.clipboard.writeText(cert.pdfUrl ?? window.location.href);
      toast.success("Certificate link copied to clipboard!");
    }
  };

  // Derive filtered + searched list
  const filtered = useMemo(() => {
    const all = certificates ?? [];
    const q = search.trim().toLowerCase();

    return all.filter((c: any) => {
      const status = getCertStatus(c);
      // Status filter
      if (filter === "active" && status !== "active") return false;
      if (filter === "expiring" && status !== "pending") return false;
      if (filter === "expired" && status !== "overdue") return false;

      // Search filter — match cert number or lesson id
      if (q) {
        const num = String(c.certificateNumber ?? "").toLowerCase();
        const lessonId = String(c.lessonId ?? "").toLowerCase();
        const lessonTitle = String(c.lessonTitle ?? "").toLowerCase();
        if (!num.includes(q) && !lessonId.includes(q) && !lessonTitle.includes(q)) return false;
      }

      return true;
    });
  }, [certificates, search, filter]);

  const activeCerts = filtered.filter((c: any) => getCertStatus(c) === "active");
  const expiringSoon = filtered.filter((c: any) => getCertStatus(c) === "pending");
  const expired = filtered.filter((c: any) => getCertStatus(c) === "overdue");

  // Raw counts for filter badges
  const rawAll = certificates ?? [];
  const counts: Record<FilterValue, number> = {
    all: rawAll.length,
    active: rawAll.filter((c: any) => getCertStatus(c) === "active").length,
    expiring: rawAll.filter((c: any) => getCertStatus(c) === "pending").length,
    expired: rawAll.filter((c: any) => getCertStatus(c) === "overdue").length,
  };

  const hasResults = activeCerts.length + expiringSoon.length + expired.length > 0;

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
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span className="tabular-nums font-semibold text-foreground">{certificates.length}</span> earned
          </div>
        )}
      </div>

      {/* ── Search & Filter Bar ── */}
      {!isLoading && certificates && certificates.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              type="search"
              placeholder="Search by certificate number or lesson…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 pr-9"
              aria-label="Search certificates"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-fast"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <Filter className="h-4 w-4 text-muted-foreground shrink-0 mr-0.5" />
            {FILTER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(opt.value)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-fast ${
                  filter === opt.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
                aria-pressed={filter === opt.value}
              >
                {opt.label}
                {counts[opt.value] > 0 && (
                  <span className={`tabular-nums text-[10px] px-1.5 py-0.5 rounded-full ${
                    filter === opt.value ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    {counts[opt.value]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

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

      {/* Content */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : !certificates || certificates.length === 0 ? (
        <EmptyState
          icon={Award}
          title="No certificates yet"
          description="Complete lessons and pass assessments to earn your first certificate."
          action={{ label: "Browse Lessons", onClick: () => window.location.assign("/lessons") }}
        />
      ) : !hasResults ? (
        <EmptyState
          icon={Search}
          title="No matching certificates"
          description={
            search
              ? `No certificates match "${search}"${filter !== "all" ? ` in the "${FILTER_OPTIONS.find(o => o.value === filter)?.label}" filter` : ""}.`
              : `No certificates match the selected filter.`
          }
          action={{ label: "Clear Filters", onClick: () => { setSearch(""); setFilter("all"); } }}
        />
      ) : (
        <div className="space-y-6">
          {/* Active */}
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
  status: CertStatus;
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
              <p className="text-sm font-semibold leading-snug truncate">
                {cert.lessonTitle ?? `Lesson #${cert.lessonId}`}
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
            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Issued {new Date(cert.issuedAt).toLocaleDateString()}
              </span>
              {cert.expiresAt && (
                <span className={`flex items-center gap-1 ${
                  status === "pending" ? "text-warning font-medium" :
                  status === "overdue" ? "text-destructive" : ""
                }`}>
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
