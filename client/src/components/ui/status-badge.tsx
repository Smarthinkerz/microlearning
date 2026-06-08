import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, XCircle, FileText, Archive, AlertCircle, PlayCircle } from "lucide-react";

export type StatusValue =
  | "approved" | "active" | "completed" | "published" | "succeeded" | "paid"
  | "pending" | "in_review" | "in_progress" | "trial"
  | "rejected" | "failed" | "cancelled" | "blocked" | "overdue"
  | "draft" | "archived" | "inactive" | "paused"
  | "info" | string;

const STATUS_CONFIG: Record<string, {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  className: string;
}> = {
  // Success states
  approved:  { label: "Approved",   icon: CheckCircle,  className: "bg-success/15 text-success border-success/30" },
  active:    { label: "Active",     icon: CheckCircle,  className: "bg-success/15 text-success border-success/30" },
  completed: { label: "Completed",  icon: CheckCircle,  className: "bg-success/15 text-success border-success/30" },
  published: { label: "Published",  icon: CheckCircle,  className: "bg-success/15 text-success border-success/30" },
  succeeded: { label: "Succeeded",  icon: CheckCircle,  className: "bg-success/15 text-success border-success/30" },
  paid:      { label: "Paid",       icon: CheckCircle,  className: "bg-success/15 text-success border-success/30" },
  // Warning / in-progress states
  pending:     { label: "Pending",     icon: Clock,       className: "bg-warning/15 text-warning border-warning/30" },
  in_review:   { label: "In Review",   icon: Clock,       className: "bg-warning/15 text-warning border-warning/30" },
  in_progress: { label: "In Progress", icon: PlayCircle,  className: "bg-info/15 text-info border-info/30" },
  trial:       { label: "Trial",       icon: Clock,       className: "bg-warning/15 text-warning border-warning/30" },
  // Error / destructive states
  rejected:   { label: "Rejected",   icon: XCircle,      className: "bg-destructive/15 text-destructive border-destructive/30" },
  failed:     { label: "Failed",     icon: XCircle,      className: "bg-destructive/15 text-destructive border-destructive/30" },
  cancelled:  { label: "Cancelled",  icon: XCircle,      className: "bg-destructive/15 text-destructive border-destructive/30" },
  blocked:    { label: "Blocked",    icon: XCircle,      className: "bg-destructive/15 text-destructive border-destructive/30" },
  overdue:    { label: "Overdue",    icon: AlertCircle,  className: "bg-destructive/15 text-destructive border-destructive/30" },
  // Neutral states
  draft:    { label: "Draft",    icon: FileText, className: "bg-muted text-muted-foreground border-border" },
  archived: { label: "Archived", icon: Archive,  className: "bg-muted text-muted-foreground border-border" },
  inactive: { label: "Inactive", icon: Archive,  className: "bg-muted text-muted-foreground border-border" },
  paused:   { label: "Paused",   icon: Clock,    className: "bg-muted text-muted-foreground border-border" },
  // Info
  info: { label: "Info", icon: AlertCircle, className: "bg-info/15 text-info border-info/30" },
};

interface StatusBadgeProps {
  status: StatusValue;
  label?: string;
  showIcon?: boolean;
  className?: string;
  size?: "sm" | "md";
}

export function StatusBadge({ status, label, showIcon = true, className, size = "sm" }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? {
    label: status.replace(/_/g, " "),
    icon: AlertCircle,
    className: "bg-muted text-muted-foreground border-border",
  };
  const Icon = config.icon;
  const displayLabel = label ?? config.label;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 font-medium border capitalize",
        size === "sm" ? "text-xs px-2 py-0.5" : "text-sm px-3 py-1",
        config.className,
        className
      )}
    >
      {showIcon && <Icon className={cn("shrink-0", size === "sm" ? "w-3 h-3" : "w-4 h-4")} />}
      {displayLabel}
    </Badge>
  );
}
