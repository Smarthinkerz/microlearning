/**
 * Query Cache Service
 * 
 * In-memory LRU cache with TTL for frequently accessed data.
 * Reduces database load for hot paths like:
 * - Lesson listings
 * - Organization stats
 * - User profiles
 * - Leaderboard data
 */

// ─── Types ──────────────────────────────────────────────────────────

type CacheEntry<T> = {
  value: T;
  expiresAt: number;
  accessCount: number;
  lastAccessed: number;
};

// ─── LRU Cache Implementation ───────────────────────────────────────

class QueryCache {
  private cache: Map<string, CacheEntry<any>> = new Map();
  private maxSize: number;
  private defaultTTL: number;
  private hits = 0;
  private misses = 0;

  constructor(maxSize = 500, defaultTTLMs = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTLMs;

    // Periodic cleanup every 5 minutes
    setInterval(() => this.evictExpired(), 5 * 60 * 1000);
  }

  /**
   * Get a cached value by key.
   */
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) {
      this.misses++;
      return undefined;
    }

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      this.misses++;
      return undefined;
    }

    entry.accessCount++;
    entry.lastAccessed = Date.now();
    this.hits++;
    return entry.value as T;
  }

  /**
   * Set a cached value with optional TTL.
   */
  set<T>(key: string, value: T, ttlMs?: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttlMs || this.defaultTTL),
      accessCount: 0,
      lastAccessed: Date.now(),
    });
  }

  /**
   * Get or set: if key exists and is valid, return cached value.
   * Otherwise, execute the factory function and cache the result.
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttlMs?: number): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) return cached;

    const value = await factory();
    this.set(key, value, ttlMs);
    return value;
  }

  /**
   * Invalidate a specific key.
   */
  invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Invalidate all keys matching a prefix.
   */
  invalidatePrefix(prefix: string): number {
    let count = 0;
    for (const key of Array.from(this.cache.keys())) {
      if (key.startsWith(prefix)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Clear the entire cache.
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics.
   */
  getStats(): {
    size: number;
    maxSize: number;
    hits: number;
    misses: number;
    hitRate: number;
    memoryEstimate: string;
  } {
    const total = this.hits + this.misses;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? Math.round((this.hits / total) * 100) : 0,
      memoryEstimate: `~${Math.round(this.cache.size * 2)}KB`, // rough estimate
    };
  }

  /**
   * Evict the least recently used entry.
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (entry.lastAccessed < oldestTime) {
        oldestTime = entry.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Remove all expired entries.
   */
  private evictExpired(): void {
    const now = Date.now();
    let evicted = 0;
    for (const [key, entry] of Array.from(this.cache.entries())) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        evicted++;
      }
    }
    if (evicted > 0) {
      console.log(`[QueryCache] Evicted ${evicted} expired entries`);
    }
  }
}

// ─── Singleton Instances ────────────────────────────────────────────

/** Short-lived cache for frequently changing data (30s TTL) */
export const hotCache = new QueryCache(200, 30 * 1000);

/** Medium-lived cache for semi-static data (5min TTL) */
export const warmCache = new QueryCache(500, 5 * 60 * 1000);

/** Long-lived cache for rarely changing data (30min TTL) */
export const coldCache = new QueryCache(100, 30 * 60 * 1000);

// ─── Cache Key Helpers ──────────────────────────────────────────────

export const cacheKeys = {
  orgStats: (orgId: number) => `org:${orgId}:stats`,
  orgLessons: (orgId: number) => `org:${orgId}:lessons`,
  userProfile: (userId: number) => `user:${userId}:profile`,
  leaderboard: (orgId: number) => `org:${orgId}:leaderboard`,
  publishedLessons: () => `lessons:published`,
  categories: () => `lessons:categories`,
  plans: () => `plans:all`,
  benchmarks: (orgId: number) => `org:${orgId}:benchmarks`,
};
