import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Clock, BookOpen, Play, XCircle,
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";

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

  // Timer
  useEffect(() => {
    if (!started) return;
    const interval = setInterval(() => setTimeSpent((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [started]);

  const content = lesson?.content as any;
  const blocks = content?.blocks || [];
  const quizQuestions = content?.quizQuestions || [];
  const totalSteps = blocks.length + quizQuestions.length;
  const progress = totalSteps > 0 ? Math.round(((currentStep + 1) / totalSteps) * 100) : 0;

  const currentItem = currentStep < blocks.length
    ? { type: "block", data: blocks[currentStep] }
    : { type: "quiz", data: quizQuestions[currentStep - blocks.length] };

  const handleNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
    } else {
      setShowResults(true);
    }
  }, [currentStep, totalSteps]);

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep((s) => s - 1);
  };

  const score = quizQuestions.length > 0
    ? quizQuestions.reduce((acc: number, q: any) => {
        const userAnswer = answers[q.id];
        const correct = q.options?.find((o: any) => o.isCorrect)?.id;
        return acc + (userAnswer === correct ? 1 : 0);
      }, 0)
    : 0;

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="text-center py-16">
        <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
        <p className="text-muted-foreground">Lesson not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => setLocation("/lessons")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Lessons
        </Button>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="max-w-2xl mx-auto">
        <Button variant="ghost" size="sm" className="mb-4" onClick={() => setLocation("/lessons")}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold mb-2 text-foreground">{lesson.title}</h1>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">{lesson.description}</p>
            <div className="flex items-center justify-center gap-4 mb-8 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" /> {lesson.durationMinutes || 5} min
              </span>
              <Badge variant="outline">{lesson.difficulty}</Badge>
              <Badge variant="outline">{lesson.contentType}</Badge>
            </div>
            <div className="text-sm text-muted-foreground mb-6">
              {blocks.length} content sections {quizQuestions.length > 0 && `+ ${quizQuestions.length} quiz questions`}
            </div>
            <Button size="lg" onClick={() => setStarted(true)}>
              <Play className="mr-2 h-4 w-4" /> Start Lesson
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (showResults) {
    const percentage = quizQuestions.length > 0 ? Math.round((score / quizQuestions.length) * 100) : 100;
    const passed = percentage >= (content?.passingScore || 70);
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-8 pb-8 text-center">
            <div className={`h-16 w-16 rounded-full flex items-center justify-center mx-auto mb-6 ${passed ? "bg-green-500/10" : "bg-red-500/10"}`}>
              {passed ? <CheckCircle2 className="h-8 w-8 text-green-500" /> : <XCircle className="h-8 w-8 text-red-500" />}
            </div>
            <h2 className="text-2xl font-bold mb-2 text-foreground">
              {passed ? "Lesson Complete!" : "Keep Practicing"}
            </h2>
            <p className="text-muted-foreground mb-6">
              {quizQuestions.length > 0
                ? `You scored ${score}/${quizQuestions.length} (${percentage}%)`
                : "You've completed all content sections."}
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-8">
              <Clock className="h-4 w-4" />
              Time spent: {Math.floor(timeSpent / 60)}m {timeSpent % 60}s
            </div>
            <div className="flex gap-3 justify-center">
              <Button variant="outline" onClick={() => setLocation("/lessons")}>
                Back to Library
              </Button>
              <Button onClick={() => { setCurrentStep(0); setShowResults(false); setAnswers({}); setTimeSpent(0); }}>
                Retry Lesson
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Progress Bar */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setLocation("/lessons")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-foreground truncate">{lesson.title}</span>
            <span className="text-xs text-muted-foreground">
              {currentStep + 1}/{totalSteps}
            </span>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          <Clock className="h-3 w-3 inline mr-1" />
          {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, "0")}
        </span>
      </div>

      {/* Content */}
      <Card>
        <CardContent className="pt-6 pb-6 min-h-[300px]">
          {currentItem.type === "block" ? (
            <div>
              <Badge variant="outline" className="mb-4 text-xs">
                {currentItem.data?.type || "content"}
              </Badge>
              {currentItem.data?.type === "text" && (
                <div className="prose prose-invert max-w-none">
                  <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {currentItem.data?.data?.text || currentItem.data?.data?.content || "Content block"}
                  </div>
                </div>
              )}
              {currentItem.data?.type === "video" && (
                <div className="aspect-video bg-secondary rounded-lg flex items-center justify-center">
                  {currentItem.data?.data?.url ? (
                    <video src={currentItem.data.data.url} controls className="w-full h-full rounded-lg" />
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <Play className="h-12 w-12 mx-auto mb-2" />
                      <p>Video content</p>
                    </div>
                  )}
                </div>
              )}
              {currentItem.data?.type === "image" && currentItem.data?.data?.url && (
                <img src={currentItem.data.data.url} alt="" className="rounded-lg max-w-full" />
              )}
              {!["text", "video", "image"].includes(currentItem.data?.type) && (
                <div className="text-foreground leading-relaxed">
                  {JSON.stringify(currentItem.data?.data, null, 2)}
                </div>
              )}
            </div>
          ) : (
            <div>
              <Badge variant="outline" className="mb-4 text-xs">Question {currentStep - blocks.length + 1}</Badge>
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                {currentItem.data?.question}
              </h3>
              <RadioGroup
                value={answers[currentItem.data?.id] || ""}
                onValueChange={(val) => setAnswers((prev) => ({ ...prev, [currentItem.data?.id]: val }))}
                className="space-y-3"
              >
                {currentItem.data?.options?.map((opt: any) => (
                  <div key={opt.id} className="flex items-center space-x-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 transition-colors">
                    <RadioGroupItem value={opt.id} id={opt.id} />
                    <Label htmlFor={opt.id} className="cursor-pointer flex-1 text-foreground">
                      {opt.text}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={handlePrev} disabled={currentStep === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>
        <Button onClick={handleNext}>
          {currentStep === totalSteps - 1 ? "Finish" : "Next"}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
