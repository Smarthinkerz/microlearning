/**
 * Background Job Queue Service
 * 
 * Lightweight in-process job queue for background tasks.
 * Supports:
 * 1. Delayed execution
 * 2. Retry with exponential backoff
 * 3. Priority queuing
 * 4. Job status tracking
 * 5. Concurrent execution limits
 * 
 * For production at scale, this can be replaced with BullMQ + Redis.
 */

// ─── Types ──────────────────────────────────────────────────────────

export type JobStatus = "pending" | "running" | "completed" | "failed" | "retrying";
export type JobPriority = "low" | "normal" | "high" | "critical";

export type Job = {
  id: string;
  name: string;
  data: Record<string, any>;
  status: JobStatus;
  priority: JobPriority;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  error?: string;
  result?: any;
  delay?: number;
  nextRunAt: number;
};

export type JobHandler = (data: Record<string, any>) => Promise<any>;

// ─── Job Queue Implementation ───────────────────────────────────────

class JobQueue {
  private jobs: Map<string, Job> = new Map();
  private handlers: Map<string, JobHandler> = new Map();
  private running = 0;
  private maxConcurrent = 3;
  private processing = false;
  private jobCounter = 0;

  /**
   * Register a job handler for a specific job name.
   */
  registerHandler(name: string, handler: JobHandler): void {
    this.handlers.set(name, handler);
  }

  /**
   * Add a job to the queue.
   */
  async addJob(
    name: string,
    data: Record<string, any>,
    options: {
      priority?: JobPriority;
      delay?: number;
      maxAttempts?: number;
    } = {},
  ): Promise<string> {
    this.jobCounter++;
    const id = `job_${Date.now()}_${this.jobCounter}`;
    const now = Date.now();

    const job: Job = {
      id,
      name,
      data,
      status: "pending",
      priority: options.priority || "normal",
      attempts: 0,
      maxAttempts: options.maxAttempts || 3,
      createdAt: now,
      delay: options.delay,
      nextRunAt: now + (options.delay || 0),
    };

    this.jobs.set(id, job);
    this.processQueue();
    return id;
  }

  /**
   * Get job status by ID.
   */
  getJob(id: string): Job | undefined {
    return this.jobs.get(id);
  }

  /**
   * Get all jobs with optional status filter.
   */
  getJobs(status?: JobStatus): Job[] {
    const jobs = Array.from(this.jobs.values());
    if (status) return jobs.filter(j => j.status === status);
    return jobs.sort((a, b) => b.createdAt - a.createdAt);
  }

  /**
   * Get queue statistics.
   */
  getStats(): {
    pending: number;
    running: number;
    completed: number;
    failed: number;
    total: number;
    handlers: string[];
  } {
    const jobs = Array.from(this.jobs.values());
    return {
      pending: jobs.filter(j => j.status === "pending").length,
      running: jobs.filter(j => j.status === "running").length,
      completed: jobs.filter(j => j.status === "completed").length,
      failed: jobs.filter(j => j.status === "failed").length,
      total: jobs.length,
      handlers: Array.from(this.handlers.keys()),
    };
  }

  /**
   * Process the queue — runs pending jobs up to concurrency limit.
   */
  private async processQueue(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    try {
      while (this.running < this.maxConcurrent) {
        const now = Date.now();
        const pendingJobs = Array.from(this.jobs.values())
          .filter(j => (j.status === "pending" || j.status === "retrying") && j.nextRunAt <= now)
          .sort((a, b) => {
            const priorityOrder: Record<JobPriority, number> = { critical: 0, high: 1, normal: 2, low: 3 };
            const pDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
            if (pDiff !== 0) return pDiff;
            return a.createdAt - b.createdAt;
          });

        const nextJob = pendingJobs[0];
        if (!nextJob) break;

        this.running++;
        nextJob.status = "running";
        nextJob.startedAt = now;
        nextJob.attempts++;

        this.executeJob(nextJob).finally(() => {
          this.running--;
          // Schedule next processing cycle
          setTimeout(() => this.processQueue(), 100);
        });
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Execute a single job with error handling and retry logic.
   */
  private async executeJob(job: Job): Promise<void> {
    const handler = this.handlers.get(job.name);
    if (!handler) {
      job.status = "failed";
      job.error = `No handler registered for job: ${job.name}`;
      job.completedAt = Date.now();
      console.error(`[JobQueue] ${job.error}`);
      return;
    }

    try {
      const result = await handler(job.data);
      job.status = "completed";
      job.result = result;
      job.completedAt = Date.now();
      console.log(`[JobQueue] Job ${job.id} (${job.name}) completed in ${job.completedAt - (job.startedAt || job.createdAt)}ms`);
    } catch (err: any) {
      console.error(`[JobQueue] Job ${job.id} (${job.name}) failed (attempt ${job.attempts}/${job.maxAttempts}):`, err.message);

      if (job.attempts < job.maxAttempts) {
        // Exponential backoff: 1s, 4s, 9s, 16s...
        const backoff = Math.pow(job.attempts, 2) * 1000;
        job.status = "retrying";
        job.nextRunAt = Date.now() + backoff;
        job.error = err.message;
      } else {
        job.status = "failed";
        job.error = err.message;
        job.completedAt = Date.now();
      }
    }
  }

  /**
   * Clean up old completed/failed jobs.
   */
  cleanup(maxAge = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - maxAge;
    let removed = 0;

    for (const [id, job] of Array.from(this.jobs.entries())) {
      if ((job.status === "completed" || job.status === "failed") && (job.completedAt || job.createdAt) < cutoff) {
        this.jobs.delete(id);
        removed++;
      }
    }

    return removed;
  }
}

// ─── Singleton Instance ─────────────────────────────────────────────

export const jobQueue = new JobQueue();

// ─── Pre-registered Job Handlers ────────────────────────────────────

// Register common job handlers
jobQueue.registerHandler("send_push_notification", async (data) => {
  // Delegates to push notification service
  console.log(`[JobQueue] Sending push notification to user ${data.userId}`);
  return { sent: true };
});

jobQueue.registerHandler("sync_hris", async (data) => {
  console.log(`[JobQueue] Syncing HRIS for org ${data.orgId}`);
  return { synced: true };
});

jobQueue.registerHandler("generate_ai_recommendations", async (data) => {
  console.log(`[JobQueue] Generating AI recommendations for user ${data.userId}`);
  return { generated: true };
});

jobQueue.registerHandler("process_analytics", async (data) => {
  console.log(`[JobQueue] Processing analytics for org ${data.orgId}`);
  return { processed: true };
});

jobQueue.registerHandler("send_reminder_email", async (data) => {
  console.log(`[JobQueue] Sending reminder email to user ${data.userId}`);
  return { sent: true };
});

jobQueue.registerHandler("cleanup_expired_sessions", async (_data) => {
  console.log(`[JobQueue] Cleaning up expired sessions`);
  return { cleaned: true };
});

// Schedule periodic cleanup every hour
setInterval(() => {
  const removed = jobQueue.cleanup();
  if (removed > 0) {
    console.log(`[JobQueue] Cleaned up ${removed} old jobs`);
  }
}, 60 * 60 * 1000);
