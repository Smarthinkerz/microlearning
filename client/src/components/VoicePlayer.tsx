import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Volume2, VolumeX, Play, Pause, Loader2, Settings2, Mic } from "lucide-react";
import { toast } from "sonner";

interface VoicePlayerProps {
  /** Text to synthesize */
  text?: string;
  /** Lesson ID to synthesize all content from */
  lessonId?: number;
  /** Compact mode for inline use */
  compact?: boolean;
}

export function VoicePlayer({ text, lessonId, compact }: VoicePlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [selectedVoice, setSelectedVoice] = useState("EXAVITQu4vr4xnSDxMaL"); // Sarah
  const [stability, setStability] = useState(0.5);
  const [similarityBoost, setSimilarityBoost] = useState(0.75);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const { data: voiceConfig } = trpc.voice.isConfigured.useQuery();
  const { data: voices } = trpc.voice.getVoices.useQuery(undefined, {
    enabled: !!voiceConfig?.configured,
  });

  const synthesize = trpc.voice.synthesize.useMutation({
    onSuccess: (data) => {
      setAudioUrl(data.url);
      toast.success("Audio generated successfully");
    },
    onError: (err) => toast.error(err.message),
  });

  const synthesizeLesson = trpc.voice.synthesizeLesson.useMutation({
    onSuccess: (data) => {
      setAudioUrl(data.url);
      toast.success(`Lesson narration generated (${data.charCount} characters)`);
    },
    onError: (err) => toast.error(err.message),
  });

  const isGenerating = synthesize.isPending || synthesizeLesson.isPending;

  useEffect(() => {
    if (!audioUrl) return;
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    audio.volume = volume;

    audio.addEventListener("loadedmetadata", () => setDuration(audio.duration));
    audio.addEventListener("timeupdate", () => setProgress(audio.currentTime));
    audio.addEventListener("ended", () => { setIsPlaying(false); setProgress(0); });
    audio.addEventListener("error", () => toast.error("Audio playback error"));

    return () => {
      audio.pause();
      audio.src = "";
    };
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const handleGenerate = () => {
    if (lessonId) {
      synthesizeLesson.mutate({
        lessonId,
        voiceId: selectedVoice,
        stability,
        similarityBoost,
      });
    } else if (text) {
      synthesize.mutate({
        text,
        voiceId: selectedVoice,
        stability,
        similarityBoost,
      });
    }
  };

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (audioRef.current) {
      audioRef.current.currentTime = value[0];
      setProgress(value[0]);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (!voiceConfig?.configured) return null;

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {!audioUrl ? (
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerate}
            disabled={isGenerating || (!text && !lessonId)}
            className="h-8"
          >
            {isGenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Mic className="h-3.5 w-3.5" />
            )}
            <span className="ml-1.5 text-xs">{isGenerating ? "Generating..." : "Listen"}</span>
          </Button>
        ) : (
          <>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={togglePlay}>
              {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            </Button>
            <div className="flex-1 min-w-[80px]">
              <Slider
                value={[progress]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="h-1"
              />
            </div>
            <span className="text-[10px] text-muted-foreground tabular-nums">
              {formatTime(progress)}/{formatTime(duration)}
            </span>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Mic className="h-4 w-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Voice Narration</span>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <Settings2 className="h-3.5 w-3.5" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-4" align="end">
            <div>
              <Label className="text-xs">Voice</Label>
              <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(voices || []).map((v: any) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Stability ({stability.toFixed(2)})</Label>
              <Slider
                value={[stability]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={(v) => setStability(v[0])}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Higher = more consistent, Lower = more expressive
              </p>
            </div>
            <div>
              <Label className="text-xs">Clarity ({similarityBoost.toFixed(2)})</Label>
              <Slider
                value={[similarityBoost]}
                min={0}
                max={1}
                step={0.05}
                onValueChange={(v) => setSimilarityBoost(v[0])}
              />
              <p className="text-[10px] text-muted-foreground mt-1">
                Higher = clearer voice, Lower = more natural
              </p>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      {!audioUrl ? (
        <Button
          onClick={handleGenerate}
          disabled={isGenerating || (!text && !lessonId)}
          className="w-full"
          size="sm"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating narration...
            </>
          ) : (
            <>
              <Mic className="mr-2 h-4 w-4" />
              Generate Voice Narration
            </>
          )}
        </Button>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Button size="icon" variant="outline" className="h-9 w-9 shrink-0" onClick={togglePlay}>
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <div className="flex-1 space-y-1">
              <Slider
                value={[progress]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
              />
              <div className="flex justify-between text-[10px] text-muted-foreground tabular-nums">
                <span>{formatTime(progress)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7"
              onClick={() => setIsMuted(!isMuted)}
            >
              {isMuted ? <VolumeX className="h-3.5 w-3.5" /> : <Volume2 className="h-3.5 w-3.5" />}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={1}
              step={0.05}
              onValueChange={(v) => { setVolume(v[0]); setIsMuted(false); }}
              className="w-24"
            />
            <div className="flex-1" />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={() => { setAudioUrl(null); setProgress(0); setDuration(0); setIsPlaying(false); }}
            >
              Regenerate
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
