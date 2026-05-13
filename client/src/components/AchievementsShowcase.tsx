/**
 * Achievements Showcase Component
 * Displays user achievements, points, level, and leaderboard
 */

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";

interface AchievementsShowcaseProps {
  userId?: number;
  compact?: boolean;
}

export function AchievementsShowcase({
  userId,
  compact = false,
}: AchievementsShowcaseProps) {
  const [leaderboardScope, setLeaderboardScope] = useState<
    "personal" | "team" | "organization" | "global"
  >("personal");

  // Fetch user achievements and stats
  const { data: stats, isLoading: statsLoading } =
    trpc.gamification.getUserAchievements.useQuery();

  // Fetch leaderboard
  const { data: leaderboard, isLoading: leaderboardLoading } =
    trpc.gamification.getLeaderboard.useQuery({
      scope: leaderboardScope,
      limit: 10,
    });

  if (statsLoading) {
    return <AchievementsSkeleton />;
  }

  if (!stats) {
    return null;
  }

  const levelProgress = (stats.currentLevelPoints / stats.nextLevelThreshold) * 100;
  const rarityColors: Record<string, string> = {
    common: "bg-gray-500",
    uncommon: "bg-green-500",
    rare: "bg-blue-500",
    epic: "bg-purple-500",
    legendary: "bg-yellow-500",
  };

  return (
    <div className="space-y-6">
      {/* Points & Level Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Progress</span>
            <Badge variant="outline" className="text-lg px-3 py-1">
              ⭐ {stats.totalPoints} Points
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Level Display */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Level {stats.level}</span>
              <span className="text-xs text-muted-foreground">
                {stats.currentLevelPoints} / {stats.nextLevelThreshold}
              </span>
            </div>
            <Progress value={levelProgress} className="h-2" />
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.lessonsCompleted}</div>
              <div className="text-xs text-muted-foreground">Lessons Done</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.perfectScores}</div>
              <div className="text-xs text-muted-foreground">Perfect Scores</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.currentStreak}</div>
              <div className="text-xs text-muted-foreground">Day Streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{stats.averageScore}%</div>
              <div className="text-xs text-muted-foreground">Avg Score</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements & Leaderboard Tabs */}
      {!compact && (
        <Tabs defaultValue="achievements" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="achievements">
              Achievements ({stats.achievementsCount})
            </TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Your Achievements ({stats.achievementsCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {/* Achievement badges would be rendered here */}
                  <div className="text-center p-4 border rounded-lg hover:bg-accent transition-colors">
                    <div className="text-3xl mb-2">🎓</div>
                    <div className="text-xs font-medium">First Lesson</div>
                    <div className="text-xs text-muted-foreground">+10 pts</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg opacity-50">
                    <div className="text-3xl mb-2 grayscale">⭐</div>
                    <div className="text-xs font-medium">Perfect Score</div>
                    <div className="text-xs text-muted-foreground">+25 pts</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg opacity-50">
                    <div className="text-3xl mb-2 grayscale">🔥</div>
                    <div className="text-xs font-medium">7-Day Streak</div>
                    <div className="text-xs text-muted-foreground">+50 pts</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Leaderboard</CardTitle>
                <div className="flex gap-2 mt-4">
                  {(["personal", "team", "organization", "global"] as const).map((scope) => (
                    <button
                      key={scope}
                      onClick={() => setLeaderboardScope(scope)}
                      className={`px-3 py-1 rounded text-sm ${
                        leaderboardScope === scope
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary text-secondary-foreground"
                      }`}
                    >
                      {scope.charAt(0).toUpperCase() + scope.slice(1)}
                    </button>
                  ))}
                </div>
              </CardHeader>
              <CardContent>
                {leaderboardLoading ? (
                  <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {leaderboard?.map((entry: any, index: number) => (
                      <div
                        key={entry.userId}
                        className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent transition-colors"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="text-lg font-bold w-8 text-center">
                            {entry.rank}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{entry.userName}</div>
                            <div className="text-xs text-muted-foreground">
                              Level {entry.level}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">{entry.points}</div>
                          <div className="text-xs text-muted-foreground">
                            {entry.lessonsCompleted} lessons
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function AchievementsSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-2 w-full" />
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
