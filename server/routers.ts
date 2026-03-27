import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, adminProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "./db";
import { invokeLLM } from "./_core/llm";

// ─── Role middleware ─────────────────────────────────────────────────
const employerAdminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!["employer_admin", "super_admin"].includes(ctx.user.appRole)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Employer admin access required" });
  }
  return next({ ctx });
});

const contentAuthorProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (!["content_author", "employer_admin", "super_admin"].includes(ctx.user.appRole)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Content author access required" });
  }
  return next({ ctx });
});

// ─── Organization Router ─────────────────────────────────────────────
const orgRouter = router({
  list: adminProcedure.query(async () => {
    return db.getAllOrganizations();
  }),
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getOrganizationById(input.id);
  }),
  getMine: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.user.orgId) return null;
    return db.getOrganizationById(ctx.user.orgId);
  }),
  create: adminProcedure.input(z.object({
    name: z.string().min(1).max(255),
    slug: z.string().min(1).max(128),
    industry: z.string().optional(),
    maxUsers: z.number().optional(),
  })).mutation(async ({ input }) => {
    const existing = await db.getOrganizationBySlug(input.slug);
    if (existing) throw new TRPCError({ code: "CONFLICT", message: "Organization slug already exists" });
    return db.createOrganization(input);
  }),
  update: employerAdminProcedure.input(z.object({
    id: z.number(),
    name: z.string().optional(),
    industry: z.string().optional(),
    maxUsers: z.number().optional(),
    isActive: z.boolean().optional(),
  })).mutation(async ({ input, ctx }) => {
    const { id, ...data } = input;
    if (ctx.user.appRole !== "super_admin" && ctx.user.orgId !== id) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    await db.updateOrganization(id, data);
    return { success: true };
  }),
  getStats: employerAdminProcedure.input(z.object({ orgId: z.number() })).query(async ({ input, ctx }) => {
    if (ctx.user.appRole !== "super_admin" && ctx.user.orgId !== input.orgId) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return db.getOrgStats(input.orgId);
  }),
  getMembers: employerAdminProcedure.input(z.object({ orgId: z.number() })).query(async ({ input, ctx }) => {
    if (ctx.user.appRole !== "super_admin" && ctx.user.orgId !== input.orgId) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return db.getUsersByOrg(input.orgId);
  }),
});

// ─── User Management Router ─────────────────────────────────────────
const userRouter = router({
  updateProfile: protectedProcedure.input(z.object({
    timezone: z.string().optional(),
    notificationPreferences: z.object({
      email: z.boolean(),
      push: z.boolean(),
      inApp: z.boolean(),
      quietHoursStart: z.string().optional(),
      quietHoursEnd: z.string().optional(),
    }).optional(),
  })).mutation(async ({ input, ctx }) => {
    await db.updateUser(ctx.user.id, input);
    return { success: true };
  }),
  setRole: adminProcedure.input(z.object({
    userId: z.number(),
    appRole: z.enum(["learner", "employer_admin", "content_author", "super_admin"]),
  })).mutation(async ({ input }) => {
    await db.updateUser(input.userId, { appRole: input.appRole });
    return { success: true };
  }),
  setOrg: adminProcedure.input(z.object({
    userId: z.number(),
    orgId: z.number(),
  })).mutation(async ({ input }) => {
    await db.updateUser(input.userId, { orgId: input.orgId });
    return { success: true };
  }),
  getMyStats: protectedProcedure.query(async ({ ctx }) => {
    return db.getLearnerStats(ctx.user.id);
  }),
});

// ─── Shift Router ────────────────────────────────────────────────────
const shiftRouter = router({
  create: protectedProcedure.input(z.object({
    userId: z.number(),
    orgId: z.number(),
    title: z.string().optional(),
    startTime: z.number(),
    endTime: z.number(),
    breakStartTime: z.number().optional(),
    breakEndTime: z.number().optional(),
    shiftType: z.enum(["morning", "afternoon", "night", "split", "custom"]).optional(),
    location: z.string().optional(),
    isRecurring: z.boolean().optional(),
    recurrenceRule: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    return db.createShift({ ...input, source: "manual" });
  }),
  getMyShifts: protectedProcedure.input(z.object({
    startRange: z.number().optional(),
    endRange: z.number().optional(),
  }).optional()).query(async ({ ctx, input }) => {
    return db.getShiftsByUser(ctx.user.id, input?.startRange, input?.endRange);
  }),
  getByOrg: employerAdminProcedure.input(z.object({
    orgId: z.number(),
    startRange: z.number().optional(),
    endRange: z.number().optional(),
  })).query(async ({ input, ctx }) => {
    if (ctx.user.appRole !== "super_admin" && ctx.user.orgId !== input.orgId) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return db.getShiftsByOrg(input.orgId, input.startRange, input.endRange);
  }),
  update: protectedProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    startTime: z.number().optional(),
    endTime: z.number().optional(),
    breakStartTime: z.number().optional(),
    breakEndTime: z.number().optional(),
    shiftType: z.enum(["morning", "afternoon", "night", "split", "custom"]).optional(),
    location: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateShift(id, data);
    return { success: true };
  }),
  delete: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteShift(input.id);
    return { success: true };
  }),
  bulkCreate: employerAdminProcedure.input(z.object({
    shifts: z.array(z.object({
      userId: z.number(),
      orgId: z.number(),
      title: z.string().optional(),
      startTime: z.number(),
      endTime: z.number(),
      breakStartTime: z.number().optional(),
      breakEndTime: z.number().optional(),
      shiftType: z.enum(["morning", "afternoon", "night", "split", "custom"]).optional(),
      location: z.string().optional(),
    })),
  })).mutation(async ({ input }) => {
    await db.bulkCreateShifts(input.shifts.map(s => ({ ...s, source: "manual" as const })));
    return { success: true };
  }),
});

// ─── Lesson Router ───────────────────────────────────────────────────
const lessonRouter = router({
  create: contentAuthorProcedure.input(z.object({
    orgId: z.number(),
    title: z.string().min(1).max(500),
    description: z.string().optional(),
    content: z.any().optional(),
    contentType: z.enum(["video", "quiz", "scenario", "assessment", "mixed", "article"]).optional(),
    durationMinutes: z.number().min(1).max(60).optional(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    language: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    return db.createLesson({ ...input, authorId: ctx.user.id, status: "draft" });
  }),
  getById: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getLessonById(input.id);
  }),
  getByOrg: protectedProcedure.input(z.object({
    orgId: z.number(),
    status: z.string().optional(),
  })).query(async ({ input }) => {
    return db.getLessonsByOrg(input.orgId, input.status);
  }),
  update: contentAuthorProcedure.input(z.object({
    id: z.number(),
    title: z.string().optional(),
    description: z.string().optional(),
    content: z.any().optional(),
    contentType: z.enum(["video", "quiz", "scenario", "assessment", "mixed", "article"]).optional(),
    durationMinutes: z.number().optional(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(["draft", "in_review", "published", "archived"]).optional(),
    reviewNotes: z.string().optional(),
    language: z.string().optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    if (data.status === "published") {
      (data as any).publishedAt = new Date();
    }
    await db.updateLesson(id, data);
    return { success: true };
  }),
  delete: contentAuthorProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteLesson(input.id);
    return { success: true };
  }),
  submitForReview: contentAuthorProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.updateLesson(input.id, { status: "in_review" });
    return { success: true };
  }),
  getReviewQueue: employerAdminProcedure.input(z.object({ orgId: z.number() })).query(async ({ input }) => {
    return db.getLessonsInReview(input.orgId);
  }),
  approveLesson: employerAdminProcedure.input(z.object({
    id: z.number(),
    reviewNotes: z.string().optional(),
  })).mutation(async ({ input, ctx }) => {
    await db.updateLesson(input.id, {
      status: "published",
      reviewerId: ctx.user.id,
      reviewNotes: input.reviewNotes,
      publishedAt: new Date(),
    });
    return { success: true };
  }),
  rejectLesson: employerAdminProcedure.input(z.object({
    id: z.number(),
    reviewNotes: z.string(),
  })).mutation(async ({ input, ctx }) => {
    await db.updateLesson(input.id, {
      status: "draft",
      reviewerId: ctx.user.id,
      reviewNotes: input.reviewNotes,
    });
    return { success: true };
  }),
});

// ─── Assignment Router ───────────────────────────────────────────────
const assignmentRouter = router({
  create: employerAdminProcedure.input(z.object({
    lessonId: z.number(),
    userId: z.number(),
    orgId: z.number(),
    priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
    dueDate: z.number().optional(),
    isScheduleAware: z.boolean().optional(),
  })).mutation(async ({ input, ctx }) => {
    let scheduledStartTime: number | undefined;
    let scheduledEndTime: number | undefined;

    if (input.isScheduleAware !== false) {
      const now = Date.now();
      const weekFromNow = now + 7 * 24 * 60 * 60 * 1000;
      const userShifts = await db.getShiftsByUser(input.userId, now, weekFromNow);
      const lesson = await db.getLessonById(input.lessonId);
      const durationMs = (lesson?.durationMinutes ?? 5) * 60 * 1000;

      const freeSlot = findFreeSlot(userShifts, now, weekFromNow, durationMs);
      if (freeSlot) {
        scheduledStartTime = freeSlot.start;
        scheduledEndTime = freeSlot.end;
      }
    }

    return db.createAssignment({
      ...input,
      assignedBy: ctx.user.id,
      status: "pending",
      scheduledStartTime,
      scheduledEndTime,
    });
  }),
  bulkCreate: employerAdminProcedure.input(z.object({
    lessonId: z.number(),
    userIds: z.array(z.number()),
    orgId: z.number(),
    priority: z.enum(["low", "normal", "high", "urgent"]).optional(),
    dueDate: z.number().optional(),
    isScheduleAware: z.boolean().optional(),
  })).mutation(async ({ input, ctx }) => {
    const assignments = input.userIds.map(userId => ({
      lessonId: input.lessonId,
      userId,
      orgId: input.orgId,
      assignedBy: ctx.user.id,
      status: "pending" as const,
      priority: input.priority,
      dueDate: input.dueDate,
      isScheduleAware: input.isScheduleAware,
    }));
    await db.bulkCreateAssignments(assignments);
    return { success: true, count: assignments.length };
  }),
  getMyAssignments: protectedProcedure.input(z.object({
    status: z.string().optional(),
  }).optional()).query(async ({ ctx, input }) => {
    return db.getAssignmentsByUser(ctx.user.id, input?.status);
  }),
  getByOrg: employerAdminProcedure.input(z.object({ orgId: z.number() })).query(async ({ input }) => {
    return db.getAssignmentsByOrg(input.orgId);
  }),
  updateStatus: protectedProcedure.input(z.object({
    id: z.number(),
    status: z.enum(["pending", "available", "in_progress", "completed", "expired", "skipped"]),
  })).mutation(async ({ input }) => {
    const data: any = { status: input.status };
    if (input.status === "completed") data.completedAt = Date.now();
    await db.updateAssignment(input.id, data);
    return { success: true };
  }),
  getWithLesson: protectedProcedure.input(z.object({ id: z.number() })).query(async ({ input }) => {
    return db.getAssignmentWithLesson(input.id);
  }),
});

// ─── Attempt Router ──────────────────────────────────────────────────
const attemptRouter = router({
  start: protectedProcedure.input(z.object({
    assignmentId: z.number(),
    lessonId: z.number(),
  })).mutation(async ({ input, ctx }) => {
    await db.updateAssignment(input.assignmentId, { status: "in_progress" });
    return db.createAttempt({
      assignmentId: input.assignmentId,
      userId: ctx.user.id,
      lessonId: input.lessonId,
      orgId: ctx.user.orgId ?? 0,
      startedAt: Date.now(),
      status: "in_progress",
      syncStatus: "synced",
    });
  }),
  updateProgress: protectedProcedure.input(z.object({
    id: z.number(),
    progress: z.number().min(0).max(100),
    currentStep: z.number().optional(),
    timeSpentSeconds: z.number().optional(),
    responses: z.array(z.object({
      questionId: z.string(),
      answer: z.union([z.string(), z.array(z.string())]),
      isCorrect: z.boolean().optional(),
      timeSpentSeconds: z.number().optional(),
    })).optional(),
  })).mutation(async ({ input }) => {
    const { id, ...data } = input;
    await db.updateAttempt(id, data);
    return { success: true };
  }),
  complete: protectedProcedure.input(z.object({
    id: z.number(),
    assignmentId: z.number(),
    score: z.number().optional(),
    maxScore: z.number().optional(),
    passed: z.boolean().optional(),
    responses: z.array(z.object({
      questionId: z.string(),
      answer: z.union([z.string(), z.array(z.string())]),
      isCorrect: z.boolean().optional(),
      timeSpentSeconds: z.number().optional(),
    })).optional(),
    timeSpentSeconds: z.number().optional(),
  })).mutation(async ({ input }) => {
    const { id, assignmentId, ...data } = input;
    await db.updateAttempt(id, {
      ...data,
      completedAt: Date.now(),
      progress: 100,
      status: "completed",
    });
    await db.updateAssignment(assignmentId, {
      status: "completed",
      completedAt: Date.now(),
    });
    return { success: true };
  }),
  syncOffline: protectedProcedure.input(z.object({
    attempts: z.array(z.object({
      assignmentId: z.number(),
      lessonId: z.number(),
      startedAt: z.number(),
      completedAt: z.number().optional(),
      timeSpentSeconds: z.number().optional(),
      score: z.number().optional(),
      maxScore: z.number().optional(),
      passed: z.boolean().optional(),
      responses: z.any().optional(),
      progress: z.number().optional(),
      currentStep: z.number().optional(),
      clientTimestamp: z.number(),
    })),
  })).mutation(async ({ input, ctx }) => {
    const results = [];
    for (const attempt of input.attempts) {
      const created = await db.createAttempt({
        ...attempt,
        userId: ctx.user.id,
        orgId: ctx.user.orgId ?? 0,
        status: attempt.completedAt ? "completed" : "in_progress",
        syncStatus: "synced",
        serverTimestamp: Date.now(),
      });
      if (attempt.completedAt) {
        await db.updateAssignment(attempt.assignmentId, {
          status: "completed",
          completedAt: attempt.completedAt,
        });
      }
      results.push(created);
    }
    return { success: true, synced: results.length };
  }),
  getByUser: protectedProcedure.query(async ({ ctx }) => {
    return db.getAttemptsByUser(ctx.user.id);
  }),
});

// ─── Notification Router ─────────────────────────────────────────────
const notificationRouter = router({
  getMyNotifications: protectedProcedure.input(z.object({
    unreadOnly: z.boolean().optional(),
  }).optional()).query(async ({ ctx, input }) => {
    return db.getNotificationsByUser(ctx.user.id, input?.unreadOnly);
  }),
  markRead: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.markNotificationRead(input.id);
    return { success: true };
  }),
  markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
    await db.markAllNotificationsRead(ctx.user.id);
    return { success: true };
  }),
  deleteNotification: protectedProcedure.input(z.object({ id: z.number() })).mutation(async ({ input }) => {
    await db.deleteNotification(input.id);
    return { success: true };
  }),
});

// ─── Certificate Router ──────────────────────────────────────────────
const certificateRouter = router({
  getMyCertificates: protectedProcedure.query(async ({ ctx }) => {
    return db.getCertificatesByUser(ctx.user.id);
  }),
});

// ─── Audit Log Router ────────────────────────────────────────────────
const auditRouter = router({
  getByOrg: employerAdminProcedure.input(z.object({
    orgId: z.number(),
    limit: z.number().optional(),
  })).query(async ({ input, ctx }) => {
    if (ctx.user.appRole !== "super_admin" && ctx.user.orgId !== input.orgId) {
      throw new TRPCError({ code: "FORBIDDEN" });
    }
    return db.getAuditLogs(input.orgId, input.limit);
  }),
});

// ─── AI Router ───────────────────────────────────────────────────────
const aiRouter = router({
  generateLesson: contentAuthorProcedure.input(z.object({
    topic: z.string().min(1),
    industry: z.string().optional(),
    difficulty: z.enum(["beginner", "intermediate", "advanced"]).optional(),
    durationMinutes: z.number().min(1).max(30).optional(),
    contentType: z.enum(["quiz", "scenario", "article", "mixed"]).optional(),
    language: z.string().optional(),
  })).mutation(async ({ input }) => {
    const prompt = `Generate a micro-learning lesson for shift workers.
Topic: ${input.topic}
Industry: ${input.industry || "general"}
Difficulty: ${input.difficulty || "beginner"}
Duration: ${input.durationMinutes || 5} minutes
Content Type: ${input.contentType || "mixed"}
Language: ${input.language || "English"}

Create a structured lesson with:
1. A compelling title
2. A brief description (2-3 sentences)
3. Content blocks including text explanations and key takeaways
4. 3-5 quiz questions with multiple choice answers
5. Practical tips relevant to shift workers

Return as JSON with this structure:
{
  "title": "string",
  "description": "string",
  "durationMinutes": number,
  "blocks": [{ "id": "string", "type": "text|quiz|image", "data": {...}, "order": number }],
  "quizQuestions": [{ "id": "string", "question": "string", "type": "multiple_choice", "options": [{ "id": "string", "text": "string", "isCorrect": boolean }], "explanation": "string", "points": number }],
  "passingScore": number
}`;

    const result = await invokeLLM({
      messages: [
        { role: "system", content: "You are an expert instructional designer specializing in micro-learning content for shift workers. Always return valid JSON." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
    });

    const content = result.choices[0]?.message?.content;
    try {
      const parsed = JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
      return parsed;
    } catch {
      return { error: "Failed to parse AI response", raw: content };
    }
  }),
  translateLesson: contentAuthorProcedure.input(z.object({
    lessonId: z.number(),
    targetLanguage: z.string(),
  })).mutation(async ({ input }) => {
    const lesson = await db.getLessonById(input.lessonId);
    if (!lesson) throw new TRPCError({ code: "NOT_FOUND" });

    const result = await invokeLLM({
      messages: [
        { role: "system", content: `You are a professional translator. Translate the following lesson content to ${input.targetLanguage}. Maintain the exact same JSON structure. Only translate text content, not keys or IDs.` },
        { role: "user", content: JSON.stringify({ title: lesson.title, description: lesson.description, content: lesson.content }) },
      ],
      response_format: { type: "json_object" },
    });

    const content = result.choices[0]?.message?.content;
    try {
      return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
    } catch {
      return { error: "Translation failed" };
    }
  }),
  suggestLessons: protectedProcedure.input(z.object({
    orgId: z.number(),
  })).query(async ({ ctx, input }) => {
    const stats = await db.getLearnerStats(ctx.user.id);
    const result = await invokeLLM({
      messages: [
        { role: "system", content: "You are a learning recommendation engine. Based on the learner's stats, suggest 3 lesson topics. Return JSON array of objects with 'topic', 'reason', and 'difficulty'." },
        { role: "user", content: `Learner stats: ${JSON.stringify(stats)}. Suggest personalized micro-learning topics.` },
      ],
      response_format: { type: "json_object" },
    });
    const content = result.choices[0]?.message?.content;
    try {
      return JSON.parse(typeof content === "string" ? content : JSON.stringify(content));
    } catch {
      return { suggestions: [] };
    }
  }),
});

// ─── SCORM/xAPI Export Router ────────────────────────────────────────
const complianceRouter = router({
  exportXapi: employerAdminProcedure.input(z.object({
    lessonId: z.number(),
    userId: z.number().optional(),
  })).query(async ({ input }) => {
    const lesson = await db.getLessonById(input.lessonId);
    if (!lesson) throw new TRPCError({ code: "NOT_FOUND" });

    const xapiStatements = [];
    if (input.userId) {
      const attempts = await db.getAttemptsByUser(input.userId);
      const lessonAttempts = attempts.filter(a => a.lessonId === input.lessonId);
      for (const attempt of lessonAttempts) {
        xapiStatements.push({
          actor: { mbox: `mailto:user${attempt.userId}@microlearning.local` },
          verb: { id: attempt.status === "completed" ? "http://adlnet.gov/expapi/verbs/completed" : "http://adlnet.gov/expapi/verbs/attempted" },
          object: {
            id: lesson.xapiActivityId || `https://microlearning.local/lessons/${lesson.id}`,
            definition: { name: { en: lesson.title }, type: "http://adlnet.gov/expapi/activities/lesson" },
          },
          result: {
            score: attempt.score ? { raw: attempt.score, max: attempt.maxScore } : undefined,
            success: attempt.passed,
            duration: attempt.timeSpentSeconds ? `PT${attempt.timeSpentSeconds}S` : undefined,
            completion: attempt.status === "completed",
          },
          timestamp: new Date(attempt.startedAt).toISOString(),
        });
      }
    }
    return { lesson: { id: lesson.id, title: lesson.title }, statements: xapiStatements };
  }),
  getAuditReport: employerAdminProcedure.input(z.object({
    orgId: z.number(),
    limit: z.number().optional(),
  })).query(async ({ input }) => {
    return db.getAuditLogs(input.orgId, input.limit ?? 100);
  }),
});

// ─── Schedule-Aware Helper ───────────────────────────────────────────
function findFreeSlot(
  userShifts: Array<{ startTime: number; endTime: number; breakStartTime: number | null; breakEndTime: number | null }>,
  rangeStart: number,
  rangeEnd: number,
  durationMs: number,
): { start: number; end: number } | null {
  const busyPeriods = userShifts.flatMap(s => {
    const periods = [{ start: s.startTime, end: s.endTime }];
    if (s.breakStartTime && s.breakEndTime) {
      periods.push({ start: s.breakStartTime, end: s.breakEndTime });
    }
    return periods;
  }).sort((a, b) => a.start - b.start);

  let cursor = rangeStart;
  for (const busy of busyPeriods) {
    if (cursor + durationMs <= busy.start) {
      return { start: cursor, end: cursor + durationMs };
    }
    cursor = Math.max(cursor, busy.end);
  }
  if (cursor + durationMs <= rangeEnd) {
    return { start: cursor, end: cursor + durationMs };
  }
  return null;
}

// ─── Main Router ─────────────────────────────────────────────────────
export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),
  org: orgRouter,
  user: userRouter,
  shift: shiftRouter,
  lesson: lessonRouter,
  assignment: assignmentRouter,
  attempt: attemptRouter,
  notification: notificationRouter,
  certificate: certificateRouter,
  audit: auditRouter,
  ai: aiRouter,
  compliance: complianceRouter,
});

export type AppRouter = typeof appRouter;
