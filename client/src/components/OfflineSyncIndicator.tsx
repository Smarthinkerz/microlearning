/**
 * Offline Sync Status Indicator
 * 
 * Shows connectivity status and pending sync items.
 * Displays in the bottom-right corner of the screen.
 */
import { Wifi, WifiOff, RefreshCw, AlertCircle, Check } from "lucide-react";
import { useOfflineSync } from "@/hooks/useOfflineSync";
import { useState, useEffect } from "react";

export function OfflineSyncIndicator() {
  const { isOnline, isSyncing, queueStats, retryFailed } = useOfflineSync();
  const [showBanner, setShowBanner] = useState(false);
  const [recentlyOnline, setRecentlyOnline] = useState(false);

  // Show banner when going offline or when there are pending items
  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
      setRecentlyOnline(false);
    } else if (showBanner && !isOnline) {
      // Was offline, now online
      setRecentlyOnline(true);
      const timer = setTimeout(() => {
        setShowBanner(false);
        setRecentlyOnline(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  // Show when there are pending sync items
  useEffect(() => {
    if (queueStats.total > 0) {
      setShowBanner(true);
    } else if (isOnline && queueStats.total === 0) {
      const timer = setTimeout(() => setShowBanner(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [queueStats.total, isOnline]);

  if (!showBanner && isOnline && queueStats.total === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-amber-600 text-white rounded-lg shadow-lg p-3 flex items-center gap-3 mb-2">
          <WifiOff className="h-5 w-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">You are offline</p>
            <p className="text-xs opacity-90">
              Your progress is saved locally and will sync when you reconnect.
            </p>
          </div>
        </div>
      )}

      {/* Back Online Banner */}
      {recentlyOnline && isOnline && (
        <div className="bg-emerald-600 text-white rounded-lg shadow-lg p-3 flex items-center gap-3 mb-2">
          <Wifi className="h-5 w-5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">Back online</p>
            <p className="text-xs opacity-90">Syncing your offline progress...</p>
          </div>
        </div>
      )}

      {/* Sync Queue Status */}
      {queueStats.total > 0 && (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3 flex items-center gap-3">
          {isSyncing ? (
            <RefreshCw className="h-4 w-4 shrink-0 text-blue-500 animate-spin" />
          ) : queueStats.failed > 0 ? (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          ) : (
            <Check className="h-4 w-4 shrink-0 text-emerald-500" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground">
              {isSyncing
                ? `Syncing ${queueStats.pending} item${queueStats.pending !== 1 ? "s" : ""}...`
                : queueStats.failed > 0
                  ? `${queueStats.failed} item${queueStats.failed !== 1 ? "s" : ""} failed to sync`
                  : `${queueStats.pending} item${queueStats.pending !== 1 ? "s" : ""} pending sync`}
            </p>
          </div>
          {queueStats.failed > 0 && !isSyncing && (
            <button
              onClick={retryFailed}
              className="text-xs text-blue-500 hover:text-blue-400 font-medium"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
}
