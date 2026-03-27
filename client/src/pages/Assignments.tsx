import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Clock, ArrowRight, CheckCircle2, AlertCircle, PlayCircle } from "lucide-react";
import { useLocation } from "wouter";

export default function Assignments() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const { data: allAssignments, isLoading } = trpc.assignment.getMyAssignments.useQuery();

  const pending = (allAssignments || []).filter((a: any) => ["pending", "available"].includes(a.status));
  const inProgress = (allAssignments || []).filter((a: any) => a.status === "in_progress");
  const completed = (allAssignments || []).filter((a: any) => a.status === "completed");

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="h-4 w-4 text-green-400" />;
      case "in_progress": return <PlayCircle className="h-4 w-4 text-blue-400" />;
      case "expired": return <AlertCircle className="h-4 w-4 text-red-400" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const priorityColor = (p: string) => {
    switch (p) {
      case "urgent": return "text-red-400 bg-red-400/10 border-red-400/20";
      case "high": return "text-orange-400 bg-orange-400/10 border-orange-400/20";
      case "normal": return "";
      case "low": return "text-muted-foreground";
      default: return "";
    }
  };

  const renderList = (items: any[], emptyMsg: string) => {
    if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}</div>;
    if (items.length === 0) return (
      <div className="text-center py-12">
        <BookOpen className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">{emptyMsg}</p>
      </div>
    );
    return (
      <div className="space-y-2">
        {items.map((a: any) => (
          <Card key={a.id} className="hover:border-primary/20 transition-colors">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {statusIcon(a.status)}
                  <div>
                    <p className="text-sm font-medium text-foreground">Lesson #{a.lessonId}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="outline" className={`text-[10px] ${priorityColor(a.priority)}`}>
                        {a.priority}
                      </Badge>
                      {a.dueDate && (
                        <span className="text-xs text-muted-foreground">
                          Due {new Date(a.dueDate).toLocaleDateString()}
                        </span>
                      )}
                      {a.isScheduleAware && (
                        <Badge variant="outline" className="text-[10px] text-primary border-primary/20">
                          Schedule-aware
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                {a.status !== "completed" && (
                  <Button size="sm" variant="ghost" onClick={() => setLocation(`/lessons/${a.lessonId}`)}>
                    {a.status === "in_progress" ? "Continue" : "Start"}
                    <ArrowRight className="ml-1 h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Assignments</h1>
        <p className="text-muted-foreground">Track your assigned lessons and progress.</p>
      </div>

      <Tabs defaultValue="pending">
        <TabsList>
          <TabsTrigger value="pending">
            Pending {pending.length > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{pending.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="in_progress">
            In Progress {inProgress.length > 0 && <Badge variant="secondary" className="ml-1.5 text-[10px] px-1.5">{inProgress.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        <TabsContent value="pending" className="mt-4">
          {renderList(pending, "No pending assignments.")}
        </TabsContent>
        <TabsContent value="in_progress" className="mt-4">
          {renderList(inProgress, "No lessons in progress.")}
        </TabsContent>
        <TabsContent value="completed" className="mt-4">
          {renderList(completed, "No completed lessons yet.")}
        </TabsContent>
      </Tabs>
    </div>
  );
}
