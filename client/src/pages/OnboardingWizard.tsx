import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  User, Clock, Briefcase, BookOpen, ChevronRight, ChevronLeft,
  Check, Sparkles, Sun, Moon, Sunset, ArrowRight, GraduationCap,
} from "lucide-react";

// ─── Timezone helper ────────────────────────────────────────────────
const TIMEZONES = [
  "UTC", "America/New_York", "America/Chicago", "America/Denver",
  "America/Los_Angeles", "America/Toronto", "Europe/London", "Europe/Paris",
  "Europe/Berlin", "Asia/Dubai", "Asia/Kolkata", "Asia/Shanghai",
  "Asia/Tokyo", "Asia/Singapore", "Australia/Sydney", "Pacific/Auckland",
];

const DAYS = [
  { label: "Mon", value: "monday" as const },
  { label: "Tue", value: "tuesday" as const },
  { label: "Wed", value: "wednesday" as const },
  { label: "Thu", value: "thursday" as const },
  { label: "Fri", value: "friday" as const },
  { label: "Sat", value: "saturday" as const },
  { label: "Sun", value: "sunday" as const },
];

const SHIFT_PRESETS = [
  { type: "morning" as const, label: "Morning", icon: Sun, start: "06:00", end: "14:00", color: "text-amber-400" },
  { type: "afternoon" as const, label: "Afternoon", icon: Sunset, start: "14:00", end: "22:00", color: "text-orange-400" },
  { type: "night" as const, label: "Night", icon: Moon, start: "22:00", end: "06:00", color: "text-indigo-400" },
  { type: "custom" as const, label: "Custom", icon: Clock, start: "09:00", end: "17:00", color: "text-emerald-400" },
];

const INDUSTRIES = [
  { name: "Healthcare & Nursing", emoji: "🏥" },
  { name: "Retail & Hospitality", emoji: "🛒" },
  { name: "Manufacturing & Warehousing", emoji: "🏭" },
  { name: "Construction & Trades", emoji: "🔨" },
  { name: "Transportation & Logistics", emoji: "🚛" },
  { name: "Food Service & Restaurant", emoji: "🍳" },
  { name: "Security & Law Enforcement", emoji: "🛡️" },
  { name: "Cleaning & Facilities", emoji: "🧹" },
  { name: "Energy & Utilities", emoji: "⚡" },
  { name: "Education & Childcare", emoji: "📚" },
  { name: "General Workplace Skills", emoji: "💼" },
];

export default function OnboardingWizard() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const [step, setStep] = useState(1);

  // Step 1 state
  const [name, setName] = useState(user?.name || "");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [appRole, setAppRole] = useState<"learner" | "employer_admin">("learner");

  // Step 2 state
  const [shiftType, setShiftType] = useState<"morning" | "afternoon" | "night" | "split" | "custom">("morning");
  const [startTime, setStartTime] = useState("06:00");
  const [endTime, setEndTime] = useState("14:00");
  const [workDays, setWorkDays] = useState<string[]>(["monday", "tuesday", "wednesday", "thursday", "friday"]);
  const [breakMinutes, setBreakMinutes] = useState(30);

  // Step 3 state
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([]);

  // Step 4 state
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [recommendedLessons, setRecommendedLessons] = useState<any[]>([]);

  // Mutations
  const saveProfile = trpc.onboarding.saveProfile.useMutation();
  const saveShift = trpc.onboarding.saveShiftSchedule.useMutation();
  const saveInterests = trpc.onboarding.saveInterests.useMutation();
  const completeOnboarding = trpc.onboarding.completeOnboarding.useMutation();

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const handleShiftPreset = (preset: typeof SHIFT_PRESETS[0]) => {
    setShiftType(preset.type);
    setStartTime(preset.start);
    setEndTime(preset.end);
  };

  const toggleDay = (day: string) => {
    setWorkDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const toggleIndustry = (industry: string) => {
    setSelectedIndustries((prev) => {
      if (prev.includes(industry)) return prev.filter((i) => i !== industry);
      if (prev.length >= 3) {
        toast.error("Maximum 3 industries");
        return prev;
      }
      return [...prev, industry];
    });
  };

  const handleStep1Next = async () => {
    if (!name.trim()) { toast.error("Please enter your name"); return; }
    try {
      await saveProfile.mutateAsync({ name: name.trim(), timezone, appRole });
      setStep(2);
    } catch (e: any) {
      toast.error(e.message || "Failed to save profile");
    }
  };

  const handleStep2Next = async () => {
    if (workDays.length === 0) { toast.error("Select at least one work day"); return; }
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    try {
      await saveShift.mutateAsync({
        shiftType,
        startHour: sh,
        startMinute: sm,
        endHour: eh,
        endMinute: em,
        workDays: workDays as any,
        breakDurationMinutes: breakMinutes,
      });
      setStep(3);
    } catch (e: any) {
      toast.error(e.message || "Failed to save schedule");
    }
  };

  const handleStep3Next = async () => {
    if (selectedIndustries.length === 0) { toast.error("Select at least one industry"); return; }
    try {
      const result = await saveInterests.mutateAsync({ industries: selectedIndustries });
      setRecommendedLessons(result.recommendedLessons);
      if (result.recommendedLessons.length > 0) {
        setSelectedLessonId(result.recommendedLessons[0].id);
      }
      setStep(4);
    } catch (e: any) {
      toast.error(e.message || "Failed to save interests");
    }
  };

  const handleComplete = async () => {
    try {
      await completeOnboarding.mutateAsync({
        selectedLessonId: selectedLessonId || undefined,
      });
      toast.success("Welcome aboard! Let's start learning.");
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e.message || "Failed to complete onboarding");
    }
  };

  const difficultyColor = (d: string) => {
    if (d === "beginner") return "bg-emerald-500/20 text-emerald-400";
    if (d === "intermediate") return "bg-amber-500/20 text-amber-400";
    return "bg-red-500/20 text-red-400";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>

      <div className="w-full max-w-2xl relative z-10">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">Step {step} of {totalSteps}</span>
            <span className="text-sm text-emerald-400 font-medium">{Math.round(progress)}% complete</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between mt-3">
            {[
              { icon: User, label: "Profile" },
              { icon: Clock, label: "Schedule" },
              { icon: Briefcase, label: "Interests" },
              { icon: BookOpen, label: "First Lesson" },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center gap-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                  i + 1 < step ? "bg-emerald-500 text-white" :
                  i + 1 === step ? "bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500" :
                  "bg-slate-800 text-slate-500"
                }`}>
                  {i + 1 < step ? <Check className="w-4 h-4" /> : <s.icon className="w-4 h-4" />}
                </div>
                <span className={`text-xs ${i + 1 <= step ? "text-slate-300" : "text-slate-600"}`}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Step 1: Profile */}
        {step === 1 && (
          <Card className="bg-slate-900/80 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Welcome to LearnShift</CardTitle>
              <CardDescription className="text-slate-400 text-base">
                Let's set up your profile in under 2 minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              <div className="space-y-2">
                <Label className="text-slate-300">Your Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 h-12"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Your Role</Label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: "learner" as const, label: "Shift Worker", desc: "I'm here to learn", icon: GraduationCap },
                    { value: "employer_admin" as const, label: "Manager", desc: "I manage a team", icon: Briefcase },
                  ].map((role) => (
                    <button
                      key={role.value}
                      onClick={() => setAppRole(role.value)}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        appRole === role.value
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                      }`}
                    >
                      <role.icon className={`w-6 h-6 mb-2 ${appRole === role.value ? "text-emerald-400" : "text-slate-400"}`} />
                      <div className={`font-medium ${appRole === role.value ? "text-white" : "text-slate-300"}`}>{role.label}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{role.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Timezone</Label>
                <Select value={timezone} onValueChange={setTimezone}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz} value={tz} className="text-slate-200">{tz.replace(/_/g, " ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleStep1Next}
                disabled={saveProfile.isPending}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-white font-medium"
              >
                {saveProfile.isPending ? "Saving..." : "Continue"}
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Shift Schedule */}
        {step === 2 && (
          <Card className="bg-slate-900/80 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center mb-4">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Your Shift Schedule</CardTitle>
              <CardDescription className="text-slate-400 text-base">
                We'll deliver lessons that fit around your shifts
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              {/* Shift type presets */}
              <div className="space-y-2">
                <Label className="text-slate-300">Shift Type</Label>
                <div className="grid grid-cols-4 gap-2">
                  {SHIFT_PRESETS.map((preset) => (
                    <button
                      key={preset.type}
                      onClick={() => handleShiftPreset(preset)}
                      className={`p-3 rounded-xl border-2 text-center transition-all ${
                        shiftType === preset.type
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                      }`}
                    >
                      <preset.icon className={`w-5 h-5 mx-auto mb-1 ${preset.color}`} />
                      <div className="text-xs text-slate-300 font-medium">{preset.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time inputs */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Start Time</Label>
                  <Input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white h-12"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">End Time</Label>
                  <Input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="bg-slate-800/50 border-slate-700 text-white h-12"
                  />
                </div>
              </div>

              {/* Work days */}
              <div className="space-y-2">
                <Label className="text-slate-300">Work Days</Label>
                <div className="flex gap-2">
                  {DAYS.map((day) => (
                    <button
                      key={day.value}
                      onClick={() => toggleDay(day.value)}
                      className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                        workDays.includes(day.value)
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                      }`}
                    >
                      {day.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Break duration */}
              <div className="space-y-2">
                <Label className="text-slate-300">Break Duration</Label>
                <Select value={String(breakMinutes)} onValueChange={(v) => setBreakMinutes(Number(v))}>
                  <SelectTrigger className="bg-slate-800/50 border-slate-700 text-white h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    <SelectItem value="0" className="text-slate-200">No break</SelectItem>
                    <SelectItem value="15" className="text-slate-200">15 minutes</SelectItem>
                    <SelectItem value="30" className="text-slate-200">30 minutes</SelectItem>
                    <SelectItem value="45" className="text-slate-200">45 minutes</SelectItem>
                    <SelectItem value="60" className="text-slate-200">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12 border-slate-700 text-slate-300 hover:bg-slate-800">
                  <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={handleStep2Next}
                  disabled={saveShift.isPending}
                  className="flex-[2] h-12 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-white font-medium"
                >
                  {saveShift.isPending ? "Saving..." : "Continue"}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Industry Interests */}
        {step === 3 && (
          <Card className="bg-slate-900/80 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center mb-4">
                <Briefcase className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Your Industry</CardTitle>
              <CardDescription className="text-slate-400 text-base">
                Select up to 3 industries to personalize your lessons
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-4">
              <div className="grid grid-cols-2 gap-3">
                {INDUSTRIES.map((ind) => (
                  <button
                    key={ind.name}
                    onClick={() => toggleIndustry(ind.name)}
                    className={`p-3.5 rounded-xl border-2 text-left transition-all ${
                      selectedIndustries.includes(ind.name)
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{ind.emoji}</span>
                      <span className={`text-sm font-medium ${
                        selectedIndustries.includes(ind.name) ? "text-white" : "text-slate-300"
                      }`}>
                        {ind.name.split(" & ")[0]}
                      </span>
                      {selectedIndustries.includes(ind.name) && (
                        <Check className="w-4 h-4 text-emerald-400 ml-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>

              {selectedIndustries.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {selectedIndustries.map((ind) => (
                    <Badge key={ind} variant="secondary" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                      {ind.split(" & ")[0]}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setStep(2)} className="flex-1 h-12 border-slate-700 text-slate-300 hover:bg-slate-800">
                  <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={handleStep3Next}
                  disabled={saveInterests.isPending || selectedIndustries.length === 0}
                  className="flex-[2] h-12 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-white font-medium"
                >
                  {saveInterests.isPending ? "Finding lessons..." : "Continue"}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 4: First Lesson */}
        {step === 4 && (
          <Card className="bg-slate-900/80 border-slate-700/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Your First Lesson</CardTitle>
              <CardDescription className="text-slate-400 text-base">
                {recommendedLessons.length > 0
                  ? "Pick a lesson to start with — we'll assign it to your schedule"
                  : "You're all set! Head to the dashboard to explore lessons."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              {recommendedLessons.length > 0 ? (
                <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                  {recommendedLessons.map((lesson: any) => (
                    <button
                      key={lesson.id}
                      onClick={() => setSelectedLessonId(lesson.id)}
                      className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                        selectedLessonId === lesson.id
                          ? "border-emerald-500 bg-emerald-500/10"
                          : "border-slate-700 bg-slate-800/30 hover:border-slate-600"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-white text-sm">{lesson.title}</div>
                          <div className="text-xs text-slate-400 mt-1 line-clamp-2">{lesson.description}</div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline" className={`text-[10px] ${difficultyColor(lesson.difficulty)}`}>
                              {lesson.difficulty}
                            </Badge>
                            <span className="text-[10px] text-slate-500">{lesson.durationMinutes} min</span>
                            <span className="text-[10px] text-slate-500">{lesson.category}</span>
                          </div>
                        </div>
                        {selectedLessonId === lesson.id && (
                          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 mt-1">
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <GraduationCap className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
                  <p className="text-slate-300">No specific recommendations yet.</p>
                  <p className="text-sm text-slate-500 mt-1">Explore the full lesson library from your dashboard.</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setStep(3)} className="flex-1 h-12 border-slate-700 text-slate-300 hover:bg-slate-800">
                  <ChevronLeft className="w-4 h-4 mr-2" /> Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={completeOnboarding.isPending}
                  className="flex-[2] h-12 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-600 hover:to-teal-500 text-white font-medium"
                >
                  {completeOnboarding.isPending ? "Setting up..." : (
                    <>
                      {selectedLessonId ? "Start Learning" : "Go to Dashboard"}
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
