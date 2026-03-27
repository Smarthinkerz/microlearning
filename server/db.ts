import { and, desc, eq, gte, lte, sql, inArray, like, or, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser, users,
  organizations, InsertOrganization,
  shifts, InsertShift,
  lessons, InsertLesson,
  lessonAssignments, InsertLessonAssignment,
  lessonAttempts, InsertLessonAttempt,
  certificates,
  auditLogs,
  notifications,
  webhookConfigs,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ─── Users ───────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;

  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};

  const textFields = ["name", "email", "loginMethod"] as const;
  type TextField = (typeof textFields)[number];
  const assignNullable = (field: TextField) => {
    const value = user[field];
    if (value === undefined) return;
    const normalized = value ?? null;
    values[field] = normalized;
    updateSet[field] = normalized;
  };
  textFields.forEach(assignNullable);

  if (user.lastSignedIn !== undefined) {
    values.lastSignedIn = user.lastSignedIn;
    updateSet.lastSignedIn = user.lastSignedIn;
  }
  if (user.role !== undefined) {
    values.role = user.role;
    updateSet.role = user.role;
  } else if (user.openId === ENV.ownerOpenId) {
    values.role = 'admin';
    updateSet.role = 'admin';
    values.appRole = 'super_admin';
    updateSet.appRole = 'super_admin';
  }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();

  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getUsersByOrg(orgId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(users).where(eq(users.orgId, orgId)).orderBy(asc(users.name));
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

// ─── Organizations ───────────────────────────────────────────────────
export async function createOrganization(org: InsertOrganization) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(organizations).values(org);
  return { id: result[0].insertId, ...org };
}

export async function getOrganizationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(organizations).where(eq(organizations.id, id)).limit(1);
  return result[0];
}

export async function getOrganizationBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(organizations).where(eq(organizations.slug, slug)).limit(1);
  return result[0];
}

export async function getAllOrganizations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(organizations).orderBy(desc(organizations.createdAt));
}

export async function updateOrganization(id: number, data: Partial<InsertOrganization>) {
  const db = await getDb();
  if (!db) return;
  await db.update(organizations).set(data).where(eq(organizations.id, id));
}

// ─── Shifts ──────────────────────────────────────────────────────────
export async function createShift(shift: InsertShift) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(shifts).values(shift);
  return { id: result[0].insertId, ...shift };
}

export async function getShiftsByUser(userId: number, startRange?: number, endRange?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(shifts.userId, userId)];
  if (startRange) conditions.push(gte(shifts.endTime, startRange));
  if (endRange) conditions.push(lte(shifts.startTime, endRange));
  return db.select().from(shifts).where(and(...conditions)).orderBy(asc(shifts.startTime));
}

export async function getShiftsByOrg(orgId: number, startRange?: number, endRange?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(shifts.orgId, orgId)];
  if (startRange) conditions.push(gte(shifts.endTime, startRange));
  if (endRange) conditions.push(lte(shifts.startTime, endRange));
  return db.select().from(shifts).where(and(...conditions)).orderBy(asc(shifts.startTime));
}

export async function updateShift(id: number, data: Partial<InsertShift>) {
  const db = await getDb();
  if (!db) return;
  await db.update(shifts).set(data).where(eq(shifts.id, id));
}

export async function deleteShift(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(shifts).where(eq(shifts.id, id));
}

export async function bulkCreateShifts(shiftList: InsertShift[]) {
  const db = await getDb();
  if (!db || shiftList.length === 0) return;
  await db.insert(shifts).values(shiftList);
}

// ─── Lessons ─────────────────────────────────────────────────────────
export async function createLesson(lesson: InsertLesson) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(lessons).values(lesson);
  return { id: result[0].insertId, ...lesson };
}

export async function getLessonById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(lessons).where(eq(lessons.id, id)).limit(1);
  return result[0];
}

export async function getLessonsByOrg(orgId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(lessons.orgId, orgId)];
  if (status) conditions.push(eq(lessons.status, status as any));
  return db.select().from(lessons).where(and(...conditions)).orderBy(desc(lessons.updatedAt));
}

export async function updateLesson(id: number, data: Partial<InsertLesson>) {
  const db = await getDb();
  if (!db) return;
  await db.update(lessons).set(data).where(eq(lessons.id, id));
}

export async function deleteLesson(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(lessons).where(eq(lessons.id, id));
}

export async function getLessonsInReview(orgId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lessons).where(
    and(eq(lessons.orgId, orgId), eq(lessons.status, "in_review"))
  ).orderBy(desc(lessons.updatedAt));
}

// ─── Lesson Assignments ──────────────────────────────────────────────
export async function createAssignment(assignment: InsertLessonAssignment) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(lessonAssignments).values(assignment);
  return { id: result[0].insertId, ...assignment };
}

export async function getAssignmentsByUser(userId: number, status?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(lessonAssignments.userId, userId)];
  if (status) conditions.push(eq(lessonAssignments.status, status as any));
  return db.select().from(lessonAssignments).where(and(...conditions)).orderBy(desc(lessonAssignments.createdAt));
}

export async function getAssignmentsByOrg(orgId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lessonAssignments).where(eq(lessonAssignments.orgId, orgId)).orderBy(desc(lessonAssignments.createdAt));
}

export async function updateAssignment(id: number, data: Partial<InsertLessonAssignment>) {
  const db = await getDb();
  if (!db) return;
  await db.update(lessonAssignments).set(data).where(eq(lessonAssignments.id, id));
}

export async function getAssignmentWithLesson(assignmentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(lessonAssignments)
    .innerJoin(lessons, eq(lessonAssignments.lessonId, lessons.id))
    .where(eq(lessonAssignments.id, assignmentId))
    .limit(1);
  return result[0];
}

export async function bulkCreateAssignments(assignmentList: InsertLessonAssignment[]) {
  const db = await getDb();
  if (!db || assignmentList.length === 0) return;
  await db.insert(lessonAssignments).values(assignmentList);
}

// ─── Lesson Attempts ─────────────────────────────────────────────────
export async function createAttempt(attempt: InsertLessonAttempt) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(lessonAttempts).values(attempt);
  return { id: result[0].insertId, ...attempt };
}

export async function getAttemptById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(lessonAttempts).where(eq(lessonAttempts.id, id)).limit(1);
  return result[0];
}

export async function getAttemptsByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lessonAttempts).where(eq(lessonAttempts.userId, userId)).orderBy(desc(lessonAttempts.createdAt));
}

export async function getAttemptsByAssignment(assignmentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(lessonAttempts).where(eq(lessonAttempts.assignmentId, assignmentId)).orderBy(desc(lessonAttempts.createdAt));
}

export async function updateAttempt(id: number, data: Partial<InsertLessonAttempt>) {
  const db = await getDb();
  if (!db) return;
  await db.update(lessonAttempts).set(data).where(eq(lessonAttempts.id, id));
}

// ─── Certificates ────────────────────────────────────────────────────
export async function createCertificate(cert: typeof certificates.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(certificates).values(cert);
  return { id: result[0].insertId, ...cert };
}

export async function getCertificatesByUser(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(certificates).where(eq(certificates.userId, userId)).orderBy(desc(certificates.issuedAt));
}

// ─── Audit Logs ──────────────────────────────────────────────────────
export async function createAuditLog(log: typeof auditLogs.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(auditLogs).values(log);
}

export async function getAuditLogs(orgId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(auditLogs).where(eq(auditLogs.orgId, orgId)).orderBy(desc(auditLogs.createdAt)).limit(limit);
}

// ─── Notifications ───────────────────────────────────────────────────
export async function createNotification(notif: typeof notifications.$inferInsert) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(notif);
}

export async function getNotificationsByUser(userId: number, unreadOnly = false) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(notifications.userId, userId)];
  if (unreadOnly) conditions.push(eq(notifications.isRead, false));
  return db.select().from(notifications).where(and(...conditions)).orderBy(desc(notifications.createdAt)).limit(50);
}

export async function markNotificationRead(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(notifications).set({ isRead: true }).where(eq(notifications.userId, userId));
}

export async function deleteNotification(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(notifications).where(eq(notifications.id, id));
}

// ─── Webhook Configs ─────────────────────────────────────────────────
export async function getWebhookConfigsByOrg(orgId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(webhookConfigs).where(eq(webhookConfigs.orgId, orgId));
}

export async function createWebhookConfig(config: typeof webhookConfigs.$inferInsert) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.insert(webhookConfigs).values(config);
  return { id: result[0].insertId, ...config };
}

// ─── Analytics Helpers ───────────────────────────────────────────────
export async function getOrgStats(orgId: number) {
  const db = await getDb();
  if (!db) return null;

  const [userCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.orgId, orgId));

  const [lessonCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(lessons)
    .where(and(eq(lessons.orgId, orgId), eq(lessons.status, "published")));

  const [assignmentStats] = await db
    .select({
      total: sql<number>`count(*)`,
      completed: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
      inProgress: sql<number>`sum(case when status = 'in_progress' then 1 else 0 end)`,
    })
    .from(lessonAssignments)
    .where(eq(lessonAssignments.orgId, orgId));

  const [shiftCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(shifts)
    .where(eq(shifts.orgId, orgId));

  return {
    totalUsers: userCount?.count ?? 0,
    totalLessons: lessonCount?.count ?? 0,
    totalAssignments: assignmentStats?.total ?? 0,
    completedAssignments: assignmentStats?.completed ?? 0,
    inProgressAssignments: assignmentStats?.inProgress ?? 0,
    totalShifts: shiftCount?.count ?? 0,
    completionRate: assignmentStats?.total
      ? Math.round(((assignmentStats.completed ?? 0) / assignmentStats.total) * 100)
      : 0,
  };
}

export async function getLearnerStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const [assignmentStats] = await db
    .select({
      total: sql<number>`count(*)`,
      completed: sql<number>`sum(case when status = 'completed' then 1 else 0 end)`,
      inProgress: sql<number>`sum(case when status = 'in_progress' then 1 else 0 end)`,
    })
    .from(lessonAssignments)
    .where(eq(lessonAssignments.userId, userId));

  const [attemptStats] = await db
    .select({
      totalTime: sql<number>`coalesce(sum(timeSpentSeconds), 0)`,
      avgScore: sql<number>`coalesce(avg(score), 0)`,
      totalAttempts: sql<number>`count(*)`,
    })
    .from(lessonAttempts)
    .where(eq(lessonAttempts.userId, userId));

  const certCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(certificates)
    .where(eq(certificates.userId, userId));

  return {
    totalAssignments: assignmentStats?.total ?? 0,
    completedAssignments: assignmentStats?.completed ?? 0,
    inProgressAssignments: assignmentStats?.inProgress ?? 0,
    totalTimeSpent: attemptStats?.totalTime ?? 0,
    averageScore: Math.round(attemptStats?.avgScore ?? 0),
    totalAttempts: attemptStats?.totalAttempts ?? 0,
    totalCertificates: certCount[0]?.count ?? 0,
  };
}
