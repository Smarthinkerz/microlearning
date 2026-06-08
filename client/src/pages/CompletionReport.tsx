import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, AlertTriangle, CheckCircle2, Clock, Download, Search,
  X, TrendingUp, BarChart2, ShieldAlert, Activity,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";

export default function CompletionReport() {
  const { user } = useAuth();
  const orgId = (user as any)?.orgId;
  const [search, setSearch] = useState("");
  const [showAtRiskOnly, setShowAtRiskOnly] = useState(false);

  const { data, isLoading } = (trpc.assignment as any).completionReport.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  const filtered = useMemo(() => {
    if (!data?.members) return [];
    return data.members.filter((m: any) => {
      const matchSearch = !search ||
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase());
      const matchRisk = !showAtRiskOnly || m.atRisk;
      return matchSearch && matchRisk;
    });
  }, [data, search, showAtRiskOnly]);

  const exportCSV = () => {
    if (!filtered.length) return;
    const rows = [
      ["Name", "Email", "Role", "Status", "Total", "Completed", "In Progress", "Overdue", "Completion %", "At Risk"],
      ...filtered.map((m: any) => [
        m.name || "", m.email || "", m.appRole, m.approvalStatus,
        m.total, m.completed, m.inProgress, m.overdue,
        `${m.completionRate}%`, m.atRisk ? "Yes" : "No",
      ]),
    ];
    const csv = rows.map((r: any[]) => r.map((c: any) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "completion-report.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Report exported");
  };

  const summary = data?.summary;

  return (
    <div className="space-y-6 page-enter">
      {/* Page Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Completion Report</h1>
          <p className="text-muted-foreground text-sm">
            Track team assignment progress and identify at-risk learners.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={!filtered.length}>
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : summary ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <Card>
            <CardContent className="p-4">
              <Users className="h-5 w-5 text-muted-foreground mb-2" />
              <p className="text-2xl font-bold tabular-nums text-foreground">{summary.totalMembers}</p>
              <p className="text-xs text-muted-foreground">Team Members</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <BarChart2 className="h-5 w-5 text-muted-foreground mb-2" />
              <p className="text-2xl font-bold tabular-nums text-foreground">{summary.totalAssignments}</p>
              <p className="text-xs text-muted-foreground">Total Assigned</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <CheckCircle2 className="h-5 w-5 text-success mb-2" />
              <p className="text-2xl font-bold tabular-nums text-success">{summary.completedAssignments}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Clock className="h-5 w-5 text-destructive mb-2" />
              <p className="text-2xl font-bold tabular-nums text-destructive">{summary.overdueAssignments}</p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <ShieldAlert className="h-5 w-5 text-warning mb-2" />
              <p className="text-2xl font-bold tabular-nums text-warning">{summary.atRiskCount}</p>
              <p className="text-xs text-muted-foreground">At Risk</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <Activity className="h-5 w-5 text-primary mb-2" />
              <p className="text-2xl font-bold tabular-nums text-primary">{summary.orgCompletionRate}%</p>
              <p className="text-xs text-muted-foreground">Org Completion</p>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Org-level progress bar */}
      {summary && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Overall Completion</span>
              <span className="text-sm font-bold tabular-nums text-foreground">{summary.orgCompletionRate}%</span>
            </div>
            <Progress value={summary.orgCompletionRate} className="h-3" />
            <p className="text-xs text-muted-foreground mt-2">
              {summary.completedAssignments} of {summary.totalAssignments} assignments completed across {summary.totalMembers} members
            </p>
          </CardContent>
        </Card>
      )}

      {/* Search + At-risk filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search members"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        <Button
          variant={showAtRiskOnly ? "default" : "outline"}
          size="sm"
          onClick={() => setShowAtRiskOnly(!showAtRiskOnly)}
          className="shrink-0"
        >
          <AlertTriangle className="h-4 w-4 mr-2" />
          At Risk Only
          {summary?.atRiskCount ? (
            <Badge variant="secondary" className="ml-2 text-[10px] tabular-nums">{summary.atRiskCount}</Badge>
          ) : null}
        </Button>
      </div>

      {/* Member table */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={showAtRiskOnly ? "No at-risk learners" : "No members found"}
          description={
            showAtRiskOnly
              ? "All learners are on track. Great work!"
              : search
              ? "Try adjusting your search."
              : !orgId
              ? "No organization assigned to your account."
              : "No team members found."
          }
          action={
            (showAtRiskOnly || search)
              ? { label: "Clear filters", onClick: () => { setShowAtRiskOnly(false); setSearch(""); } }
              : undefined
          }
        />
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" role="table" aria-label="Completion report">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Member</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Role</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Total</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Done</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Overdue</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground w-48">Progress</th>
                  <th className="text-center px-4 py-3 font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((m: any, i: number) => (
                  <tr
                    key={m.userId}
                    className={`border-b border-border last:border-0 hover:bg-accent/30 transition-colors ${m.atRisk ? "bg-destructive/5" : ""}`}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {m.atRisk && <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" aria-label="At risk" />}
                        <div>
                          <p className="font-medium text-foreground">{m.name || "Unnamed"}</p>
                          <p className="text-xs text-muted-foreground">{m.email || "No email"}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="text-xs">{m.appRole}</Badge>
                    </td>
                    <td className="px-4 py-3 text-center tabular-nums text-foreground">{m.total}</td>
                    <td className="px-4 py-3 text-center tabular-nums text-success font-medium">{m.completed}</td>
                    <td className="px-4 py-3 text-center tabular-nums">
                      <span className={m.overdue > 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
                        {m.overdue}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Progress value={m.completionRate} className="h-2 flex-1" />
                        <span className="text-xs tabular-nums text-muted-foreground w-9 text-right">
                          {m.completionRate}%
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={m.approvalStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
