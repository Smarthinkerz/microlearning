import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  BookOpen,
  Clock,
  Award,
  TrendingUp,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Zap,
  Target,
  BarChart3,
  Library,
  Wand2,
  Database,
} from "lucide-react";
import { useLocation } from "wouter";

export default function Dashboard() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const appRole = (user as any)?.appRole || "learner";
  const orgId = (user as any)?.orgId;

  const { data: myStats, isLoading: statsLoading } = trpc.user.getMyStats.useQuery();
  const { data: orgStats, isLoading: orgStatsLoading } = trpc.org.getStats.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId && ["employer_admin", "super_admin"].includes(appRole) }
  );
  const { data: assignments, isLoading: assignmentsLoading } = trpc.assignment.getMyAssignments.useQuery(
    { status: "pending" },
    { enabled: appRole === "learner" }
  );

  const isAdmin = ["employer_admin", "super_admin"].includes(appRole);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.name?.split(" ")[0] || "there"}
        </h1>
        <p className="text-muted-foreground">
          {isAdmin
            ? "Here's an overview of your organization's learning activity."
            : "Here's your learning progress and upcoming lessons."}
        </p>
      </div>

      {/* Learner Stats */}
      {!isAdmin && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={BookOpen}
              label="Completed"
              value={myStats?.completedAssignments ?? 0}
              subtitle={`of ${myStats?.totalAssignments ?? 0} assigned`}
              loading={statsLoading}
            />
            <StatCard
              icon={Clock}
              label="Time Spent"
              value={formatTime(myStats?.totalTimeSpent ?? 0)}
              subtitle="total learning"
              loading={statsLoading}
            />
            <StatCard
              icon={Target}
              label="Avg Score"
              value={`${myStats?.averageScore ?? 0}%`}
              subtitle="across all lessons"
              loading={statsLoading}
            />
            <StatCard
              icon={Award}
              label="Certificates"
              value={myStats?.totalCertificates ?? 0}
              subtitle="earned"
              loading={statsLoading}
            />
          </div>

          {/* Progress */}
          {myStats && myStats.totalAssignments > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-foreground">Overall Progress</span>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(((myStats.completedAssignments ?? 0) / myStats.totalAssignments) * 100)}%
                  </span>
                </div>
                <Progress
                  value={((myStats.completedAssignments ?? 0) / myStats.totalAssignments) * 100}
                  className="h-2"
                />
              </CardContent>
            </Card>
          )}

          {/* Pending Assignments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base font-semibold">Upcoming Lessons</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => setLocation("/assignments")}>
                View All <ArrowRight className="ml-1 h-3.5 w-3.5" />
              </Button>
            </CardHeader>
            <CardContent>
              {assignmentsLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : assignments && assignments.length > 0 ? (
                <div className="space-y-3">
                  {assignments.slice(0, 5).map((a: any) => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors cursor-pointer"
                      onClick={() => setLocation(`/assignments`)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">Lesson #{a.lessonId}</p>
                          <p className="text-xs text-muted-foreground">
                            {a.priority && (
                              <Badge variant="outline" className="text-[10px] mr-1">
                                {a.priority}
                              </Badge>
                            )}
                            {a.dueDate ? `Due ${new Date(a.dueDate).toLocaleDateString()}` : "No due date"}
                          </p>
                        </div>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-primary/50" />
                  <p className="text-sm">All caught up! No pending lessons.</p>
                  <Button variant="link" size="sm" className="mt-2" onClick={() => setLocation("/library")}>
                    Browse the Lesson Library <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}

      {/* Admin Stats */}
      {isAdmin && orgId && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={BookOpen}
              label="Published Lessons"
              value={orgStats?.totalLessons ?? 0}
              subtitle="active content"
              loading={orgStatsLoading}
            />
            <StatCard
              icon={TrendingUp}
              label="Completion Rate"
              value={`${orgStats?.completionRate ?? 0}%`}
              subtitle="across all learners"
              loading={orgStatsLoading}
            />
            <StatCard
              icon={Calendar}
              label="Active Shifts"
              value={orgStats?.totalShifts ?? 0}
              subtitle="scheduled"
              loading={orgStatsLoading}
            />
            <StatCard
              icon={BarChart3}
              label="Total Learners"
              value={orgStats?.totalUsers ?? 0}
              subtitle="in organization"
              loading={orgStatsLoading}
            />
          </div>

          {/* Quick Actions */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <QuickAction
              icon={Zap}
              title="Assign Lessons"
              description="Schedule new lessons for your team"
              onClick={() => setLocation("/assign")}
            />
            <QuickAction
              icon={BookOpen}
              title="Create Content"
              description="Build a new micro-lesson"
              onClick={() => setLocation("/authoring/new")}
            />
            <QuickAction
              icon={BarChart3}
              title="View Analytics"
              description="See detailed learning reports"
              onClick={() => setLocation("/analytics")}
            />
            <QuickAction
              icon={Library}
              title="Lesson Library"
              description="Browse all published lessons"
              onClick={() => setLocation("/library")}
            />
            <QuickAction
              icon={Wand2}
              title="AI Generate"
              description="Create lessons with AI"
              onClick={() => setLocation("/library")}
            />
          </div>
        </>
      )}

      {/* No Org Warning */}
      {!orgId && isAdmin && (
        <Card className="border-primary/30">
          <CardContent className="pt-6 text-center">
            <p className="text-muted-foreground mb-4">
              You haven't been assigned to an organization yet. Contact your administrator.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtitle,
  loading,
}: {
  icon: any;
  label: string;
  value: string | number;
  subtitle: string;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-2">
              <Icon className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {label}
              </span>
            </div>
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function QuickAction({
  icon: Icon,
  title,
  description,
  onClick,
}: {
  icon: any;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <Card
      className="cursor-pointer hover:border-primary/30 transition-all duration-200"
      onClick={onClick}
    >
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Icon className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function formatTime(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
  return `${Math.round(seconds / 3600)}h`;
}
