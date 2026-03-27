import { useState, useEffect, useCallback } from "react";

const DB_NAME = "MicroLearningCoach";
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains("offlineProgress")) {
        db.createObjectStore("offlineProgress", { keyPath: "id", autoIncrement: true });
      }
      if (!db.objectStoreNames.contains("offlineLessons")) {
        db.createObjectStore("offlineLessons", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const saveLessonOffline = useCallback(async (lesson: any) => {
    try {
      const db = await openDB();
      const tx = db.transaction("offlineLessons", "readwrite");
      tx.objectStore("offlineLessons").put(lesson);
      return true;
    } catch (e) {
      console.error("Failed to save lesson offline:", e);
      return false;
    }
  }, []);

  const getOfflineLesson = useCallback(async (id: number) => {
    try {
      const db = await openDB();
      const tx = db.transaction("offlineLessons", "readonly");
      return new Promise<any>((resolve, reject) => {
        const request = tx.objectStore("offlineLessons").get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      return null;
    }
  }, []);

  const getAllOfflineLessons = useCallback(async () => {
    try {
      const db = await openDB();
      const tx = db.transaction("offlineLessons", "readonly");
      return new Promise<any[]>((resolve, reject) => {
        const request = tx.objectStore("offlineLessons").getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      return [];
    }
  }, []);

  const saveProgressOffline = useCallback(async (data: any) => {
    try {
      const db = await openDB();
      const tx = db.transaction("offlineProgress", "readwrite");
      tx.objectStore("offlineProgress").add({ data, timestamp: Date.now() });
      // Request background sync
      if ("serviceWorker" in navigator && "SyncManager" in window) {
        const reg = await navigator.serviceWorker.ready;
        await (reg as any).sync.register("sync-progress");
      }
      return true;
    } catch (e) {
      console.error("Failed to save progress offline:", e);
      return false;
    }
  }, []);

  const removeOfflineLesson = useCallback(async (id: number) => {
    try {
      const db = await openDB();
      const tx = db.transaction("offlineLessons", "readwrite");
      tx.objectStore("offlineLessons").delete(id);
      return true;
    } catch (e) {
      return false;
    }
  }, []);

  return {
    isOnline,
    saveLessonOffline,
    getOfflineLesson,
    getAllOfflineLessons,
    saveProgressOffline,
    removeOfflineLesson,
  };
}

// Register service worker
export function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("SW registered:", reg.scope);
        })
        .catch((err) => {
          console.log("SW registration failed:", err);
        });
    });
  }
}

// Request push notification permission
export async function requestPushPermission() {
  if (!("Notification" in window)) return false;
  const permission = await Notification.requestPermission();
  return permission === "granted";
}
