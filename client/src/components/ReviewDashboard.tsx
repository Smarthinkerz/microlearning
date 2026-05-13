/**
 * Review Dashboard Component
 * Shows spaced repetition progress, mastery status, and next review dates
 */

import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface ReviewDashboardProps {
  onSelectLesson?: (lessonId: number) => void;
}

export function ReviewDashboard({ onSelectLesson }: ReviewDashboardProps) {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Fetch review schedules
  const { data: reviewSchedules, isLoading } = trpc.spacedRepetition.getLessonsDueForReview.useQuery({ limit: 1000 });

  // Calculate statistics
  const stats = useMemo(() => {
    if (!reviewSchedules) return null;

    const total = reviewSchedules.length;
    const byStatus = {
      new: reviewSchedules.filter((r: any) => r.status === "new").length,
      learning: reviewSchedules.filter((r: any) => r.status === "learning").length,
      review: reviewSchedules.filter((r: any) => r.status === "review").length,
      mastered: reviewSchedules.filter((r: any) => r.status === "mastered").length,
    };

    const masteryPercentage = total > 0 ? ((byStatus.mastered / total) * 100).toFixed(1) : "0";
    const avgEaseFactor =
      total > 0
        ? (
            reviewSchedules.reduce((sum: number, r: any) => sum + (r.easeFactor || 2.5), 0) / total
          ).toFixed(2)
        : "2.5";

    const dueSoon = reviewSchedules.filter((r: any) => {
      const daysUntilDue = (r.nextReviewDate - Date.now()) / (24 * 60 * 60 * 1000);
      return daysUntilDue <= 1 && daysUntilDue > 0;
    }).length;

    const overdue = reviewSchedules.filter((r: any) => r.nextReviewDate < Date.now()).length;

    return {
      total,
      byStatus,
      masteryPercentage,
      avgEaseFactor,
      dueSoon,
      overdue,
    };
  }, [reviewSchedules]);

  // Filter lessons based on status
  const filteredLessons = useMemo(() => {
    if (!reviewSchedules) return [];
    if (statusFilter === "all") return reviewSchedules;
    return reviewSchedules.filter((r: any) => r.status === statusFilter);
  }, [reviewSchedules, statusFilter]);

  if (isLoading) {
    return <div className="text-center py-8">Loading review data...</div>;
  }

  if (!stats) {
    return <div className="text-center py-8">No review data available</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">Review Dashboard</h2>
        <p className="text-gray-600">Track your spaced repetition progress and mastery</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Lessons"
          value={stats.total}
          color="bg-blue-50 border-blue-200"
          icon="📚"
        />
        <StatCard
          title="Mastery Rate"
          value={`${stats.masteryPercentage}%`}
          color="bg-green-50 border-green-200"
          icon="🎯"
        />
        <StatCard
          title="Due Soon"
          value={stats.dueSoon}
          color="bg-yellow-50 border-yellow-200"
          icon="⏰"
        />
        <StatCard
          title="Overdue"
          value={stats.overdue}
          color="bg-red-50 border-red-200"
          icon="⚠️"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mastery Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Mastery Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: "New", value: stats.byStatus.new, fill: "#94a3b8" },
                    { name: "Learning", value: stats.byStatus.learning, fill: "#f59e0b" },
                    { name: "Review", value: stats.byStatus.review, fill: "#3b82f6" },
                    { name: "Mastered", value: stats.byStatus.mastered, fill: "#10b981" },
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#94a3b8" />
                  <Cell fill="#f59e0b" />
                  <Cell fill="#3b82f6" />
                  <Cell fill="#10b981" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Statistics Card */}
        <Card>
          <CardHeader>
            <CardTitle>Statistics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">Average Ease Factor</span>
              <span className="text-lg font-semibold">{stats.avgEaseFactor}</span>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">New Lessons</span>
              <Badge variant="secondary">{stats.byStatus.new}</Badge>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">Learning</span>
              <Badge variant="outline">{stats.byStatus.learning}</Badge>
            </div>
            <div className="flex justify-between items-center pb-3 border-b">
              <span className="text-gray-600">Review Due</span>
              <Badge>{stats.byStatus.review}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Mastered</span>
              <Badge variant="default" className="bg-green-600">
                {stats.byStatus.mastered}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={statusFilter === "all" ? "default" : "outline"}
          onClick={() => setStatusFilter("all")}
          size="sm"
        >
          All ({stats.total})
        </Button>
        <Button
          variant={statusFilter === "new" ? "default" : "outline"}
          onClick={() => setStatusFilter("new")}
          size="sm"
        >
          New ({stats.byStatus.new})
        </Button>
        <Button
          variant={statusFilter === "learning" ? "default" : "outline"}
          onClick={() => setStatusFilter("learning")}
          size="sm"
        >
          Learning ({stats.byStatus.learning})
        </Button>
        <Button
          variant={statusFilter === "review" ? "default" : "outline"}
          onClick={() => setStatusFilter("review")}
          size="sm"
        >
          Review ({stats.byStatus.review})
        </Button>
        <Button
          variant={statusFilter === "mastered" ? "default" : "outline"}
          onClick={() => setStatusFilter("mastered")}
          size="sm"
        >
          Mastered ({stats.byStatus.mastered})
        </Button>
      </div>

      {/* Lessons List */}
      <Card>
        <CardHeader>
          <CardTitle>Lessons ({filteredLessons.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredLessons.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No lessons in this category
            </div>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredLessons.map((lesson: any) => (
                <LessonReviewCard
                  key={lesson.id}
                  lesson={lesson}
                  onSelect={() => onSelectLesson?.(lesson.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  color: string;
  icon: string;
}

function StatCard({ title, value, color, icon }: StatCardProps) {
  return (
    <Card className={`border ${color}`}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
          <span className="text-3xl">{icon}</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface LessonReviewCardProps {
  lesson: any;
  onSelect: () => void;
}

function LessonReviewCard({ lesson, onSelect }: LessonReviewCardProps) {
  const daysUntilDue = (lesson.nextReviewDate - Date.now()) / (24 * 60 * 60 * 1000);
  const isOverdue = daysUntilDue < 0;
  const isDueSoon = daysUntilDue <= 1 && daysUntilDue > 0;

  const statusColor = {
    new: "bg-gray-100 text-gray-800",
    learning: "bg-yellow-100 text-yellow-800",
    review: "bg-blue-100 text-blue-800",
    mastered: "bg-green-100 text-green-800",
  };

  const dueStatus = isOverdue ? "Overdue" : isDueSoon ? "Due Soon" : `Due in ${Math.ceil(daysUntilDue)}d`;

  return (
    <div className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <h4 className="font-medium">{lesson.title}</h4>
          <Badge className={statusColor[lesson.status as keyof typeof statusColor]}>
            {lesson.status}
          </Badge>
        </div>
        <div className="flex items-center gap-4 text-xs text-gray-600">
          <span>Ease: {lesson.easeFactor.toFixed(2)}</span>
          <span>Reps: {lesson.repetitions}</span>
          <span className={isOverdue ? "text-red-600 font-medium" : isDueSoon ? "text-yellow-600 font-medium" : ""}>
            {dueStatus}
          </span>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onSelect}>
        Review →
      </Button>
    </div>
  );
}
