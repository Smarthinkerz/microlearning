/**
 * Offline Sync Queue
 * 
 * IndexedDB-backed queue for deferred mutations when offline.
 * Stores lesson attempts, progress updates, and other mutations.
 * Automatically replays queued items when connectivity returns.
 */
import { openDB, type IDBPDatabase } from "idb";

const DB_NAME = "learnshift-offline";
const DB_VERSION = 1;
const SYNC_QUEUE_STORE = "syncQueue";
const OFFLINE_LESSONS_STORE = "offlineLessons";
const OFFLINE_PROGRESS_STORE = "offlineProgress";

export type SyncQueueItem = {
  id?: number;
  type: "attempt_submit" | "progress_update" | "assignment_status" | "notification_read";
  payload: Record<string, unknown>;
  createdAt: number;
  retryCount: number;
  status: "pending" | "syncing" | "failed" | "synced";
  errorMessage?: string;
};

export type OfflineLesson = {
  id: number;
  title: string;
  content: unknown;
  category: string;
  durationMinutes: number;
  cachedAt: number;
};

export type OfflineProgress = {
  lessonId: number;
  assignmentId: number;
  currentStep: number;
  progress: number;
  responses: unknown[];
  timeSpentSeconds: number;
  updatedAt: number;
};

let dbInstance: IDBPDatabase | null = null;

async function getDB(): Promise<IDBPDatabase> {
  if (dbInstance) return dbInstance;
  
  dbInstance = await openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Sync queue for deferred mutations
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        const syncStore = db.createObjectStore(SYNC_QUEUE_STORE, {
          keyPath: "id",
          autoIncrement: true,
        });
        syncStore.createIndex("status", "status");
        syncStore.createIndex("type", "type");
        syncStore.createIndex("createdAt", "createdAt");
      }
      
      // Cached lessons for offline access
      if (!db.objectStoreNames.contains(OFFLINE_LESSONS_STORE)) {
        db.createObjectStore(OFFLINE_LESSONS_STORE, { keyPath: "id" });
      }
      
      // Local progress tracking
      if (!db.objectStoreNames.contains(OFFLINE_PROGRESS_STORE)) {
        const progressStore = db.createObjectStore(OFFLINE_PROGRESS_STORE, {
          keyPath: "lessonId",
        });
        progressStore.createIndex("updatedAt", "updatedAt");
      }
    },
  });
  
  return dbInstance;
}

// ─── Sync Queue Operations ──────────────────────────────────────────

export async function enqueueSync(item: Omit<SyncQueueItem, "id" | "createdAt" | "retryCount" | "status">): Promise<number> {
  const db = await getDB();
  const entry: Omit<SyncQueueItem, "id"> = {
    ...item,
    createdAt: Date.now(),
    retryCount: 0,
    status: "pending",
  };
  return db.add(SYNC_QUEUE_STORE, entry) as Promise<number>;
}

export async function getPendingItems(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  const tx = db.transaction(SYNC_QUEUE_STORE, "readonly");
  const index = tx.store.index("status");
  return index.getAll("pending");
}

export async function getFailedItems(): Promise<SyncQueueItem[]> {
  const db = await getDB();
  const tx = db.transaction(SYNC_QUEUE_STORE, "readonly");
  const index = tx.store.index("status");
  return index.getAll("failed");
}

export async function updateSyncItem(id: number, updates: Partial<SyncQueueItem>): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(SYNC_QUEUE_STORE, "readwrite");
  const existing = await tx.store.get(id);
  if (existing) {
    await tx.store.put({ ...existing, ...updates });
  }
  await tx.done;
}

export async function removeSyncItem(id: number): Promise<void> {
  const db = await getDB();
  await db.delete(SYNC_QUEUE_STORE, id);
}

export async function getSyncQueueStats(): Promise<{
  pending: number;
  syncing: number;
  failed: number;
  total: number;
}> {
  const db = await getDB();
  const tx = db.transaction(SYNC_QUEUE_STORE, "readonly");
  const index = tx.store.index("status");
  const [pending, syncing, failed] = await Promise.all([
    index.count("pending"),
    index.count("syncing"),
    index.count("failed"),
  ]);
  return { pending, syncing, failed, total: pending + syncing + failed };
}

export async function clearSyncedItems(): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(SYNC_QUEUE_STORE, "readwrite");
  const index = tx.store.index("status");
  const syncedKeys = await index.getAllKeys("synced");
  for (const key of syncedKeys) {
    await tx.store.delete(key);
  }
  await tx.done;
}

// ─── Offline Lesson Cache ───────────────────────────────────────────

export async function cacheLesson(lesson: OfflineLesson): Promise<void> {
  const db = await getDB();
  await db.put(OFFLINE_LESSONS_STORE, { ...lesson, cachedAt: Date.now() });
}

export async function getCachedLesson(id: number): Promise<OfflineLesson | undefined> {
  const db = await getDB();
  return db.get(OFFLINE_LESSONS_STORE, id);
}

export async function getAllCachedLessons(): Promise<OfflineLesson[]> {
  const db = await getDB();
  return db.getAll(OFFLINE_LESSONS_STORE);
}

export async function removeCachedLesson(id: number): Promise<void> {
  const db = await getDB();
  await db.delete(OFFLINE_LESSONS_STORE, id);
}

// ─── Offline Progress Tracking ──────────────────────────────────────

export async function saveOfflineProgress(progress: OfflineProgress): Promise<void> {
  const db = await getDB();
  await db.put(OFFLINE_PROGRESS_STORE, { ...progress, updatedAt: Date.now() });
}

export async function getOfflineProgress(lessonId: number): Promise<OfflineProgress | undefined> {
  const db = await getDB();
  return db.get(OFFLINE_PROGRESS_STORE, lessonId);
}

export async function getAllOfflineProgress(): Promise<OfflineProgress[]> {
  const db = await getDB();
  return db.getAll(OFFLINE_PROGRESS_STORE);
}

export async function removeOfflineProgress(lessonId: number): Promise<void> {
  const db = await getDB();
  await db.delete(OFFLINE_PROGRESS_STORE, lessonId);
}

// ─── Cleanup ────────────────────────────────────────────────────────

export async function clearAllOfflineData(): Promise<void> {
  const db = await getDB();
  const tx1 = db.transaction(SYNC_QUEUE_STORE, "readwrite");
  await tx1.store.clear();
  await tx1.done;
  
  const tx2 = db.transaction(OFFLINE_LESSONS_STORE, "readwrite");
  await tx2.store.clear();
  await tx2.done;
  
  const tx3 = db.transaction(OFFLINE_PROGRESS_STORE, "readwrite");
  await tx3.store.clear();
  await tx3.done;
}
