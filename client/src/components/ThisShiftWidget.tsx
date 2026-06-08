import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Zap, Clock, PlayCircle, Coffee, Sun, Moon, Sunset,
  WifiOff, ArrowRight, CheckCircle2, AlertCircle,
} from "lucide-react";
import { useMemo } from "react";

function getShiftLabel(shift: any): { label: string; icon: any; color: string } {
  const type = shift?.shiftType;
  if (type === "morning") return { label: "Morning Shift", icon: Sun, color: "text-warning" };
  if (type === "night") return { label: "Night Shift", icon: Moon, color: "text-info" };
  if (type === "afternoon") return { label: "Afternoon Shift", icon: Sunset, color: "text-primary" };
  return { label: "Your Shift", icon: Zap, color: "text-primary" };
}

function formatTime(ts: number): string {
  return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function isBreakNow(shift: any): boolean {
  if (!shift?.breakStartTime || !shift?.breakEndTime) return false;
  const now = Date.now();
  return now >= shift.breakStartTime && now <= shift.breakEndTime;
}

function isShiftActive(shift: any): boolean {
  if (!shift?.startTime || !shift?.endTime) return false;
  const now = Date.now();
  return now >= shift.startTime && now <= shift.endTime;
}

function minutesUntil(ts: number): number {
  return Math.max(0, Math.round((ts - Date.now()) / 60000));
}

export function ThisShiftWidget() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Get today's shifts
  const todayStart = useMemo(() => {
    const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime();
  }, []);
  const todayEnd = useMemo(() => {
    const d = new Date(); d.setHours(23, 59, 59, 999); return d.getTime();
  }, []);

  const { data: shifts, isLoading: shiftsLoading } = trpc.shift.getMyShifts.useQuery(
    { startRange: todayStart, endRange: todayEnd }
  );

  const { data: assignments, isLoading: assignmentsLoading } = trpc.assignment.getMyAssignments.useQuery();

  const isLoading = shiftsLoading || assignmentsLoading;

  // Find the most relevant shift (active or next upcoming today)
  const currentShift = useMemo(() => {
    if (!shifts?.length) return null;
    const now = Date.now();
    // Active shift first
    const active = shifts.find((s: any) => s.startTime <= now && s.endTime >= now);
    if (active) return active;
    // Next upcoming
    const upcoming = shifts
      .filter((s: any) => s.startTime > now)
      .sort((a: any, b: any) => a.startTime - b.startTime)[0];
    return upcoming || null;
  }, [shifts]);

  // Shift-aware assignments due during this shift
  const shiftAssignments = useMemo(() => {
    if (!assignments || !currentShift) return [];
    return (assignments as any[]).filter((a) => {
      if (a.status === "completed") return false;
      if (a.isScheduleAware) return true;
      if (a.dueDate && currentShift.endTime && a.dueDate <= currentShift.endTime) return true;
      return false;
    }).slice(0, 3);
  }, [assignments, currentShift]);

  // Overdue count
  const overdueCount = useMemo(() => {
    if (!assignments) return 0;
    const now = Date.now();
    return (assignments as any[]).filter(
      (a) => a.dueDate && a.dueDate < now && a.status !== "completed"
    ).length;
  }, [assignments]);

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!currentShift) {
    // No shift today — show pending assignments summary
    const pending = (assignments as any[] || []).filter((a) => a.status !== "completed");
    if (!pending.length) return null;

    return (
      <Card className="border-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpenIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">No shift scheduled today</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            You have <span className="font-semibold text-foreground tabular-nums">{pending.length}</span> pending assignment{pending.length !== 1 ? "s" : ""}.
          </p>
          <Button
            size="sm"
            variant="outline"
            className="w-full min-h-[44px]"
            onClick={() => setLocation("/assignments")}
          >
            View Assignments <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const active = isShiftActive(currentShift);
  const onBreak = isBreakNow(currentShift);
  const shiftInfo = getShiftLabel(currentShift);
  const ShiftIcon = shiftInfo.icon;

  return (
    <Card className={`border-primary/20 ${active ? "bg-primary/5" : "bg-muted/30"}`}>
      <CardContent className="p-4 space-y-3">
        {/* Shift header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShiftIcon className={`h-4 w-4 ${shiftInfo.color}`} />
            <span className="text-sm font-semibold text-foreground">{shiftInfo.label}</span>
            {active && (
              <Badge variant="outline" className="text-[10px] text-success border-success/30 bg-success/10">
                Active
              </Badge>
            )}
            {!active && (
              <Badge variant="outline" className="text-[10px] text-muted-foreground">
                Upcoming in {minutesUntil(currentShift.startTime)}m
              </Badge>
            )}
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {formatTime(currentShift.startTime)} – {formatTime(currentShift.endTime)}
          </span>
        </div>

        {/* Break indicator */}
        {onBreak && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-success/10 border border-success/20">
            <Coffee className="h-4 w-4 text-success" />
            <span className="text-xs text-success font-medium">
              Break time — great moment for a quick lesson!
            </span>
          </div>
        )}

        {/* Overdue warning */}
        {overdueCount > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <span className="text-xs text-destructive font-medium">
              {overdueCount} overdue assignment{overdueCount !== 1 ? "s" : ""} — complete before shift ends
            </span>
          </div>
        )}

        {/* Shift-aware assignments */}
        {shiftAssignments.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Due this shift
            </p>
            {shiftAssignments.map((a: any) => (
              <button
                key={a.id}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-background border border-border hover:bg-accent/50 transition-colors min-h-[44px] text-left"
                onClick={() => setLocation(`/lessons/${a.lessonId}`)}
                aria-label={`Start lesson ${a.lessonId}`}
              >
                <div className="flex items-center gap-2">
                  {a.status === "in_progress"
                    ? <PlayCircle className="h-4 w-4 text-info shrink-0" />
                    : <Clock className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                  <div>
                    <p className="text-xs font-medium text-foreground">Lesson #{a.lessonId}</p>
                    {a.isScheduleAware && (
                      <p className="text-[10px] text-primary">Shift-aware delivery</p>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              </button>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-success/10 border border-success/20">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span className="text-xs text-success font-medium">
              All assignments for this shift are complete!
            </span>
          </div>
        )}

        {/* Offline note */}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <WifiOff className="h-3 w-3" />
          Lessons are cached for offline use during your shift
        </div>
      </CardContent>
    </Card>
  );
}

// Inline icon to avoid import collision
function BookOpenIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );
}
