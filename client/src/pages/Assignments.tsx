import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Progress } from "@/components/ui/progress";
import {
  BookOpen, Clock, ArrowRight, CheckCircle2, AlertCircle, PlayCircle,
  Search, X, Calendar, Zap, WifiOff, ChevronRight, Filter,
} from "lucide-react";
import { useState, useMemo, useRef } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useVirtualizer } from "@tanstack/react-virtual";

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "text-destructive bg-destructive/10 border-destructive/20" },
  high: { label: "High", color: "text-warning bg-warning/10 border-warning/20" },
  normal: { label: "Normal", color: "" },
  low: { label: "Low", color: "text-muted-foreground" },
};

function isDueSoon(dueDate: number | null | undefined): boolean {
  if (!dueDate) return false;
  return dueDate - Date.now() < 48 * 60 * 60 * 1000 && dueDate > Date.now();
}

function isOverdue(dueDate: number | null | undefined): boolean {
  if (!dueDate) return false;
  return dueDate < Date.now();
}

export default function Assignments() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [search, setSearch] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);

  const { data: allAssignments, isLoading } = trpc.assignment.getMyAssignments.useQuery();

  // Optimistic status update
  const updateStatusMutation = trpc.assignment.updateStatus.useMutation({
    onMutate: async ({ id, status }) => {
      await utils.assignment.getMyAssignments.cancel();
      const prev = utils.assignment.getMyAssignments.getData();
      utils.assignment.getMyAssignments.setData(undefined, (old) =>
        (old ?? []).map((a: any) => a.id === id ? { ...a, status } : a)
      );
      if (selectedAssignment?.id === id) setSelectedAssignment((p: any) => ({ ...p, status }));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.assignment.getMyAssignments.setData(undefined, ctx.prev);
      toast.error("Failed to update status");
    },
    onSuccess: () => toast.success("Progress saved"),
    onSettled: () => utils.assignment.getMyAssignments.invalidate(),
  });

  const pending = useMemo(() =>
    (allAssignments || []).filter((a: any) => ["pending", "available"].includes(a.status)),
    [allAssignments]
  );
  const inProgress = useMemo(() =>
    (allAssignments || []).filter((a: any) => a.status === "in_progress"),
    [allAssignments]
  );
  const completed = useMemo(() =>
    (allAssignments || []).filter((a: any) => a.status === "completed"),
    [allAssignments]
  );

  const filterItems = (items: any[]) => {
    return items.filter((a: any) => {
      const matchSearch = !search || `Lesson #${a.lessonId}`.toLowerCase().includes(search.toLowerCase());
      const matchPriority = priorityFilter === "all" || a.priority === priorityFilter;
      return matchSearch && matchPriority;
    });
  };

  const hasFilters = search || priorityFilter !== "all";

  // Virtualized list component
  const VirtualList = ({ items, emptyMsg }: { items: any[]; emptyMsg: string }) => {
    const parentRef = useRef<HTMLDivElement>(null);
    const rowVirtualizer = useVirtualizer({
      count: items.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => 80,
      overscan: 5,
    });

    if (isLoading) return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
    );

    if (items.length === 0) return (
      <EmptyState
        icon={BookOpen}
        title={hasFilters ? "No matching assignments" : emptyMsg.split(".")[0]}
        description={hasFilters ? "Try adjusting your search or filters." : emptyMsg}
        action={hasFilters ? { label: "Clear filters", onClick: () => { setSearch(""); setPriorityFilter("all"); } } : undefined}
      />
    );

    return (
      <div
        ref={parentRef}
        className="overflow-y-auto rounded-xl border border-border"
        style={{ height: Math.min(items.length * 80 + 20, 500) }}
        role="list"
      >
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: "relative" }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const a = items[virtualRow.index];
            const isSelected = selectedAssignment?.id === a.id;
            const dueSoon = isDueSoon(a.dueDate);
            const overdue = isOverdue(a.dueDate);

            return (
              <div
                key={a.id}
                role="listitem"
                style={{
                  position: "absolute", top: 0, left: 0, width: "100%",
                  height: `${virtualRow.size}px`, transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <button
                  className={`w-full text-left px-4 py-3 flex items-center justify-between hover:bg-accent/50 transition-colors border-b border-border last:border-0 min-h-[44px] ${isSelected ? "bg-accent" : ""}`}
                  onClick={() => setSelectedAssignment(isSelected ? null : a)}
                  aria-pressed={isSelected}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {a.status === "completed"
                      ? <CheckCircle2 className="h-5 w-5 text-success shrink-0" />
                      : a.status === "in_progress"
                      ? <PlayCircle className="h-5 w-5 text-info shrink-0" />
                      : overdue
                      ? <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
                      : <Clock className="h-5 w-5 text-muted-foreground shrink-0" />
                    }
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground">Lesson #{a.lessonId}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        {a.priority && a.priority !== "normal" && (
                          <Badge variant="outline" className={`text-[10px] ${PRIORITY_CONFIG[a.priority]?.color}`}>
                            {PRIORITY_CONFIG[a.priority]?.label}
                          </Badge>
                        )}
                        {a.isScheduleAware && (
                          <Badge variant="outline" className="text-[10px] text-primary border-primary/20">
                            <Zap className="h-2.5 w-2.5 mr-0.5" /> Shift-aware
                          </Badge>
                        )}
                        {overdue && (
                          <span className="text-[10px] text-destructive font-medium">Overdue</span>
                        )}
                        {dueSoon && !overdue && (
                          <span className="text-[10px] text-warning font-medium">Due soon</span>
                        )}
                        {a.dueDate && !overdue && !dueSoon && (
                          <span className="text-xs text-muted-foreground">
                            Due {new Date(a.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 page-enter">
      {/* Page Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Assignments</h1>
          <p className="text-muted-foreground text-sm">
            Track your assigned lessons and progress.
            {allAssignments && (
              <span className="ml-2 tabular-nums font-medium text-foreground">
                {pending.length} pending · {inProgress.length} in progress
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Search + Priority filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assignments…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search assignments"
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
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-40" aria-label="Filter by priority">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Priorities</SelectItem>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* List / Detail split */}
      <div className="flex gap-4">
        {/* List pane */}
        <div className={`flex flex-col ${selectedAssignment ? "w-1/2 hidden sm:flex" : "w-full"}`}>
          <Tabs defaultValue="pending">
            <TabsList>
              <TabsTrigger value="pending">
                Pending
                {pending.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 tabular-nums">{pending.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="in_progress">
                In Progress
                {inProgress.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 tabular-nums">{inProgress.length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completed
                {completed.length > 0 && (
                  <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5 tabular-nums">{completed.length}</Badge>
                )}
              </TabsTrigger>
            </TabsList>
            <TabsContent value="pending" className="mt-4">
              <VirtualList items={filterItems(pending)} emptyMsg="No pending assignments." />
            </TabsContent>
            <TabsContent value="in_progress" className="mt-4">
              <VirtualList items={filterItems(inProgress)} emptyMsg="No lessons in progress." />
            </TabsContent>
            <TabsContent value="completed" className="mt-4">
              <VirtualList items={filterItems(completed)} emptyMsg="No completed lessons yet." />
            </TabsContent>
          </Tabs>
        </div>

        {/* Detail pane */}
        {selectedAssignment && (
          <div className="w-full sm:w-1/2">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">Lesson #{selectedAssignment.lessonId}</CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Assignment #{selectedAssignment.id}</p>
                  </div>
                  <button
                    onClick={() => setSelectedAssignment(null)}
                    className="text-muted-foreground hover:text-foreground"
                    aria-label="Close detail panel"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Status */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <StatusBadge status={selectedAssignment.status} />
                </div>

                {/* Priority */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Priority</span>
                  <Badge variant="outline" className={`text-xs ${PRIORITY_CONFIG[selectedAssignment.priority]?.color}`}>
                    {PRIORITY_CONFIG[selectedAssignment.priority]?.label || selectedAssignment.priority}
                  </Badge>
                </div>

                {/* Due date */}
                {selectedAssignment.dueDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Due</span>
                    <span className={`text-sm flex items-center gap-1 ${isOverdue(selectedAssignment.dueDate) ? "text-destructive" : isDueSoon(selectedAssignment.dueDate) ? "text-warning" : "text-foreground"}`}>
                      <Calendar className="h-3.5 w-3.5" />
                      {new Date(selectedAssignment.dueDate).toLocaleDateString()}
                      {isOverdue(selectedAssignment.dueDate) && " (Overdue)"}
                      {isDueSoon(selectedAssignment.dueDate) && !isOverdue(selectedAssignment.dueDate) && " (Due soon)"}
                    </span>
                  </div>
                )}

                {/* Shift-aware */}
                {selectedAssignment.isScheduleAware && (
                  <div className="flex items-start gap-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-medium text-primary">Shift-Aware Delivery</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        This lesson is scheduled around your shift pattern. It will be available during your next break or pre-shift window.
                      </p>
                    </div>
                  </div>
                )}

                {/* Scheduled window */}
                {selectedAssignment.scheduledStartTime && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Available from</span>
                    <span className="text-sm text-foreground tabular-nums">
                      {new Date(selectedAssignment.scheduledStartTime).toLocaleString()}
                    </span>
                  </div>
                )}

                {/* Offline note */}
                <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/40">
                  <WifiOff className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    This lesson is cached for offline use. You can complete it without internet access.
                  </p>
                </div>

                {/* Action */}
                {selectedAssignment.status !== "completed" && (
                  <Button
                    className="w-full min-h-[44px]"
                    onClick={() => setLocation(`/lessons/${selectedAssignment.lessonId}`)}
                  >
                    {selectedAssignment.status === "in_progress" ? "Continue Lesson" : "Start Lesson"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                )}

                {selectedAssignment.status === "completed" && selectedAssignment.completedAt && (
                  <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                    <CheckCircle2 className="h-4 w-4 text-success" />
                    <p className="text-xs text-success font-medium">
                      Completed {new Date(selectedAssignment.completedAt).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
