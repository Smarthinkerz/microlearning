import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, Save, Wand2, Plus, Trash2, GripVertical, Type, Video, HelpCircle, GitBranch, Loader2,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation, useParams } from "wouter";
import { toast } from "sonner";
import { FeatureGate } from "@/components/FeatureGate";

type ContentBlock = {
  id: string;
  type: "text" | "video" | "quiz" | "scenario" | "image";
  data: Record<string, any>;
  order: number;
};

type QuizQuestion = {
  id: string;
  question: string;
  type: "multiple_choice" | "true_false";
  options: { id: string; text: string; isCorrect: boolean }[];
  explanation: string;
  points: number;
};

export default function LessonEditor() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const orgId = (user as any)?.orgId;
  const isNew = !id || id === "new";
  const lessonId = isNew ? 0 : parseInt(id);
  const utils = trpc.useUtils();

  const { data: existingLesson } = trpc.lesson.getById.useQuery(
    { id: lessonId },
    { enabled: lessonId > 0 }
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contentType, setContentType] = useState("mixed");
  const [difficulty, setDifficulty] = useState("beginner");
  const [durationMinutes, setDurationMinutes] = useState(5);
  const [category, setCategory] = useState("");
  const [tags, setTags] = useState("");
  const [language, setLanguage] = useState("en");
  const [blocks, setBlocks] = useState<ContentBlock[]>([]);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [passingScore, setPassingScore] = useState(70);

  useEffect(() => {
    if (existingLesson) {
      setTitle(existingLesson.title);
      setDescription(existingLesson.description || "");
      setContentType(existingLesson.contentType || "mixed");
      setDifficulty(existingLesson.difficulty || "beginner");
      setDurationMinutes(existingLesson.durationMinutes || 5);
      setCategory(existingLesson.category || "");
      setTags((existingLesson.tags as string[] || []).join(", "));
      setLanguage(existingLesson.language || "en");
      const content = existingLesson.content as any;
      if (content?.blocks) setBlocks(content.blocks);
      if (content?.quizQuestions) setQuizQuestions(content.quizQuestions);
      if (content?.passingScore) setPassingScore(content.passingScore);
    }
  }, [existingLesson]);

  const createMutation = trpc.lesson.create.useMutation({
    onSuccess: (data: any) => {
      toast.success("Lesson created");
      setLocation(`/authoring/${data.id}`);
    },
    onError: (err) => toast.error(err.message),
  });

  const updateMutation = trpc.lesson.update.useMutation({
    onSuccess: () => { toast.success("Lesson saved"); utils.lesson.getById.invalidate(); },
    onError: (err) => toast.error(err.message),
  });

  const aiGenerate = trpc.ai.generateLesson.useMutation({
    onSuccess: (data: any) => {
      if (data.error) { toast.error("AI generation failed"); return; }
      if (data.title) setTitle(data.title);
      if (data.description) setDescription(data.description);
      if (data.durationMinutes) setDurationMinutes(data.durationMinutes);
      if (data.blocks) setBlocks(data.blocks);
      if (data.quizQuestions) setQuizQuestions(data.quizQuestions);
      if (data.passingScore) setPassingScore(data.passingScore);
      toast.success("AI content generated! Review and edit as needed.");
    },
    onError: () => toast.error("AI generation failed"),
  });

  const [aiTopic, setAiTopic] = useState("");

  const handleSave = () => {
    if (!title.trim()) { toast.error("Title is required"); return; }
    const content = {
      blocks,
      quizQuestions,
      passingScore,
    };
    const payload = {
      title,
      description,
      content,
      contentType: contentType as any,
      difficulty: difficulty as any,
      durationMinutes,
      category: category || undefined,
      tags: tags ? tags.split(",").map(t => t.trim()).filter(Boolean) : undefined,
      language,
    };

    if (isNew) {
      createMutation.mutate({ ...payload, orgId: orgId || undefined });
    } else {
      updateMutation.mutate({ id: lessonId, ...payload });
    }
  };

  const addBlock = (type: ContentBlock["type"]) => {
    const newBlock: ContentBlock = {
      id: `block-${Date.now()}`,
      type,
      data: type === "text" ? { text: "" } : type === "video" ? { url: "" } : {},
      order: blocks.length,
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (id: string, data: Record<string, any>) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, data: { ...b.data, ...data } } : b));
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
  };

  const addQuizQuestion = () => {
    const newQ: QuizQuestion = {
      id: `q-${Date.now()}`,
      question: "",
      type: "multiple_choice",
      options: [
        { id: `o-${Date.now()}-1`, text: "", isCorrect: true },
        { id: `o-${Date.now()}-2`, text: "", isCorrect: false },
        { id: `o-${Date.now()}-3`, text: "", isCorrect: false },
        { id: `o-${Date.now()}-4`, text: "", isCorrect: false },
      ],
      explanation: "",
      points: 1,
    };
    setQuizQuestions([...quizQuestions, newQ]);
  };

  const updateQuestion = (id: string, data: Partial<QuizQuestion>) => {
    setQuizQuestions(quizQuestions.map(q => q.id === id ? { ...q, ...data } : q));
  };

  const removeQuestion = (id: string) => {
    setQuizQuestions(quizQuestions.filter(q => q.id !== id));
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <FeatureGate feature="contentAuthoring">
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => setLocation("/authoring")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">
            {isNew ? "Create New Lesson" : "Edit Lesson"}
          </h1>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save
        </Button>
      </div>

      {/* AI Generation */}
      <Card className="border-primary/20">
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-3">
            <Wand2 className="h-5 w-5 text-primary shrink-0" />
            <Input
              placeholder="Describe a topic and AI will generate lesson content..."
              value={aiTopic}
              onChange={(e) => setAiTopic(e.target.value)}
              className="flex-1"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (!aiTopic.trim()) { toast.error("Enter a topic"); return; }
                aiGenerate.mutate({
                  topic: aiTopic,
                  difficulty: difficulty as any,
                  durationMinutes,
                  contentType: contentType as any,
                  language,
                });
              }}
              disabled={aiGenerate.isPending}
            >
              {aiGenerate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader><CardTitle className="text-base">Lesson Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Lesson title" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description" rows={3} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label>Type</Label>
              <Select value={contentType} onValueChange={setContentType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixed">Mixed</SelectItem>
                  <SelectItem value="video">Video</SelectItem>
                  <SelectItem value="quiz">Quiz</SelectItem>
                  <SelectItem value="scenario">Scenario</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="assessment">Assessment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration (min)</Label>
              <Input type="number" min={1} max={60} value={durationMinutes} onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 5)} />
            </div>
            <div>
              <Label>Language</Label>
              <Input value={language} onChange={(e) => setLanguage(e.target.value)} placeholder="en" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Safety, Compliance" />
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="safety, onboarding" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Content Blocks */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Content Blocks</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => addBlock("text")}>
              <Type className="mr-1 h-3.5 w-3.5" /> Text
            </Button>
            <Button variant="outline" size="sm" onClick={() => addBlock("video")}>
              <Video className="mr-1 h-3.5 w-3.5" /> Video
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {blocks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No content blocks yet. Add text or video blocks above, or use AI to generate content.
            </div>
          ) : (
            blocks.map((block, idx) => (
              <div key={block.id} className="flex gap-2 items-start p-3 rounded-lg bg-secondary/30 border border-border/50">
                <GripVertical className="h-4 w-4 text-muted-foreground mt-2 shrink-0 cursor-grab" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[10px]">{block.type}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => removeBlock(block.id)}>
                      <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </Button>
                  </div>
                  {block.type === "text" && (
                    <Textarea
                      value={block.data.text || ""}
                      onChange={(e) => updateBlock(block.id, { text: e.target.value })}
                      placeholder="Enter text content..."
                      rows={4}
                    />
                  )}
                  {block.type === "video" && (
                    <Input
                      value={block.data.url || ""}
                      onChange={(e) => updateBlock(block.id, { url: e.target.value })}
                      placeholder="Video URL"
                    />
                  )}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Quiz Questions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Quiz Questions</CardTitle>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Passing Score:</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={passingScore}
                onChange={(e) => setPassingScore(parseInt(e.target.value) || 70)}
                className="w-16 h-8"
              />
              <span className="text-xs text-muted-foreground">%</span>
            </div>
            <Button variant="outline" size="sm" onClick={addQuizQuestion}>
              <HelpCircle className="mr-1 h-3.5 w-3.5" /> Add Question
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {quizQuestions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No quiz questions yet. Add questions or use AI to generate them.
            </div>
          ) : (
            quizQuestions.map((q, qIdx) => (
              <div key={q.id} className="p-4 rounded-lg bg-secondary/30 border border-border/50 space-y-3">
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px]">Q{qIdx + 1}</Badge>
                  <Button variant="ghost" size="sm" onClick={() => removeQuestion(q.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                  </Button>
                </div>
                <Input
                  value={q.question}
                  onChange={(e) => updateQuestion(q.id, { question: e.target.value })}
                  placeholder="Question text"
                />
                <div className="space-y-2">
                  {q.options.map((opt, oIdx) => (
                    <div key={opt.id} className="flex items-center gap-2">
                      <Switch
                        checked={opt.isCorrect}
                        onCheckedChange={(checked) => {
                          const newOptions = q.options.map((o, i) => ({
                            ...o,
                            isCorrect: i === oIdx ? checked : false,
                          }));
                          updateQuestion(q.id, { options: newOptions });
                        }}
                      />
                      <Input
                        value={opt.text}
                        onChange={(e) => {
                          const newOptions = [...q.options];
                          newOptions[oIdx] = { ...newOptions[oIdx], text: e.target.value };
                          updateQuestion(q.id, { options: newOptions });
                        }}
                        placeholder={`Option ${oIdx + 1}`}
                        className="flex-1"
                      />
                    </div>
                  ))}
                </div>
                <Input
                  value={q.explanation}
                  onChange={(e) => updateQuestion(q.id, { explanation: e.target.value })}
                  placeholder="Explanation (shown after answering)"
                />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
    </FeatureGate>
  );
}
