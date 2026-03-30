/**
 * Offline Sync Router
 * 
 * Handles batch sync of offline-queued mutations.
 * Accepts arrays of lesson attempts, progress updates, and status changes
 * that were queued while the user was offline.
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import * as db from "../db";

const attemptSubmitSchema = z.object({
  assignmentId: z.number(),
  lessonId: z.number(),
  startedAt: z.number(),
  completedAt: z.number().optional(),
  timeSpentSeconds: z.number(),
  score: z.number().optional(),
  maxScore: z.number().optional(),
  passed: z.boolean().optional(),
  responses: z.array(z.object({
    questionId: z.string(),
    answer: z.union([z.string(), z.array(z.string())]),
    isCorrect: z.boolean().optional(),
    timeSpentSeconds: z.number().optional(),
  })).optional(),
  progress: z.number(),
  currentStep: z.number(),
  status: z.enum(["in_progress", "completed", "abandoned"]),
  clientTimestamp: z.number(),
});

const progressUpdateSchema = z.object({
  assignmentId: z.number(),
  lessonId: z.number(),
  currentStep: z.number(),
  progress: z.number(),
  timeSpentSeconds: z.number(),
  responses: z.array(z.object({
    questionId: z.string(),
    answer: z.union([z.string(), z.array(z.string())]),
    isCorrect: z.boolean().optional(),
    timeSpentSeconds: z.number().optional(),
  })).optional(),
  clientTimestamp: z.number(),
});

const assignmentStatusSchema = z.object({
  assignmentId: z.number(),
  status: z.enum(["pending", "available", "in_progress", "completed", "expired", "skipped"]),
  clientTimestamp: z.number(),
});

export const offlineSyncRouter = router({
  /**
   * Batch sync endpoint: processes multiple offline-queued items at once.
   * Uses conflict resolution based on clientTimestamp vs serverTimestamp.
   */
  batchSync: protectedProcedure
    .input(z.object({
      attempts: z.array(attemptSubmitSchema).optional(),
      progressUpdates: z.array(progressUpdateSchema).optional(),
      assignmentStatuses: z.array(assignmentStatusSchema).optional(),
      notificationReads: z.array(z.number()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const results = {
        attempts: { synced: 0, conflicts: 0, errors: 0 },
        progress: { synced: 0, conflicts: 0, errors: 0 },
        assignments: { synced: 0, conflicts: 0, errors: 0 },
        notifications: { synced: 0, errors: 0 },
      };

      // Process attempt submissions
      if (input.attempts?.length) {
        for (const attempt of input.attempts) {
          try {
            // Check for existing attempt with conflict resolution
            const existing = await db.getAttemptByAssignmentAndUser(
              attempt.assignmentId,
              ctx.user.id
            );

            if (existing && existing.serverTimestamp && existing.serverTimestamp > attempt.clientTimestamp) {
              // Server version is newer — conflict
              results.attempts.conflicts++;
              continue;
            }

            if (existing) {
              // Update existing attempt
              await db.updateAttempt(existing.id, {
                ...attempt,
                userId: ctx.user.id,
                orgId: ctx.user.orgId || 0,
                serverTimestamp: Date.now(),
                syncStatus: "synced",
              });
            } else {
              // Create new attempt
              await db.createAttempt({
                ...attempt,
                userId: ctx.user.id,
                orgId: ctx.user.orgId || 0,
                serverTimestamp: Date.now(),
                syncStatus: "synced",
              });
            }
            results.attempts.synced++;
          } catch {
            results.attempts.errors++;
          }
        }
      }

      // Process progress updates
      if (input.progressUpdates?.length) {
        for (const update of input.progressUpdates) {
          try {
            const existing = await db.getAttemptByAssignmentAndUser(
              update.assignmentId,
              ctx.user.id
            );

            if (existing) {
              if (existing.serverTimestamp && existing.serverTimestamp > update.clientTimestamp) {
                results.progress.conflicts++;
                continue;
              }
              await db.updateAttempt(existing.id, {
                currentStep: update.currentStep,
                progress: update.progress,
                timeSpentSeconds: update.timeSpentSeconds,
                responses: update.responses,
                serverTimestamp: Date.now(),
                syncStatus: "synced",
              });
              results.progress.synced++;
            } else {
              results.progress.errors++;
            }
          } catch {
            results.progress.errors++;
          }
        }
      }

      // Process assignment status changes
      if (input.assignmentStatuses?.length) {
        for (const statusUpdate of input.assignmentStatuses) {
          try {
            await db.updateAssignmentStatus(
              statusUpdate.assignmentId,
              statusUpdate.status,
              statusUpdate.status === "completed" ? Date.now() : undefined
            );
            results.assignments.synced++;
          } catch {
            results.assignments.errors++;
          }
        }
      }

      // Process notification reads
      if (input.notificationReads?.length) {
        for (const notifId of input.notificationReads) {
          try {
            await db.markNotificationRead(notifId);
            results.notifications.synced++;
          } catch {
            results.notifications.errors++;
          }
        }
      }

      return {
        success: true,
        results,
        syncedAt: Date.now(),
      };
    }),

  /**
   * Get server state for conflict resolution.
   * Client sends list of assignment IDs, server returns latest timestamps.
   */
  getServerState: protectedProcedure
    .input(z.object({
      assignmentIds: z.array(z.number()),
    }))
    .query(async ({ ctx, input }) => {
      const states: Record<number, { serverTimestamp: number | null; status: string }> = {};
      
      for (const assignmentId of input.assignmentIds) {
        const attempt = await db.getAttemptByAssignmentAndUser(assignmentId, ctx.user.id);
        if (attempt) {
          states[assignmentId] = {
            serverTimestamp: attempt.serverTimestamp ?? null,
            status: attempt.status ?? "in_progress",
          };
        }
      }

      return states;
    }),
});
