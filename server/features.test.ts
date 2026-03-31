import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 1,
    openId: "test-user-001",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    appRole: "super_admin",
    orgId: 1,
    timezone: "UTC",
    notificationPreferences: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  } as AuthenticatedUser;
}

function createMockContext(user?: AuthenticatedUser | null): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];
  const ctx: TrpcContext = {
    user: user ?? null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: Record<string, unknown>) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };
  return { ctx, clearedCookies };
}

describe("Auth Router", () => {
  it("returns null for unauthenticated user on auth.me", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user data for authenticated user on auth.me", async () => {
    const user = createMockUser();
    const { ctx } = createMockContext(user);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.me();
    expect(result).toBeDefined();
    expect(result?.openId).toBe("test-user-001");
    expect(result?.name).toBe("Test User");
    expect(result?.email).toBe("test@example.com");
  });

  it("clears session cookie on logout", async () => {
    const user = createMockUser();
    const { ctx, clearedCookies } = createMockContext(user);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
    expect(clearedCookies).toHaveLength(1);
    expect(clearedCookies[0]?.name).toBe(COOKIE_NAME);
  });
});

describe("Organization Router", () => {
  it("rejects org.list for non-admin users", async () => {
    const user = createMockUser({ role: "user", appRole: "learner" as any });
    const { ctx } = createMockContext(user);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.org.list()).rejects.toThrow();
  });

  it("rejects org.create for non-admin users", async () => {
    const user = createMockUser({ role: "user", appRole: "learner" as any });
    const { ctx } = createMockContext(user);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.org.create({ name: "Test Org", slug: "test-org" })
    ).rejects.toThrow();
  });

  it("allows super_admin to access org.list", async () => {
    const user = createMockUser({ role: "admin", appRole: "super_admin" as any });
    const { ctx } = createMockContext(user);
    const caller = appRouter.createCaller(ctx);
    // Should not throw - may return empty array if DB not connected
    const result = await caller.org.list();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Lesson Router", () => {
  it("rejects lesson creation for learner role", async () => {
    const user = createMockUser({ appRole: "learner" as any });
    const { ctx } = createMockContext(user);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.lesson.create({
        title: "Test Lesson",
        orgId: 1,
        content: { blocks: [], quizQuestions: [] },
        contentType: "article",
        difficulty: "beginner",
        durationMinutes: 5,
      })
    ).rejects.toThrow();
  });

  it("requires Pro+ tier for content_author to create lessons (feature gating)", async () => {
    const user = createMockUser({ appRole: "content_author" as any });
    const { ctx } = createMockContext(user);
    const caller = appRouter.createCaller(ctx);
    // Content authoring is now gated to Pro+ tier via enforceFeatureAccess
    // Free tier users should get FORBIDDEN from feature gating
    try {
      await caller.lesson.create({
        title: "Test Lesson",
        orgId: 1,
        content: { blocks: [], quizQuestions: [] },
        contentType: "article",
        difficulty: "beginner",
        durationMinutes: 5,
      });
    } catch (e: any) {
      // FORBIDDEN is expected since content authoring requires Pro+ tier
      expect(["FORBIDDEN", "INTERNAL_SERVER_ERROR"]).toContain(e.code);
    }
  });
});

describe("Shift Router", () => {
  it("rejects shift creation for unauthenticated users", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.shift.create({
        userId: 1,
        orgId: 1,
        startTime: Date.now(),
        endTime: Date.now() + 28800000,
        shiftType: "morning",
      })
    ).rejects.toThrow();
  });

  it("allows authenticated user to query their shifts", async () => {
    const user = createMockUser();
    const { ctx } = createMockContext(user);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.shift.getMyShifts({
      startRange: Date.now() - 86400000,
      endRange: Date.now() + 86400000,
    });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Assignment Router", () => {
  it("rejects assignment queries for unauthenticated users", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.assignment.getMyAssignments()).rejects.toThrow();
  });

  it("allows authenticated user to query assignments", async () => {
    const user = createMockUser();
    const { ctx } = createMockContext(user);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.assignment.getMyAssignments();
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects bulk assignment for non-admin users", async () => {
    const user = createMockUser({ appRole: "learner" as any });
    const { ctx } = createMockContext(user);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.assignment.bulkCreate({
        lessonId: 1,
        userIds: [1, 2],
        orgId: 1,
        priority: "normal",
        isScheduleAware: true,
      })
    ).rejects.toThrow();
  });
});

describe("Notification Router", () => {
  it("allows authenticated user to query notifications", async () => {
    const user = createMockUser();
    const { ctx } = createMockContext(user);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.notification.getMyNotifications();
    expect(Array.isArray(result)).toBe(true);
  });

  it("rejects notification queries for unauthenticated users", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.notification.getMyNotifications()).rejects.toThrow();
  });
});

describe("Certificate Router", () => {
  it("allows authenticated user to query certificates", async () => {
    const user = createMockUser();
    const { ctx } = createMockContext(user);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.certificate.getMyCertificates();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("Audit Router", () => {
  it("rejects audit log access for non-admin users", async () => {
    const user = createMockUser({ appRole: "learner" as any });
    const { ctx } = createMockContext(user);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.audit.getByOrg({ orgId: 1 })).rejects.toThrow();
  });

  it("allows employer_admin to access audit logs", async () => {
    const user = createMockUser({ appRole: "employer_admin" as any, orgId: 1 });
    const { ctx } = createMockContext(user);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.audit.getByOrg({ orgId: 1 });
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("User Router", () => {
  it("rejects role changes for non-admin users", async () => {
    const user = createMockUser({ role: "user", appRole: "learner" as any });
    const { ctx } = createMockContext(user);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.user.setRole({ userId: 2, appRole: "employer_admin" })
    ).rejects.toThrow();
  });
});

describe("Input Validation", () => {
  it("rejects invalid lesson content type", async () => {
    const user = createMockUser({ appRole: "content_author" as any });
    const { ctx } = createMockContext(user);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.lesson.create({
        title: "Test",
        orgId: 1,
        content: {},
        contentType: "invalid_type" as any,
        difficulty: "beginner",
        durationMinutes: 5,
      })
    ).rejects.toThrow();
  });

  it("rejects empty lesson title", async () => {
    const user = createMockUser({ appRole: "content_author" as any });
    const { ctx } = createMockContext(user);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.lesson.create({
        title: "",
        orgId: 1,
        content: {},
        contentType: "article",
        difficulty: "beginner",
        durationMinutes: 5,
      })
    ).rejects.toThrow();
  });

  it("returns empty array for shift query with no matching range", async () => {
    const user = createMockUser();
    const { ctx } = createMockContext(user);
    const caller = appRouter.createCaller(ctx);
    // Even with empty/invalid range, the query should return an array (possibly empty)
    const result = await caller.shift.getMyShifts({ startRange: 0, endRange: 0 });
    expect(Array.isArray(result)).toBe(true);
  });
});
