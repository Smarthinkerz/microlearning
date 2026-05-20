import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

export function SkillsGapWidget() {
  const { data: skillGaps, isLoading } = trpc.skillsGap.getTopSkillGaps.useQuery({ limit: 3 });

  if (isLoading) {
    return <div className="text-center py-4">Loading skill gaps...</div>;
  }

  const topGaps = skillGaps?.slice(0, 3) || [];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-600" />
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
                <Badge variant="outline" className="text-xs">
                  {gap.gapPercentage}% gap
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">{gap.recommendation}</p>
              <Link href={`/lessons?skill=${gap.skillCategory}`}>
                <Button size="sm" variant="secondary" className="w-full">
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
