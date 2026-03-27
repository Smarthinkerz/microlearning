import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Zap, Users, BookOpen, Loader2, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AssignLessons() {
  const { user } = useAuth();
  const orgId = (user as any)?.orgId;

  const { data: lessons, isLoading: lessonsLoading } = trpc.lesson.getByOrg.useQuery(
    { orgId: orgId!, status: "published" },
    { enabled: !!orgId }
  );
  const { data: members, isLoading: membersLoading } = trpc.org.getMembers.useQuery(
    { orgId: orgId! },
    { enabled: !!orgId }
  );

  const [selectedLesson, setSelectedLesson] = useState<string>("");
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [priority, setPriority] = useState("normal");
  const [scheduleAware, setScheduleAware] = useState(true);
  const [dueDate, setDueDate] = useState("");

  const bulkAssign = trpc.assignment.bulkCreate.useMutation({
    onSuccess: (data: any) => {
      toast.success(`Assigned to ${data.count} learners`);
      setSelectedUsers([]);
      setSelectedLesson("");
    },
    onError: (err) => toast.error(err.message),
  });

  const toggleUser = (userId: number) => {
    setSelectedUsers(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const selectAll = () => {
    if (!members) return;
    const learners = members.filter((m: any) => m.appRole === "learner");
    if (selectedUsers.length === learners.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(learners.map((m: any) => m.id));
    }
  };

  const handleAssign = () => {
    if (!selectedLesson) { toast.error("Select a lesson"); return; }
    if (selectedUsers.length === 0) { toast.error("Select at least one learner"); return; }
    bulkAssign.mutate({
      lessonId: parseInt(selectedLesson),
      userIds: selectedUsers,
      orgId: orgId || 0,
      priority: priority as any,
      dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
      isScheduleAware: scheduleAware,
    });
  };

  const learners = (members || []).filter((m: any) => m.appRole === "learner");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Assign Lessons</h1>
        <p className="text-muted-foreground">Schedule lessons for your team with shift-aware delivery.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Lesson Selection */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4 text-primary" /> Select Lesson</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {lessonsLoading ? (
              <Skeleton className="h-10" />
            ) : (
              <Select value={selectedLesson} onValueChange={setSelectedLesson}>
                <SelectTrigger><SelectValue placeholder="Choose a published lesson" /></SelectTrigger>
                <SelectContent>
                  {(lessons || []).map((l: any) => (
                    <SelectItem key={l.id} value={l.id.toString()}>
                      {l.title} ({l.durationMinutes}min, {l.difficulty})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Priority</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Due Date (optional)</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={scheduleAware} onCheckedChange={setScheduleAware} id="schedule-aware" />
              <Label htmlFor="schedule-aware" className="text-sm">
                Schedule-aware delivery (avoids active shifts)
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Learner Selection */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Select Learners</CardTitle>
            <Button variant="ghost" size="sm" onClick={selectAll}>
              {selectedUsers.length === learners.length ? "Deselect All" : "Select All"}
            </Button>
          </CardHeader>
          <CardContent>
            {membersLoading ? (
              <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}</div>
            ) : learners.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">
                No learners in your organization.
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {learners.map((member: any) => (
                  <div
                    key={member.id}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                      selectedUsers.includes(member.id) ? "bg-primary/10 border border-primary/20" : "hover:bg-secondary/50"
                    }`}
                    onClick={() => toggleUser(member.id)}
                  >
                    <Checkbox checked={selectedUsers.includes(member.id)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{member.name || "Unnamed"}</p>
                      <p className="text-xs text-muted-foreground">{member.email || ""}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Assign Button */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedLesson ? "1 lesson" : "No lesson"} selected, {selectedUsers.length} learner(s) selected
              {scheduleAware && " (shift-aware)"}
            </div>
            <Button onClick={handleAssign} disabled={bulkAssign.isPending || !selectedLesson || selectedUsers.length === 0}>
              {bulkAssign.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Zap className="mr-2 h-4 w-4" />}
              Assign to {selectedUsers.length} Learner(s)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
