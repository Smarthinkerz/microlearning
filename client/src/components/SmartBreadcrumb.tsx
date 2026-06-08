import { useLocation } from "wouter";
import { ChevronRight, Home } from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface SmartBreadcrumbProps {
  items?: BreadcrumbItem[];
  className?: string;
}

const ROUTE_LABELS: Record<string, string> = {
  "dashboard": "Dashboard",
  "lessons": "Lessons",
  "my-lessons": "My Lessons",
  "assignments": "Assignments",
  "certificates": "Certificates",
  "notifications": "Notifications",
  "settings": "Settings",
  "pricing": "Pricing",
  "analytics": "Analytics",
  "admin": "Admin",
  "roster": "Roster",
  "review-queue": "Review Queue",
  "compliance": "Compliance",
  "audit-log": "Audit Log",
  "security": "Security",
  "shifts": "Shifts",
  "consent": "Privacy & Consent",
  "lesson-editor": "Lesson Editor",
  "content-authoring": "Content Authoring",
  "assign-lessons": "Assign Lessons",
  "system-status": "System Status",
  "ab-testing": "A/B Testing",
};

function segmentToLabel(segment: string): string {
  if (/^\d+$/.test(segment)) return `#${segment}`;
  return ROUTE_LABELS[segment] ?? segment
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

export function SmartBreadcrumb({ items, className }: SmartBreadcrumbProps) {
  const [location] = useLocation();

  const crumbs: BreadcrumbItem[] = items ?? (() => {
    const segments = location.split("/").filter(Boolean);
    if (segments.length === 0) return [];
    return segments.map((seg, i) => ({
      label: segmentToLabel(seg),
      href: i < segments.length - 1 ? "/" + segments.slice(0, i + 1).join("/") : undefined,
    }));
  })();

  if (crumbs.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className={cn("flex items-center gap-1 text-sm text-muted-foreground min-w-0", className)}>
      <Link href="/dashboard" className="flex items-center hover:text-foreground transition-fast shrink-0" aria-label="Dashboard home">
        <Home className="w-3.5 h-3.5" />
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1 min-w-0">
          <ChevronRight className="w-3.5 h-3.5 shrink-0 text-muted-foreground/40" aria-hidden />
          {crumb.href ? (
            <Link
              href={crumb.href}
              className="hover:text-foreground transition-fast truncate max-w-[140px]"
            >
              {crumb.label}
            </Link>
          ) : (
            <span
              className="text-foreground font-medium truncate max-w-[180px]"
              aria-current="page"
            >
              {crumb.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
