import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { BookOpen, Clock, Search, Filter, ChevronRight, CheckCircle2, PlayCircle, Library } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";

export default function MyLessons() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const orgId = (user as any)?.orgId;
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  // Fetch org-specific lessons if user has an org
  const { data: orgLessons, isLoading: orgLoading } = trpc.lesson.getByOrg.useQuery(
    { orgId: orgId!, status: "published" },
    { enabled: !!orgId }
  );

  // Also fetch from the public library
  const { data: libraryLessons, isLoading: libLoading } = trpc.library.browse.useQuery({});

  const isLoading = orgLoading || libLoading;

  // Merge and deduplicate lessons (org lessons first, then library)
  const allLessons = useMemo(() => {
    const orgList = orgLessons || [];
    const libList = libraryLessons || [];
    const seen = new Set(orgList.map((l: any) => l.id));
    const merged = [...orgList];
    for (const l of libList) {
      if (!seen.has((l as any).id)) {
        merged.push(l as any);
        seen.add((l as any).id);
      }
    }
    return merged;
  }, [orgLessons, libraryLessons]);

  const filtered = useMemo(() => {
    return allLessons.filter((l: any) => {
      const matchSearch = !search || l.title.toLowerCase().includes(search.toLowerCase()) ||
        l.description?.toLowerCase().includes(search.toLowerCase());
      const matchDifficulty = difficultyFilter === "all" || l.difficulty === difficultyFilter;
      const matchType = typeFilter === "all" || l.contentType === typeFilter;
      return matchSearch && matchDifficulty && matchType;
    });
  }, [allLessons, search, difficultyFilter, typeFilter]);

  const difficultyColor = (d: string) => {
    switch (d) {
      case "beginner": return "text-emerald-400 bg-emerald-400/10 border-emerald-400/20";
      case "intermediate": return "text-amber-400 bg-amber-400/10 border-amber-400/20";
      case "advanced": return "text-rose-400 bg-rose-400/10 border-rose-400/20";
      default: return "";
    }
  };

  const typeIcon = (t: string) => {
    switch (t) {
      case "quiz": return "📝";
      case "video": return "🎬";
      case "scenario": return "🔀";
      case "article": return "📖";
      case "assessment": return "✅";
      default: return "📚";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Lessons</h1>
          <p className="text-muted-foreground">
            {filtered.length > 0 ? `${filtered.length} lessons available` : "Browse available micro-lessons"}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setLocation("/library")}>
          <Library className="mr-2 h-4 w-4" />
          Full Library
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lessons..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            <SelectItem value="beginner">Beginner</SelectItem>
            <SelectItem value="intermediate">Intermediate</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="video">Video</SelectItem>
            <SelectItem value="quiz">Quiz</SelectItem>
            <SelectItem value="scenario">Scenario</SelectItem>
            <SelectItem value="article">Article</SelectItem>
            <SelectItem value="mixed">Mixed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Lesson Grid */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
          <p className="text-muted-foreground">No lessons found.</p>
          <Button variant="link" className="mt-2" onClick={() => setLocation("/library")}>
            Browse the full lesson library
          </Button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((lesson: any) => (
            <Card
              key={lesson.id}
              className="cursor-pointer hover:border-primary/30 transition-all duration-200 group relative overflow-hidden"
              onClick={() => setLocation(`/lessons/${lesson.id}`)}
            >
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-primary/60 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{typeIcon(lesson.contentType)}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {lesson.contentType || "mixed"}
                    </Badge>
                  </div>
                  <Badge variant="outline" className={`text-[10px] ${difficultyColor(lesson.difficulty)}`}>
                    {lesson.difficulty}
                  </Badge>
                </div>
                <h3 className="font-semibold text-foreground mb-1 group-hover:text-primary transition-colors line-clamp-2 text-sm">
                  {lesson.title}
                </h3>
                <p className="text-xs text-muted-foreground line-clamp-2 mb-3">
                  {lesson.description || "No description available."}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {lesson.durationMinutes || 5} min
                    </span>
                    {lesson.category && (
                      <span className="flex items-center gap-1">
                        <Filter className="h-3 w-3" />
                        {lesson.category}
                      </span>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
