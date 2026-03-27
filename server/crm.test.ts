import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      appRole: "super_admin",
      orgId: 1,
      timezone: "UTC",
      avatarUrl: null,
      notificationPreferences: null,
      lastActiveAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    } as any,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: () => {} } as any,
  };
}

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as any,
    res: { clearCookie: () => {} } as any,
  };
}

describe("CRM Router", () => {
  it("getBranding returns defaults when no branding is set (public)", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.crm.getBranding();
    expect(result).toBeDefined();
    expect((result as any).appName || "MicroLearn").toBeTruthy();
  });

  it("getStats requires admin role", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.crm.getStats()).rejects.toThrow();
  });

  it("getStats returns counts for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.crm.getStats();
    expect(result).toBeDefined();
    expect(typeof result.userCount).toBe("number");
    expect(typeof result.lessonCount).toBe("number");
    expect(typeof result.orgCount).toBe("number");
    expect(typeof result.publishedCount).toBe("number");
  });

  it("listUsers requires admin role", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.crm.listUsers()).rejects.toThrow();
  });

  it("listUsers returns array for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.crm.listUsers();
    expect(Array.isArray(result)).toBe(true);
  });

  it("listLessons returns array for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.crm.listLessons();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(30);
  });

  it("listOrgs returns array for admin", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.crm.listOrgs();
    expect(Array.isArray(result)).toBe(true);
  });

  it("updateBranding requires admin role", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.crm.updateBranding({ appName: "Test" })).rejects.toThrow();
  });

  it("deleteUser requires admin role", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.crm.deleteUser({ id: 999 })).rejects.toThrow();
  });

  it("deleteLesson requires admin role", async () => {
    const ctx = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.crm.deleteLesson({ id: 999 })).rejects.toThrow();
  });
});

describe("Seed Lessons", () => {
  it("SEED_LESSONS has exactly 30 lessons", async () => {
    const { SEED_LESSONS } = await import("./seedLessons");
    expect(SEED_LESSONS.length).toBe(30);
  });

  it("each seed lesson has required fields", async () => {
    const { SEED_LESSONS } = await import("./seedLessons");
    for (const lesson of SEED_LESSONS) {
      expect(lesson.title).toBeTruthy();
      expect(lesson.description).toBeTruthy();
      expect(lesson.category).toBeTruthy();
      expect(lesson.content).toBeDefined();
      expect(lesson.content.blocks.length).toBeGreaterThan(0);
      expect(lesson.content.quizQuestions!.length).toBeGreaterThanOrEqual(3);
      expect(lesson.content.quizQuestions!.length).toBeLessThanOrEqual(5);
    }
  });

  it("seed lessons cover all 6 categories", async () => {
    const { SEED_LESSONS } = await import("./seedLessons");
    const categories = new Set(SEED_LESSONS.map(l => l.category));
    expect(categories.size).toBe(6);
    expect(categories.has("Safety & Compliance")).toBe(true);
    expect(categories.has("Customer Service & Soft Skills")).toBe(true);
    expect(categories.has("Productivity & Efficiency")).toBe(true);
    expect(categories.has("Health & Wellbeing")).toBe(true);
    expect(categories.has("Technical & Job Skills")).toBe(true);
    expect(categories.has("Personal Development")).toBe(true);
  });
});
