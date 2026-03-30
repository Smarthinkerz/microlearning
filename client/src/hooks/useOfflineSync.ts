/**
 * useOfflineSync Hook
 * 
 * Manages offline/online state detection, sync queue processing,
 * and provides UI state for offline indicators.
 */
import { useState, useEffect, useCallback, useRef } from "react";
import {
  enqueueSync,
  getPendingItems,
  getFailedItems,
  updateSyncItem,
  removeSyncItem,
  getSyncQueueStats,
  clearSyncedItems,
  type SyncQueueItem,
} from "@/lib/offlineSync";

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

type SyncHandler = (item: SyncQueueItem) => Promise<boolean>;

export function useOfflineSync(syncHandler?: SyncHandler) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [queueStats, setQueueStats] = useState({
    pending: 0,
    syncing: 0,
    failed: 0,
    total: 0,
  });
  const syncInProgress = useRef(false);
  const handlerRef = useRef(syncHandler);
  handlerRef.current = syncHandler;

  // Update online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Trigger sync when coming back online
      processQueue();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Refresh queue stats periodically
  useEffect(() => {
    const refreshStats = async () => {
      try {
        const stats = await getSyncQueueStats();
        setQueueStats(stats);
      } catch {
        // IndexedDB might not be available
      }
    };

    refreshStats();
    const interval = setInterval(refreshStats, 10000);
    return () => clearInterval(interval);
  }, []);

  // Process the sync queue
  const processQueue = useCallback(async () => {
    if (syncInProgress.current || !navigator.onLine || !handlerRef.current) return;
    
    syncInProgress.current = true;
    setIsSyncing(true);

    try {
      const pendingItems = await getPendingItems();
      const failedItems = await getFailedItems();
      const allItems = [...pendingItems, ...failedItems.filter(i => i.retryCount < MAX_RETRIES)];

      for (const item of allItems) {
        if (!navigator.onLine) break;

        try {
          await updateSyncItem(item.id!, { status: "syncing" });
          const success = await handlerRef.current(item);

          if (success) {
            await removeSyncItem(item.id!);
          } else {
            await updateSyncItem(item.id!, {
              status: "failed",
              retryCount: item.retryCount + 1,
              errorMessage: "Sync handler returned false",
            });
          }
        } catch (err) {
          await updateSyncItem(item.id!, {
            status: "failed",
            retryCount: item.retryCount + 1,
            errorMessage: err instanceof Error ? err.message : "Unknown error",
          });
        }
      }

      // Clean up old synced items
      await clearSyncedItems();

      // Refresh stats
      const stats = await getSyncQueueStats();
      setQueueStats(stats);
    } finally {
      syncInProgress.current = false;
      setIsSyncing(false);
    }
  }, []);

  // Enqueue a new item
  const enqueue = useCallback(
    async (type: SyncQueueItem["type"], payload: Record<string, unknown>) => {
      const id = await enqueueSync({ type, payload });
      const stats = await getSyncQueueStats();
      setQueueStats(stats);

      // If online, try to sync immediately
      if (navigator.onLine) {
        setTimeout(() => processQueue(), 100);
      }

      return id;
    },
    [processQueue]
  );

  // Force retry all failed items
  const retryFailed = useCallback(async () => {
    const failedItems = await getFailedItems();
    for (const item of failedItems) {
      await updateSyncItem(item.id!, { status: "pending", retryCount: 0 });
    }
    if (navigator.onLine) {
      processQueue();
    }
  }, [processQueue]);

  return {
    isOnline,
    isSyncing,
    queueStats,
    enqueue,
    processQueue,
    retryFailed,
    hasPendingSync: queueStats.total > 0,
  };
}
