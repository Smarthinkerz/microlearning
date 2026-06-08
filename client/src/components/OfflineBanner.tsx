import { useState, useEffect, useCallback } from "react";
import { WifiOff, Wifi, X, RefreshCw, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

type RetryState = "idle" | "checking" | "failed" | "success";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [retryState, setRetryState] = useState<RetryState>("idle");

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      setRetryState("success");
      setDismissed(false);
      // Auto-hide the "reconnected" banner after 4s
      setTimeout(() => {
        setShowReconnected(false);
        setRetryState("idle");
      }, 4000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
      setRetryState("idle");
      setDismissed(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  /**
   * Manual retry: attempt a lightweight HEAD request to a reliable endpoint.
   * Falls back to navigator.onLine if the fetch itself fails for non-network reasons.
   */
  const handleRetry = useCallback(async () => {
    if (retryState === "checking") return;
    setRetryState("checking");

    try {
      // Ping the app's own health endpoint; if unavailable, fall back to a public CDN
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch("/api/trpc/auth.me?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D", {
        method: "HEAD",
        signal: controller.signal,
        cache: "no-store",
      }).catch(() =>
        // Fallback: try a well-known CDN
        fetch("https://www.google.com/favicon.ico", {
          method: "HEAD",
          signal: controller.signal,
          cache: "no-store",
          mode: "no-cors",
        })
      );
      clearTimeout(timeout);

      // If we got any response (even opaque no-cors), we're online
      setIsOnline(true);
      setShowReconnected(true);
      setRetryState("success");
      setDismissed(false);
      setTimeout(() => {
        setShowReconnected(false);
        setRetryState("idle");
      }, 4000);
    } catch {
      // Still offline
      setIsOnline(false);
      setRetryState("failed");
      // Reset to idle after 3s so user can retry again
      setTimeout(() => setRetryState("idle"), 3000);
    }
  }, [retryState]);

  if (isOnline && !showReconnected) return null;
  if (dismissed) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 py-2.5 text-sm font-medium",
        "transition-all duration-300",
        isOnline
          ? "bg-success text-success-foreground"
          : retryState === "failed"
          ? "bg-destructive/90 text-destructive-foreground"
          : "bg-destructive text-destructive-foreground"
      )}
    >
      {/* Left: icon + message */}
      <div className="flex items-center gap-2 min-w-0">
        {isOnline ? (
          <CheckCircle2 className="w-4 h-4 shrink-0" />
        ) : (
          <WifiOff className="w-4 h-4 shrink-0" />
        )}
        <span className="truncate">
          {isOnline
            ? "You're back online. Your progress has been synced."
            : retryState === "failed"
            ? "Still offline. Check your network connection and try again."
            : "You're offline. Lessons you've started will sync when you reconnect."}
        </span>
      </div>

      {/* Right: retry button + dismiss */}
      <div className="flex items-center gap-2 ml-4 shrink-0">
        {/* Retry button — only shown when offline */}
        {!isOnline && (
          <button
            onClick={handleRetry}
            disabled={retryState === "checking"}
            aria-label={retryState === "checking" ? "Checking connection…" : "Retry connection"}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-semibold border transition-fast",
              "bg-white/15 border-white/30 hover:bg-white/25",
              retryState === "checking" && "opacity-70 cursor-not-allowed"
            )}
          >
            <RefreshCw
              className={cn(
                "w-3.5 h-3.5",
                retryState === "checking" && "animate-spin"
              )}
            />
            {retryState === "checking" ? "Checking…" : retryState === "failed" ? "Try Again" : "Retry"}
          </button>
        )}

        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded hover:opacity-80 transition-fast"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
