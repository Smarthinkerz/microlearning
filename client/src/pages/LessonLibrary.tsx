import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen, Clock, Search, Filter, Wand2, Loader2, Sparkles, Library,
  GraduationCap, Shield, Heart, Users, Briefcase, Wrench, ChevronRight,
  Database, Star, Zap, CheckCircle2,
} from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const CATEGORY_ICONS: Record<string, any> = {
  "Safety": Shield,
  "Communication": Users,
  "Compliance": Briefcase,
  "Health & Wellness": Heart,
  "Leadership": Star,
  "Operations": Wrench,
  "Technology": Zap,
};

export default function LessonLibrary() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [aiDialogOpen, setAiDialogOpen] = useState(false);
  const [aiTopic, setAiTopic] = useState("");
  const [aiDifficulty, setAiDifficulty] = useState<"beginner" | "intermediate" | "advanced">("beginner");
  const [aiDuration, setAiDuration] = useState(5);
  const [aiLanguage, setAiLanguage] = useState("en");
  const [aiContentType, setAiContentType] = useState<"quiz" | "scenario" | "article" | "mixed">("mixed");
  const [aiIndustry, setAiIndustry] = useState("");
  const utils = trpc.useUtils();

  const { data: lessons, isLoading } = trpc.library.browse.useQuery({
    search: search || undefined,
    difficulty: difficultyFilter !== "all" ? difficultyFilter : undefined,
    contentType: typeFilter !== "all" ? typeFilter : undefined,
    category: categoryFilter !== "all" ? categoryFilter : undefined,
  });

  const { data: categories } = trpc.library.categories.useQuery();

  const seedMutation = trpc.library.seed.useMutation({
    onSuccess: (data) => {
      if (data.seeded > 0) {
        toast.success(`${data.seeded} lessons added to the library!`);
      } else {
        toast.info(data.message);
      }
      utils.library.browse.invalidate();
      utils.library.categories.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const aiGenerateMutation = trpc.ai.generateAndSave.useMutation({
    onSuccess: (data: any) => {
      if (data.error) {
        toast.error("AI generation failed. Please try again.");
        return;
      }
      toast.success(`Lesson "${data.title}" generated and saved!`);
      setAiDialogOpen(false);
      setAiTopic("");
      utils.library.browse.invalidate();
      utils.library.categories.invalidate();
    },
    onError: () => toast.error("AI generation failed. Please try again."),
  });

  const lessonCount = lessons?.length ?? 0;
  const isAdmin = user && ["employer_admin", "super_admin", "admin"].includes((user as any).appRole || (user as any).role);

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

  // Group by category for the category view
  const groupedByCategory = useMemo(() => {
    if (!lessons) return {};
    const groups: Record<string, any[]> = {};
    lessons.forEach((l: any) => {
      const cat = l.category || "Uncategorized";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(l);
    });
    return groups;
  }, [lessons]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Library className="h-6 w-6 text-primary" />
            Lesson Library
          </h1>
          <p className="text-muted-foreground mt-1">
            {lessonCount > 0
              ? `${lessonCount} lessons available across ${Object.keys(groupedByCategory).length} categories`
              : "Browse and discover micro-learning content"}
          </p>
        </div>
        <div className="flex gap-2">
          {isAdmin && lessonCount < 30 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
            >
              {seedMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
              Seed 30+ Lessons
            </Button>
          )}
          {user && (
            <Dialog open={aiDialogOpen} onOpenChange={setAiDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Wand2 className="mr-2 h-4 w-4" />
                  AI Generate
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Generate Lesson with AI
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label>Topic / Subject</Label>
                    <Textarea
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="e.g., Fire safety procedures for warehouse workers, Effective communication during shift handoffs..."
                      rows={3}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Be specific for better results. Include industry context if relevant.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Difficulty</Label>
                      <Select value={aiDifficulty} onValueChange={(v) => setAiDifficulty(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Duration (min)</Label>
                      <Input type="number" min={1} max={30} value={aiDuration} onChange={(e) => setAiDuration(parseInt(e.target.value) || 5)} />
                    </div>
                    <div>
                      <Label>Content Type</Label>
                      <Select value={aiContentType} onValueChange={(v) => setAiContentType(v as any)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mixed">Mixed</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="scenario">Scenario</SelectItem>
                          <SelectItem value="article">Article</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Language</Label>
                      <Input value={aiLanguage} onChange={(e) => setAiLanguage(e.target.value)} placeholder="en" />
                    </div>
                  </div>
                  <div>
                    <Label>Industry (optional)</Label>
                    <Input value={aiIndustry} onChange={(e) => setAiIndustry(e.target.value)} placeholder="e.g., Healthcare, Manufacturing, Retail" />
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => {
                      if (!aiTopic.trim()) { toast.error("Please enter a topic"); return; }
                      aiGenerateMutation.mutate({
                        topic: aiTopic,
                        difficulty: aiDifficulty,
                        durationMinutes: aiDuration,
                        contentType: aiContentType,
                        language: aiLanguage,
                        industry: aiIndustry || undefined,
                        autoPublish: true,
                      });
                    }}
                    disabled={aiGenerateMutation.isPending}
                  >
                    {aiGenerateMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating lesson...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate &amp; Publish Lesson
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search lessons by title or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {(categories || []).map((cat: string) => (
              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      {/* Content */}
      <Tabs defaultValue="grid">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="category">By Category</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="mt-4">
          {isLoading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 9 }).map((_, i) => (
                <Skeleton key={i} className="h-52" />
              ))}
            </div>
          ) : !lessons || lessons.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/20" />
              <h3 className="text-lg font-semibold text-foreground mb-2">No lessons available yet</h3>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                {isAdmin
                  ? "Get started by seeding the library with 30+ pre-built lessons, or generate custom lessons with AI."
                  : "Lessons will appear here once content has been published."}
              </p>
              {isAdmin && (
                <div className="flex gap-3 justify-center">
                  <Button onClick={() => seedMutation.mutate()} disabled={seedMutation.isPending}>
                    {seedMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
                    Seed Library
                  </Button>
                  <Button variant="outline" onClick={() => setAiDialogOpen(true)}>
                    <Wand2 className="mr-2 h-4 w-4" /> AI Generate
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lessons.map((lesson: any) => (
                <Card
                  key={lesson.id}
                  className="cursor-pointer hover:border-primary/40 transition-all duration-200 group relative overflow-hidden"
                  onClick={() => setLocation(`/lessons/${lesson.id}`)}
                >
                  {lesson.thumbnailUrl && (
                    <div className="w-full h-36 overflow-hidden">
                      <img
                        src={lesson.thumbnailUrl}
                        alt={lesson.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </div>
                  )}
                  {!lesson.thumbnailUrl && (
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/60 to-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                  )}
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{typeIcon(lesson.contentType)}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {lesson.contentType || "mixed"}
                        </Badge>
                      </div>
                      <Badge variant="outline" className={`text-[10px] ${difficultyColor(lesson.difficulty)}`}>
                        {lesson.difficulty}
                      </Badge>
                    </div>
                    <h3 className="font-semibold text-foreground mb-1.5 group-hover:text-primary transition-colors line-clamp-2 text-sm">
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
        </TabsContent>

        <TabsContent value="category" className="mt-4">
          {isLoading ? (
            <div className="space-y-6">
              {[1, 2, 3].map(i => (
                <div key={i}>
                  <Skeleton className="h-8 w-48 mb-3" />
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {[1, 2, 3].map(j => <Skeleton key={j} className="h-32" />)}
                  </div>
                </div>
              ))}
            </div>
          ) : Object.keys(groupedByCategory).length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground/20" />
              <p className="text-muted-foreground">No lessons available yet.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedByCategory).map(([category, catLessons]) => {
                const Icon = CATEGORY_ICONS[category] || GraduationCap;
                return (
                  <div key={category}>
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="h-5 w-5 text-primary" />
                      <h2 className="text-lg font-semibold text-foreground">{category}</h2>
                      <Badge variant="outline" className="text-[10px] ml-1">{catLessons.length}</Badge>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {catLessons.map((lesson: any) => (
                        <Card
                          key={lesson.id}
                          className="cursor-pointer hover:border-primary/40 transition-all duration-200 group"
                          onClick={() => setLocation(`/lessons/${lesson.id}`)}
                        >
                          <CardContent className="py-3 px-4">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm">{typeIcon(lesson.contentType)}</span>
                              <Badge variant="outline" className={`text-[9px] ${difficultyColor(lesson.difficulty)}`}>
                                {lesson.difficulty}
                              </Badge>
                            </div>
                            <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-1">
                              {lesson.title}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              <span>{lesson.durationMinutes || 5} min</span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
