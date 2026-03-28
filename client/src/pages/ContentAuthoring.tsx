import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PenTool, Plus, Search, Clock, Edit, Trash2, Eye, Send } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function ContentAuthoring() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const orgId = (user as any)?.orgId;
  const [search, setSearch] = useState("");
  const utils = trpc.useUtils();

  const { data: allLessons, isLoading } = trpc.lesson.getByOrg.useQuery(
    { orgId: orgId || undefined }
  );

  const deleteMutation = trpc.lesson.delete.useMutation({
    onSuccess: () => { utils.lesson.getByOrg.invalidate(); toast.success("Lesson deleted"); },
  });
  const submitMutation = trpc.lesson.submitForReview.useMutation({
    onSuccess: () => { utils.lesson.getByOrg.invalidate(); toast.success("Submitted for review"); },
  });

  const drafts = useMemo(() => (allLessons || []).filter((l: any) => l.status === "draft"), [allLessons]);
  const inReview = useMemo(() => (allLessons || []).filter((l: any) => l.status === "in_review"), [allLessons]);
  const published = useMemo(() => (allLessons || []).filter((l: any) => l.status === "published"), [allLessons]);

  const filterList = (list: any[]) => {
    if (!search) return list;
    return list.filter(l => l.title.toLowerCase().includes(search.toLowerCase()));
  };

  const statusColor = (s: string) => {
    switch (s) {
      case "draft": return "text-muted-foreground";
      case "in_review": return "text-yellow-400 bg-yellow-400/10 border-yellow-400/20";
      case "published": return "text-green-400 bg-green-400/10 border-green-400/20";
      case "archived": return "text-muted-foreground bg-muted";
      default: return "";
    }
  };

  const renderLessonList = (items: any[], emptyMsg: string) => {
    const filtered = filterList(items);
    if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}</div>;
    if (filtered.length === 0) return (
      <div className="text-center py-12">
        <PenTool className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">{emptyMsg}</p>
      </div>
    );
    return (
      <div className="space-y-2">
        {filtered.map((lesson: any) => (
          <Card key={lesson.id} className="hover:border-primary/20 transition-colors">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-foreground truncate">{lesson.title}</p>
                    <Badge variant="outline" className={`text-[10px] ${statusColor(lesson.status)}`}>
                      {lesson.status}
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">{lesson.contentType}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" /> {lesson.durationMinutes || 5} min
                    </span>
                    <span>{lesson.difficulty}</span>
                    {lesson.category && <span>{lesson.category}</span>}
                    <span>Updated {new Date(lesson.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setLocation(`/authoring/${lesson.id}`)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  {lesson.status === "draft" && (
                    <Button variant="ghost" size="sm" onClick={() => submitMutation.mutate({ id: lesson.id })}>
                      <Send className="h-4 w-4" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-destructive"
                    onClick={() => { if (confirm("Delete this lesson?")) deleteMutation.mutate({ id: lesson.id }); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Content Studio</h1>
          <p className="text-muted-foreground">Create and manage micro-learning content.</p>
        </div>
        <Button size="sm" onClick={() => setLocation("/authoring/new")}>
          <Plus className="mr-2 h-4 w-4" /> New Lesson
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search lessons..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Tabs defaultValue="drafts">
        <TabsList>
          <TabsTrigger value="drafts">Drafts ({drafts.length})</TabsTrigger>
          <TabsTrigger value="review">In Review ({inReview.length})</TabsTrigger>
          <TabsTrigger value="published">Published ({published.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="drafts" className="mt-4">
          {renderLessonList(drafts, "No drafts. Create your first lesson.")}
        </TabsContent>
        <TabsContent value="review" className="mt-4">
          {renderLessonList(inReview, "No lessons pending review.")}
        </TabsContent>
        <TabsContent value="published" className="mt-4">
          {renderLessonList(published, "No published lessons.")}
        </TabsContent>
      </Tabs>
    </div>
  );
}
