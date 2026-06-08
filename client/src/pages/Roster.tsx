import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Users, Search, UserCog, Mail, Calendar, BookOpen, Award, Clock,
  ChevronRight, X, Filter, Download, TrendingUp,
} from "lucide-react";
import { useState, useMemo, useRef, useCallback } from "react";
import { toast } from "sonner";
import { useVirtualizer } from "@tanstack/react-virtual";

const ROLE_OPTIONS = [
  { value: "all", label: "All Roles" },
  { value: "learner", label: "Learner" },
  { value: "content_author", label: "Content Author" },
  { value: "employer_admin", label: "Employer Admin" },
  { value: "super_admin", label: "Super Admin" },
];

const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "approved", label: "Approved" },
  { value: "pending", label: "Pending" },
  { value: "blocked", label: "Blocked" },
];

export default function Roster() {
  const { user } = useAuth();
  const orgId = (user as any)?.orgId;
  const userRole = (user as any)?.appRole || "learner";
  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMember, setSelectedMember] = useState<any>(null);

  const { data: members, isLoading } = trpc.org.getMembers.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  const setRoleMutation = trpc.user.setRole.useMutation({
    onMutate: async ({ userId, appRole }) => {
      await utils.org.getMembers.cancel();
      const prev = utils.org.getMembers.getData({ orgId: orgId! });
      utils.org.getMembers.setData({ orgId: orgId! }, (old) =>
        (old ?? []).map((m: any) => m.id === userId ? { ...m, appRole } : m)
      );
      if (selectedMember?.id === userId) setSelectedMember((p: any) => ({ ...p, appRole }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.org.getMembers.setData({ orgId: orgId! }, ctx.prev);
      toast.error("Failed to update role");
    },
    onSuccess: () => toast.success("Role updated"),
    onSettled: () => utils.org.getMembers.invalidate(),
  });

  const filtered = useMemo(() => {
    if (!members) return [];
    return members.filter((m: any) => {
      const matchSearch = !search ||
        m.name?.toLowerCase().includes(search.toLowerCase()) ||
        m.email?.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all" || m.appRole === roleFilter;
      const matchStatus = statusFilter === "all" || m.approvalStatus === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [members, search, roleFilter, statusFilter]);

  // Virtualized list
  const parentRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 72,
    overscan: 5,
  });

  const clearFilters = useCallback(() => {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
  }, []);

  const hasFilters = search || roleFilter !== "all" || statusFilter !== "all";

  const exportCSV = () => {
    if (!filtered.length) return;
    const rows = [
      ["Name", "Email", "Role", "Status", "Joined"],
      ...filtered.map((m: any) => [
        m.name || "", m.email || "", m.appRole || "", m.approvalStatus || "",
        m.createdAt ? new Date(m.createdAt).toLocaleDateString() : "",
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "roster.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("Roster exported");
  };

  return (
    <div className="space-y-5 page-enter">
      {/* Page Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Team Roster</h1>
          <p className="text-muted-foreground text-sm">
            Manage team members and their roles.
            {members && (
              <span className="ml-2 tabular-nums font-medium text-foreground">{members.length} members</span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCSV} disabled={!filtered.length}>
          <Download className="h-4 w-4 mr-2" /> Export CSV
        </Button>
      </div>

      {/* Search + Filters */}
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
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-40" aria-label="Filter by role">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ROLE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
          </SelectContent>
        </Select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="shrink-0">
            <X className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </div>

      {/* List / Detail split */}
      <div className="flex gap-4 min-h-[500px]">
        {/* List pane */}
        <div className={`flex flex-col ${selectedMember ? "w-1/2 hidden sm:flex" : "w-full"}`}>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Users}
              title={hasFilters ? "No matching members" : "No team members"}
              description={
                hasFilters
                  ? "Try adjusting your search or filters."
                  : !orgId ? "No organization assigned to your account." : "Your organization has no members yet."
              }
              action={hasFilters ? { label: "Clear filters", onClick: clearFilters } : undefined}
            />
          ) : (
            <div
              ref={parentRef}
              className="overflow-y-auto rounded-xl border border-border"
              style={{ height: "600px" }}
              role="list"
              aria-label="Team members"
            >
              <div
                style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}
              >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const member = filtered[virtualRow.index];
                  const isSelected = selectedMember?.id === member.id;
                  return (
                    <div
                      key={member.id}
                      role="listitem"
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`,
                      }}
                    >
                      <button
                        className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors border-b border-border last:border-0 min-h-[44px] ${isSelected ? "bg-accent" : ""}`}
                        onClick={() => setSelectedMember(isSelected ? null : member)}
                        aria-pressed={isSelected}
                        aria-label={`Select ${member.name || "member"}`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-sm font-medium text-primary">
                              {member.name?.charAt(0).toUpperCase() || "U"}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">{member.name || "Unnamed"}</p>
                            <p className="text-xs text-muted-foreground truncate">{member.email || "No email"}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 ml-2">
                          <StatusBadge status={member.approvalStatus || "pending"} />
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Detail pane */}
        {selectedMember && (
          <div className="w-full sm:w-1/2 flex flex-col gap-4">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-lg font-semibold text-primary">
                        {selectedMember.name?.charAt(0).toUpperCase() || "U"}
                      </span>
                    </div>
                    <div>
                      <CardTitle className="text-base">{selectedMember.name || "Unnamed"}</CardTitle>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Mail className="h-3 w-3" /> {selectedMember.email || "No email"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedMember(null)}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Close detail panel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Account Status</span>
                  <StatusBadge status={selectedMember.approvalStatus || "pending"} />
                </div>

                {/* Role */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Role</span>
                  {userRole === "super_admin" ? (
                    <Select
                      value={selectedMember.appRole}
                      onValueChange={(val) =>
                        setRoleMutation.mutate({ userId: selectedMember.id, appRole: val as any })
                      }
                    >
                      <SelectTrigger className="w-40 h-8">
                        <UserCog className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="learner">Learner</SelectItem>
                        <SelectItem value="content_author">Content Author</SelectItem>
                        <SelectItem value="employer_admin">Employer Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <Badge variant="outline" className="text-xs">{selectedMember.appRole}</Badge>
                  )}
                </div>

                {/* Joined */}
                {selectedMember.createdAt && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Joined</span>
                    <span className="text-sm text-foreground flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      {new Date(selectedMember.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}

                {/* Timezone */}
                {selectedMember.timezone && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Timezone</span>
                    <span className="text-sm text-foreground">{selectedMember.timezone}</span>
                  </div>
                )}

                {/* Quick stats placeholder */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                  <div className="text-center p-2 rounded-lg bg-muted/40">
                    <BookOpen className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Lessons</p>
                    <p className="text-sm font-semibold tabular-nums text-foreground">—</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/40">
                    <TrendingUp className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Completion</p>
                    <p className="text-sm font-semibold tabular-nums text-foreground">—</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/40">
                    <Award className="h-4 w-4 mx-auto mb-1 text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Certs</p>
                    <p className="text-sm font-semibold tabular-nums text-foreground">—</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
