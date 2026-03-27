import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, CheckCircle2, XCircle, Clock, Eye } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function ReviewQueue() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const orgId = (user as any)?.orgId;
  const utils = trpc.useUtils();

  const { data: reviewItems, isLoading } = trpc.lesson.getReviewQueue.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  const approveMutation = trpc.lesson.approveLesson.useMutation({
    onSuccess: () => { utils.lesson.getReviewQueue.invalidate(); toast.success("Lesson approved and published"); },
  });

  const rejectMutation = trpc.lesson.rejectLesson.useMutation({
    onSuccess: () => { utils.lesson.getReviewQueue.invalidate(); toast.success("Lesson sent back for revision"); },
  });

  const [rejectNotes, setRejectNotes] = useState("");
  const [rejectId, setRejectId] = useState<number | null>(null);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Review Queue</h1>
        <p className="text-muted-foreground">Review and approve submitted lessons before publishing.</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24" />)}</div>
      ) : !reviewItems || reviewItems.length === 0 ? (
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No lessons pending review.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {reviewItems.map((lesson: any) => (
            <Card key={lesson.id} className="hover:border-primary/20 transition-colors">
              <CardContent className="py-4 px-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-semibold text-foreground">{lesson.title}</p>
                      <Badge variant="outline" className="text-[10px] text-yellow-400 bg-yellow-400/10 border-yellow-400/20">
                        Pending Review
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                      {lesson.description || "No description"}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{lesson.contentType}</span>
                      <span>{lesson.difficulty}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {lesson.durationMinutes} min</span>
                      <span>By author #{lesson.authorId}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Button variant="ghost" size="sm" onClick={() => setLocation(`/lessons/${lesson.id}`)}>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-green-400 border-green-400/20 hover:bg-green-400/10"
                      onClick={() => approveMutation.mutate({ id: lesson.id })}
                      disabled={approveMutation.isPending}
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-red-400 border-red-400/20 hover:bg-red-400/10"
                          onClick={() => setRejectId(lesson.id)}
                        >
                          <XCircle className="mr-1 h-3.5 w-3.5" /> Reject
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Reject Lesson</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-2">
                          <Textarea
                            placeholder="Provide feedback for the author..."
                            value={rejectNotes}
                            onChange={(e) => setRejectNotes(e.target.value)}
                            rows={4}
                          />
                          <Button
                            className="w-full"
                            variant="destructive"
                            onClick={() => {
                              if (rejectId && rejectNotes.trim()) {
                                rejectMutation.mutate({ id: rejectId, reviewNotes: rejectNotes });
                                setRejectNotes("");
                                setRejectId(null);
                              } else {
                                toast.error("Please provide review notes");
                              }
                            }}
                          >
                            Send Back for Revision
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
