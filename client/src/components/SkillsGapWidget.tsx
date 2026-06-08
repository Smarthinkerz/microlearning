import { useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export function SkillsGapWidget() {
  const { data: lessons, isLoading: lessonsLoading } = trpc.library.browse.useQuery({});
  const { data: attempts, isLoading: attemptsLoading } = trpc.attempt.getByUser.useQuery();

  const topGaps = useMemo(() => {
    if (!lessons || !attempts) return [];
    type AttemptRow = { status: string; lessonId: number };
    const typedAttempts = attempts as AttemptRow[];
    const categoryStats = new Map<string, { completed: number; total: number }>();
    lessons.forEach((lesson) => {
      const cat = lesson.category || "Uncategorized";
      const cur = categoryStats.get(cat) ?? { completed: 0, total: 0 };
      cur.total += 1;
      categoryStats.set(cat, cur);
    });
    typedAttempts.forEach((attempt) => {
      if (attempt.status === "completed") {
        const lesson = lessons.find((l) => l.id === attempt.lessonId);
        if (lesson) {
          const cat = lesson.category || "Uncategorized";
          const cur = categoryStats.get(cat) ?? { completed: 0, total: 0 };
          cur.completed += 1;
          categoryStats.set(cat, cur);
        }
      }
    });
    return Array.from(categoryStats.entries())
      .map(([cat, stats]) => ({
        skillCategory: cat,
        gapPercentage: Math.round(((stats.total - stats.completed) / stats.total) * 100),
        recommendation: `Complete ${stats.total - stats.completed} more lesson${stats.total - stats.completed !== 1 ? "s" : ""} to master this skill.`,
      }))
      .filter((g) => g.gapPercentage > 0)
      .sort((a, b) => b.gapPercentage - a.gapPercentage)
      .slice(0, 3);
  }, [lessons, attempts]);

  if (lessonsLoading || attemptsLoading) {
    return <div className="text-center py-4 text-muted-foreground text-sm">Loading skill gaps…</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-warning" />
              Skill Gaps
            </CardTitle>
            <CardDescription>Top areas for improvement</CardDescription>
          </div>
          <Link href="/skills-gap">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {topGaps.length > 0 ? (
          topGaps.map((gap, idx) => (
            <div key={idx} className="p-3 bg-muted rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium text-sm">{gap.skillCategory}</span>
                <Badge variant="outline" className="text-xs tabular-nums">
                  {gap.gapPercentage}% gap
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{gap.recommendation}</p>
              <Link href={`/lessons?skill=${gap.skillCategory}`}>
                <Button size="sm" variant="secondary" className="w-full touch-target">
                  Start Learning
                </Button>
              </Link>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No skill gaps identified. Keep up the great work!</p>
        )}
      </CardContent>
    </Card>
  );
}
