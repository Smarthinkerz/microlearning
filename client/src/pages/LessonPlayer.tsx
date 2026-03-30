import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Clock, BookOpen, Play, XCircle,
  Volume2, VolumeX, ChevronLeft, ChevronRight, Trophy, RotateCcw,
  Zap, Target, Star, Sparkles,
} from "lucide-react";
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { VoicePlayer } from "@/components/VoicePlayer";

// ─── Swipe Hook ─────────────────────────────────────────────────────
function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void, threshold = 50) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchEnd.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;
    const distX = touchStart.current.x - touchEnd.current.x;
    const distY = Math.abs(touchStart.current.y - touchEnd.current.y);
    // Only trigger if horizontal swipe is dominant
    if (Math.abs(distX) > threshold && Math.abs(distX) > distY) {
      if (distX > 0) onSwipeLeft();
      else onSwipeRight();
    }
  }, [onSwipeLeft, onSwipeRight, threshold]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}

// ─── Step Indicator Dots ────────────────────────────────────────────
function StepDots({ total, current, maxVisible = 7 }: { total: number; current: number; maxVisible?: number }) {
  if (total <= maxVisible) {
    return (
      <div className="flex items-center gap-1.5 justify-center">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`rounded-full transition-all duration-300 ${
              i === current
                ? "w-6 h-2 bg-primary"
                : i < current
                ? "w-2 h-2 bg-primary/50"
                : "w-2 h-2 bg-muted-foreground/20"
            }`}
          />
        ))}
      </div>
    );
  }

  // For many steps, show a sliding window
  const start = Math.max(0, Math.min(current - 3, total - maxVisible));
  const end = Math.min(total, start + maxVisible);
  return (
    <div className="flex items-center gap-1 justify-center">
      {start > 0 && <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />}
      {Array.from({ length: end - start }).map((_, i) => {
        const idx = start + i;
        return (
          <div
            key={idx}
            className={`rounded-full transition-all duration-300 ${
              idx === current
                ? "w-5 h-1.5 bg-primary"
                : idx < current
                ? "w-1.5 h-1.5 bg-primary/50"
                : "w-1.5 h-1.5 bg-muted-foreground/20"
            }`}
          />
        );
      })}
      {end < total && <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────────────
export default function LessonPlayer() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const lessonId = parseInt(id || "0");

  const { data: lesson, isLoading } = trpc.lesson.getById.useQuery(
    { id: lessonId },
    { enabled: lessonId > 0 }
  );

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [timeSpent, setTimeSpent] = useState(0);
  const [started, setStarted] = useState(false);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Timer
  useEffect(() => {
    if (!started) return;
    const interval = setInterval(() => setTimeSpent((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [started]);

  const content = lesson?.content as any;
  const blocks = useMemo(() => content?.blocks || [], [content]);
  const quizQuestions = useMemo(() => content?.quizQuestions || [], [content]);
  const totalSteps = blocks.length + quizQuestions.length;
  const progress = totalSteps > 0 ? Math.round(((currentStep + 1) / totalSteps) * 100) : 0;

  const currentItem = currentStep < blocks.length
    ? { type: "block" as const, data: blocks[currentStep] }
    : { type: "quiz" as const, data: quizQuestions[currentStep - blocks.length] };

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setSlideDirection("left");
      setTimeout(() => {
        setCurrentStep((s) => s + 1);
        setSlideDirection(null);
      }, 150);
    } else {
      setShowResults(true);
    }
  }, [currentStep, totalSteps]);

  const handlePrev = useCallback(() => {
    if (currentStep > 0) {
      setSlideDirection("right");
      setTimeout(() => {
        setCurrentStep((s) => s - 1);
        setSlideDirection(null);
      }, 150);
    }
  }, [currentStep]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        handleNext();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handlePrev();
      }
    };
    if (started && !showResults) {
      window.addEventListener("keydown", handler);
      return () => window.removeEventListener("keydown", handler);
    }
  }, [started, showResults, handleNext, handlePrev]);

  const swipeHandlers = useSwipe(handleNext, handlePrev);

  const score = useMemo(() => {
    if (quizQuestions.length === 0) return 0;
    return quizQuestions.reduce((acc: number, q: any) => {
      const userAnswer = answers[q.id];
      const correct = q.options?.find((o: any) => o.isCorrect)?.id;
      return acc + (userAnswer === correct ? 1 : 0);
    }, 0);
  }, [quizQuestions, answers]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ─── Loading State ──────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-[60vh] w-full rounded-2xl" />
        <div className="flex justify-between">
          <Skeleton className="h-12 w-28" />
          <Skeleton className="h-12 w-28" />
        </div>
      </div>
    );
  }

  // ─── Not Found ──────────────────────────────────────────────────
  if (!lesson) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
        <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <BookOpen className="h-10 w-10 text-muted-foreground/40" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">Lesson Not Found</h2>
        <p className="text-muted-foreground text-center mb-6">
          This lesson may have been removed or is no longer available.
        </p>
        <Button onClick={() => setLocation("/lessons")} className="rounded-full px-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Library
        </Button>
      </div>
    );
  }

  // ─── Start Screen (Mobile-First) ───────────────────────────────
  if (!started) {
    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <Button variant="ghost" size="sm" className="mb-6 -ml-2" onClick={() => setLocation("/lessons")}>
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>

        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 p-8 text-center">
          {/* Decorative elements */}
          <div className="absolute top-4 right-4 opacity-20">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>

          <div className="h-20 w-20 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/5">
            <BookOpen className="h-10 w-10 text-primary" />
          </div>

          <h1 className="text-2xl font-bold mb-3 text-foreground leading-tight">
            {lesson.title}
          </h1>

          {lesson.description && (
            <p className="text-muted-foreground mb-6 max-w-sm mx-auto text-sm leading-relaxed">
              {lesson.description}
            </p>
          )}

          {/* Stats row */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="flex items-center gap-1.5 text-xs bg-background/60 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/50">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="text-foreground font-medium">{lesson.durationMinutes || 5} min</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs bg-background/60 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/50">
              <Target className="h-3.5 w-3.5 text-primary" />
              <span className="text-foreground font-medium">{blocks.length} sections</span>
            </div>
            {quizQuestions.length > 0 && (
              <div className="flex items-center gap-1.5 text-xs bg-background/60 backdrop-blur-sm rounded-full px-3 py-1.5 border border-border/50">
                <Zap className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-foreground font-medium">{quizQuestions.length} quiz</span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 mb-6">
            <Badge variant="outline" className="text-xs">{lesson.difficulty}</Badge>
            <Badge variant="outline" className="text-xs">{lesson.contentType}</Badge>
          </div>

          <Button
            size="lg"
            onClick={() => setStarted(true)}
            className="rounded-full px-10 py-6 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
          >
            <Play className="mr-2 h-5 w-5" /> Start Lesson
          </Button>
        </div>

        {/* Voice narration */}
        <div className="mt-6">
          <VoicePlayer lessonId={lessonId} />
        </div>
      </div>
    );
  }

  // ─── Results Screen ─────────────────────────────────────────────
  if (showResults) {
    const percentage = quizQuestions.length > 0 ? Math.round((score / quizQuestions.length) * 100) : 100;
    const passed = percentage >= (content?.passingScore || 70);

    return (
      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-background to-muted/30 border p-8 text-center">
          {/* Celebration animation for pass */}
          {passed && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-6 left-8 text-yellow-400 animate-bounce" style={{ animationDelay: "0.1s" }}>
                <Star className="h-4 w-4" />
              </div>
              <div className="absolute top-10 right-12 text-primary animate-bounce" style={{ animationDelay: "0.3s" }}>
                <Sparkles className="h-5 w-5" />
              </div>
              <div className="absolute bottom-16 left-12 text-green-400 animate-bounce" style={{ animationDelay: "0.5s" }}>
                <Star className="h-3 w-3" />
              </div>
            </div>
          )}

          <div className={`h-24 w-24 rounded-full flex items-center justify-center mx-auto mb-6 ${
            passed
              ? "bg-gradient-to-br from-green-500/20 to-emerald-500/10 ring-2 ring-green-500/20"
              : "bg-gradient-to-br from-orange-500/20 to-amber-500/10 ring-2 ring-orange-500/20"
          }`}>
            {passed ? (
              <Trophy className="h-12 w-12 text-green-500" />
            ) : (
              <RotateCcw className="h-12 w-12 text-orange-500" />
            )}
          </div>

          <h2 className="text-2xl font-bold mb-2 text-foreground">
            {passed ? "Well Done!" : "Almost There!"}
          </h2>

          <p className="text-muted-foreground mb-6 text-sm">
            {quizQuestions.length > 0
              ? `You scored ${score}/${quizQuestions.length} (${percentage}%)`
              : "You've completed all content sections."}
          </p>

          {/* Stats cards */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/50">
              <Clock className="h-5 w-5 text-primary mx-auto mb-1" />
              <div className="text-lg font-bold text-foreground">{formatTime(timeSpent)}</div>
              <div className="text-xs text-muted-foreground">Time Spent</div>
            </div>
            <div className="bg-background/60 backdrop-blur-sm rounded-xl p-4 border border-border/50">
              <Target className="h-5 w-5 text-primary mx-auto mb-1" />
              <div className="text-lg font-bold text-foreground">{percentage}%</div>
              <div className="text-xs text-muted-foreground">Score</div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button
              variant="outline"
              onClick={() => setLocation("/lessons")}
              className="rounded-full px-6"
            >
              Back to Library
            </Button>
            <Button
              onClick={() => {
                setCurrentStep(0);
                setShowResults(false);
                setAnswers({});
                setTimeSpent(0);
              }}
              className="rounded-full px-6"
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Active Lesson Player ──────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto px-4 py-4 flex flex-col min-h-[calc(100vh-80px)]" {...swipeHandlers}>
      {/* Top bar - compact */}
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => {
            if (confirm("Leave lesson? Your progress will be lost.")) {
              setLocation("/lessons");
            }
          }}
          className="p-2 -ml-2 rounded-full hover:bg-muted transition-colors"
          aria-label="Back"
        >
          <ChevronLeft className="h-5 w-5 text-muted-foreground" />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{lesson.title}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <Progress value={progress} className="h-1 flex-1" />
            <span className="text-[10px] text-muted-foreground font-mono whitespace-nowrap">
              {currentStep + 1}/{totalSteps}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded-full px-2.5 py-1">
          <Clock className="h-3 w-3" />
          {formatTime(timeSpent)}
        </div>
      </div>

      {/* Step dots */}
      <div className="mb-4">
        <StepDots total={totalSteps} current={currentStep} />
      </div>

      {/* Content area - fills available space */}
      <div
        ref={contentRef}
        className={`flex-1 transition-all duration-150 ${
          slideDirection === "left"
            ? "-translate-x-4 opacity-0"
            : slideDirection === "right"
            ? "translate-x-4 opacity-0"
            : "translate-x-0 opacity-100"
        }`}
      >
        <div className="rounded-2xl bg-card border border-border/50 p-5 sm:p-6 min-h-[50vh] flex flex-col">
          {currentItem.type === "block" ? (
            <div className="flex-1">
              <Badge variant="outline" className="mb-4 text-[10px] uppercase tracking-wider">
                {currentItem.data?.type || "content"}
              </Badge>

              {currentItem.data?.type === "text" && (
                <div className="space-y-4">
                  <div className="text-foreground leading-relaxed text-[15px] whitespace-pre-wrap">
                    {currentItem.data?.data?.text || currentItem.data?.data?.content || "Content block"}
                  </div>
                  <VoicePlayer
                    text={currentItem.data?.data?.text || currentItem.data?.data?.content || ""}
                    compact
                  />
                </div>
              )}

              {currentItem.data?.type === "video" && (
                <div className="aspect-video bg-muted rounded-xl overflow-hidden">
                  {currentItem.data?.data?.url ? (
                    <video
                      src={currentItem.data.data.url}
                      controls
                      className="w-full h-full object-cover"
                      playsInline
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                      <Play className="h-12 w-12 mb-2" />
                      <p className="text-sm">Video content</p>
                    </div>
                  )}
                </div>
              )}

              {currentItem.data?.type === "image" && currentItem.data?.data?.url && (
                <img
                  src={currentItem.data.data.url}
                  alt=""
                  className="rounded-xl max-w-full"
                  loading="lazy"
                />
              )}

              {currentItem.data?.type === "scenario" && (
                <div className="space-y-3">
                  <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
                    <p className="text-sm font-medium text-primary mb-1">Scenario</p>
                    <p className="text-foreground text-sm leading-relaxed">
                      {currentItem.data?.data?.text || currentItem.data?.data?.scenario || "Scenario content"}
                    </p>
                  </div>
                </div>
              )}

              {!["text", "video", "image", "scenario"].includes(currentItem.data?.type) && (
                <div className="text-foreground leading-relaxed text-sm">
                  <pre className="whitespace-pre-wrap font-sans">
                    {typeof currentItem.data?.data === "string"
                      ? currentItem.data.data
                      : JSON.stringify(currentItem.data?.data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1">
              <Badge variant="outline" className="mb-4 text-[10px] uppercase tracking-wider bg-amber-500/10 text-amber-600 border-amber-500/20">
                Question {currentStep - blocks.length + 1} of {quizQuestions.length}
              </Badge>

              <h3 className="text-lg font-semibold mb-5 text-foreground leading-snug">
                {currentItem.data?.question}
              </h3>

              <RadioGroup
                value={answers[currentItem.data?.id] || ""}
                onValueChange={(val) =>
                  setAnswers((prev) => ({ ...prev, [currentItem.data?.id]: val }))
                }
                className="space-y-2.5"
              >
                {currentItem.data?.options?.map((opt: any, idx: number) => (
                  <div
                    key={opt.id}
                    className={`flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer ${
                      answers[currentItem.data?.id] === opt.id
                        ? "bg-primary/10 border-primary/30 shadow-sm"
                        : "bg-muted/30 border-border/50 hover:bg-muted/60"
                    }`}
                  >
                    <RadioGroupItem value={opt.id} id={opt.id} />
                    <Label htmlFor={opt.id} className="cursor-pointer flex-1 text-foreground text-sm leading-snug">
                      {opt.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
        </div>
      </div>

      {/* Bottom navigation - fixed feel */}
      <div className="flex items-center justify-between pt-4 pb-2 gap-3">
        <Button
          variant="outline"
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="rounded-full px-5 h-11"
        >
          <ChevronLeft className="mr-1 h-4 w-4" /> Back
        </Button>

        <p className="text-[10px] text-muted-foreground hidden sm:block">
          Swipe or use arrow keys
        </p>

        <Button
          onClick={handleNext}
          className="rounded-full px-5 h-11"
        >
          {currentStep === totalSteps - 1 ? (
            <>
              Finish <CheckCircle2 className="ml-1 h-4 w-4" />
            </>
          ) : (
            <>
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
