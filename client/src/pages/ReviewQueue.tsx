import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  FileText, CheckCircle2, XCircle, Clock, Eye, Search, RefreshCw,
  AlertTriangle, MessageSquare, Filter,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type ReviewAction = "approve" | "request_changes" | "reject";

export default function ReviewQueue() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const orgId = (user as any)?.orgId;
  const utils = trpc.useUtils();

  // Filters
  const [search, setSearch] = useState("");
  const [contentTypeFilter, setContentTypeFilter] = useState("all");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<ReviewAction>("approve");
  const [dialogLesson, setDialogLesson] = useState<any>(null);
  const [reviewNotes, setReviewNotes] = useState("");

  const { data: reviewItems, isLoading, refetch } = trpc.lesson.getReviewQueue.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  // Optimistic approve
  const approveMutation = trpc.lesson.approveLesson.useMutation({
    onMutate: async ({ id }) => {
      await utils.lesson.getReviewQueue.cancel();
      const prev = utils.lesson.getReviewQueue.getData({ orgId: orgId! });
      utils.lesson.getReviewQueue.setData({ orgId: orgId! }, (old) =>
        (old ?? []).filter((l: any) => l.id !== id)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.lesson.getReviewQueue.setData({ orgId: orgId! }, ctx.prev);
      toast.error("Failed to approve lesson");
    },
    onSuccess: () => toast.success("Lesson approved and published"),
    onSettled: () => utils.lesson.getReviewQueue.invalidate(),
  });

  // Optimistic request changes
  const requestChangesMutation = trpc.lesson.rejectLesson.useMutation({
    onMutate: async ({ id }) => {
      await utils.lesson.getReviewQueue.cancel();
      const prev = utils.lesson.getReviewQueue.getData({ orgId: orgId! });
      utils.lesson.getReviewQueue.setData({ orgId: orgId! }, (old) =>
        (old ?? []).filter((l: any) => l.id !== id)
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) utils.lesson.getReviewQueue.setData({ orgId: orgId! }, ctx.prev);
      toast.error("Failed to send back for revision");
    },
    onSuccess: () => toast.success("Lesson sent back for revision"),
    onSettled: () => utils.lesson.getReviewQueue.invalidate(),
  });

  const filtered = useMemo(() => {
    if (!reviewItems) return [];
    return reviewItems.filter((l: any) => {
      const matchSearch = !search ||
        l.title?.toLowerCase().includes(search.toLowerCase()) ||
        l.description?.toLowerCase().includes(search.toLowerCase());
      const matchType = contentTypeFilter === "all" || l.contentType === contentTypeFilter;
      return matchSearch && matchType;
    });
  }, [reviewItems, search, contentTypeFilter]);

  const openDialog = (lesson: any, action: ReviewAction) => {
    setDialogLesson(lesson);
    setDialogAction(action);
    setReviewNotes("");
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!dialogLesson) return;
    if (dialogAction !== "approve" && !reviewNotes.trim()) {
      toast.error("Please provide review notes before submitting");
      return;
    }
    if (dialogAction === "approve") {
      approveMutation.mutate({ id: dialogLesson.id, reviewNotes: reviewNotes || undefined });
    } else {
      // Both "request_changes" and "reject" use rejectLesson (sets status back to draft)
      requestChangesMutation.mutate({ id: dialogLesson.id, reviewNotes });
    }
    setDialogOpen(false);
  };

  const actionConfig: Record<ReviewAction, { label: string; color: string; icon: any; description: string }> = {
    approve: {
      label: "Approve & Publish",
      color: "text-success",
      icon: CheckCircle2,
      description: "This lesson will be immediately published and available to learners.",
    },
    request_changes: {
      label: "Request Changes",
      color: "text-warning",
      icon: MessageSquare,
      description: "The lesson will be returned to draft. The author will see your feedback.",
    },
    reject: {
      label: "Reject",
      color: "text-destructive",
      icon: XCircle,
      description: "The lesson will be rejected and returned to draft with your reason.",
    },
  };

  const isPending = approveMutation.isPending || requestChangesMutation.isPending;

  return (
    <div className="space-y-6 page-enter">
      {/* Page Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Review Queue</h1>
          <p className="text-muted-foreground text-sm">
            Review and approve submitted lessons before publishing.
            {reviewItems && reviewItems.length > 0 && (
              <span className="ml-2 tabular-nums font-medium text-foreground">{reviewItems.length} pending</span>
            )}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Search + Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lessons…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            aria-label="Search review queue"
          />
        </div>
        <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
          <SelectTrigger className="w-40" aria-label="Filter by content type">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="article">Article</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="quiz">Quiz</SelectItem>
            <SelectItem value="scenario">Scenario</SelectItem>
            <SelectItem value="mixed">Mixed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-28 rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={search || contentTypeFilter !== "all" ? "No matching lessons" : "Queue is clear"}
          description={
            search || contentTypeFilter !== "all"
              ? "Try adjusting your search or filter."
              : "All submitted lessons have been reviewed. Check back when authors submit new content."
          }
          action={
            search || contentTypeFilter !== "all"
              ? { label: "Clear filters", onClick: () => { setSearch(""); setContentTypeFilter("all"); } }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((lesson: any) => (
            <Card key={lesson.id} className="hover:border-primary/20 transition-colors">
              <CardContent className="py-4 px-4">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="text-sm font-semibold text-foreground truncate">{lesson.title}</p>
                      <StatusBadge status="pending" />
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {lesson.description || "No description provided."}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <Badge variant="outline" className="text-[10px]">{lesson.contentType}</Badge>
                      <Badge variant="outline" className="text-[10px]">{lesson.difficulty}</Badge>
                      <span className="flex items-center gap-1 tabular-nums">
                        <Clock className="h-3 w-3" /> {lesson.durationMinutes} min
                      </span>
                      <span>Author #{lesson.authorId}</span>
                      {lesson.createdAt && (
                        <span>Submitted {new Date(lesson.createdAt).toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setLocation(`/lessons/${lesson.id}`)}
                      aria-label="Preview lesson"
                      className="min-h-[44px] min-w-[44px]"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-success border-success/20 hover:bg-success/10 min-h-[44px]"
                      onClick={() => openDialog(lesson, "approve")}
                      disabled={isPending}
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-warning border-warning/20 hover:bg-warning/10 min-h-[44px]"
                      onClick={() => openDialog(lesson, "request_changes")}
                      disabled={isPending}
                    >
                      <MessageSquare className="mr-1 h-3.5 w-3.5" /> Request Changes
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-destructive border-destructive/20 hover:bg-destructive/10 min-h-[44px]"
                      onClick={() => openDialog(lesson, "reject")}
                      disabled={isPending}
                    >
                      <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Review Action Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {dialogAction && (() => {
                const cfg = actionConfig[dialogAction];
                const Icon = cfg.icon;
                return <><Icon className={`h-5 w-5 ${cfg.color}`} /> {cfg.label}</>;
              })()}
            </DialogTitle>
            {dialogLesson && (
              <DialogDescription>
                <span className="font-medium text-foreground">"{dialogLesson.title}"</span>
                {" — "}{dialogAction && actionConfig[dialogAction].description}
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="space-y-3 py-2">
            {dialogAction === "approve" && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Review notes <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Textarea
                  placeholder="Add any notes for the author (optional for approval)…"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={3}
                  aria-describedby="review-notes-hint"
                />
              </div>
            )}
            {dialogAction !== "approve" && (
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">
                  Feedback for author <span className="text-destructive">*</span>
                </label>
                <Textarea
                  placeholder={
                    dialogAction === "request_changes"
                      ? "Describe what needs to be changed before approval…"
                      : "Explain why this lesson is being rejected…"
                  }
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  rows={4}
                  aria-required="true"
                  aria-describedby="review-notes-required"
                />
                {!reviewNotes.trim() && (
                  <p id="review-notes-required" className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3 text-warning" />
                    Feedback is required so the author can improve the content.
                  </p>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleConfirm}
              disabled={isPending || (dialogAction !== "approve" && !reviewNotes.trim())}
              className={
                dialogAction === "approve" ? "bg-success hover:bg-success/90 text-success-foreground"
                : dialogAction === "request_changes" ? "bg-warning hover:bg-warning/90 text-warning-foreground"
                : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              }
            >
              {isPending ? "Submitting…" : actionConfig[dialogAction]?.label}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
