import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Download, TrendingUp, BookOpen, Target } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface SkillGap {
  category: string;
  completed: number;
  total: number;
  percentage: number;
  priority: "high" | "medium" | "low";
}

export function SkillsGapDashboard() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const { data: lessons, isLoading: lessonsLoading } = trpc.library.browse.useQuery({});
  const { data: attempts, isLoading: attemptsLoading } = trpc.attempt.getByUser.useQuery();

  const skillGaps = useMemo(() => {
    if (!lessons || !attempts) return [];

    const categoryStats = new Map<string, { completed: number; total: number }>();

    // Count total lessons by category
    lessons.forEach((lesson) => {
      const category = lesson.category || "Uncategorized";
      const current = categoryStats.get(category) || { completed: 0, total: 0 };
      current.total += 1;
      categoryStats.set(category, current);
    });

    // Count completed lessons by category
    (attempts as Array<{ status: string; lessonId: number }> | undefined)?.forEach((attempt) => {
      if (attempt.status === "completed") {
        const lesson = lessons.find((l) => l.id === attempt.lessonId);
        if (lesson) {
          const category = lesson.category || "Uncategorized";
          const current = categoryStats.get(category) || { completed: 0, total: 0 };
          current.completed += 1;
          categoryStats.set(category, current);
        }
      }
    });

    // Convert to array and calculate priority
    return Array.from(categoryStats.entries())
      .map(([category, stats]) => ({
        category,
        completed: stats.completed,
        total: stats.total,
        percentage: Math.round((stats.completed / stats.total) * 100),
        priority: stats.completed === 0 ? ("high" as const) : stats.completed < stats.total / 2 ? ("medium" as const) : ("low" as const),
      }))
      .sort((a, b) => a.percentage - b.percentage);
  }, [lessons, attempts]);

  const overallProgress = useMemo(() => {
    if (!skillGaps.length) return 0;
    const total = skillGaps.reduce((sum, gap) => sum + gap.total, 0);
    const completed = skillGaps.reduce((sum, gap) => sum + gap.completed, 0);
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [skillGaps]);

  const pieData = useMemo(() => {
    return [
      { name: "Completed", value: skillGaps.reduce((sum, gap) => sum + gap.completed, 0) },
      { name: "Remaining", value: skillGaps.reduce((sum, gap) => sum + (gap.total - gap.completed), 0) },
    ];
  }, [skillGaps]);

  const COLORS = ["#10b981", "#ef4444"];

  if (lessonsLoading || attemptsLoading) {
    return <div className="text-center py-8">Loading skills analysis...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Skills Mastery Progress
          </CardTitle>
          <CardDescription>Your overall learning progress across all skill categories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-4xl font-bold text-green-600">{overallProgress}%</div>
            <div className="text-sm text-muted-foreground">
              {skillGaps.reduce((sum, gap) => sum + gap.completed, 0)} of {skillGaps.reduce((sum, gap) => sum + gap.total, 0)} lessons completed
            </div>
          </div>
          <div className="w-full bg-muted rounded-full h-3">
            <div
              className="bg-green-600 h-3 rounded-full transition-all duration-300"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Tabs for different views */}
      <Tabs defaultValue="gaps" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="gaps">Skill Gaps</TabsTrigger>
          <TabsTrigger value="progress">Progress Chart</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        {/* Skill Gaps View */}
        <TabsContent value="gaps" className="space-y-4">
          {skillGaps.map((gap) => (
            <Card key={gap.category} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedCategory(gap.category)}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    <div>
                      <p className="font-semibold">{gap.category}</p>
                      <p className="text-sm text-muted-foreground">
                        {gap.completed} of {gap.total} lessons
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={gap.priority === "high" ? "destructive" : gap.priority === "medium" ? "secondary" : "default"}>
                      {gap.priority}
                    </Badge>
                    <span className="font-bold text-lg">{gap.percentage}%</span>
                  </div>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      gap.priority === "high" ? "bg-red-500" : gap.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                    }`}
                    style={{ width: `${gap.percentage}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Progress Chart View */}
        <TabsContent value="progress">
          <Card>
            <CardHeader>
              <CardTitle>Learning Progress by Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Pie Chart */}
              <div className="flex justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Bar Chart */}
              <div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={skillGaps}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="completed" stackId="a" fill="#10b981" name="Completed" />
                    <Bar dataKey="total" stackId="a" fill="#e5e7eb" name="Total" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Recommendations View */}
        <TabsContent value="recommendations">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Personalized Learning Recommendations
              </CardTitle>
              <CardDescription>Based on your skill gaps and learning patterns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {skillGaps
                .filter((gap) => gap.priority === "high" || gap.priority === "medium")
                .map((gap) => (
                  <div key={gap.category} className="p-4 border rounded-lg space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">{gap.category}</h4>
                      <Badge variant={gap.priority === "high" ? "destructive" : "secondary"}>{gap.priority} Priority</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      You've completed {gap.completed} of {gap.total} lessons in this category. Focus on the remaining {gap.total - gap.completed} lessons to master this skill.
                    </p>
                    <Button size="sm" variant="outline" className="mt-2">
                      Start Learning
                    </Button>
                  </div>
                ))}

              {skillGaps.every((gap) => gap.priority === "low") && (
                <div className="p-4 border border-green-200 bg-green-50 rounded-lg">
                  <p className="text-green-800">🎉 Great job! You're making excellent progress across all skill categories.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Export Button */}
      <div className="flex justify-end">
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>
    </div>
  );
}
