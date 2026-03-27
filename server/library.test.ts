import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import { COOKIE_NAME } from "../shared/const";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  // Extend with app-specific fields
  (user as any).appRole = "super_admin";
  (user as any).orgId = 1;

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return { ctx };
}

function createLearnerContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 2,
    openId: "learner-user",
    email: "learner@example.com",
    name: "Learner User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };
  (user as any).appRole = "learner";
  (user as any).orgId = 1;

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return { ctx };
}

describe("library.browse", () => {
  it("returns an array (empty when no DB)", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.library.browse({});
    expect(Array.isArray(result)).toBe(true);
  });

  it("accepts optional filter parameters", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.library.browse({
      search: "safety",
      difficulty: "beginner",
      contentType: "quiz",
      category: "Safety",
    });
    expect(Array.isArray(result)).toBe(true);
  });

  it("works with no input", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.library.browse();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("library.categories", () => {
  it("returns an array of category strings", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.library.categories();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe("library.seed", () => {
  it("requires admin access", async () => {
    const { ctx } = createLearnerContext();
    const caller = appRouter.createCaller(ctx);
    await expect(caller.library.seed()).rejects.toThrow();
  });
});

describe("ai.generateAndSave", () => {
  it("requires authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.ai.generateAndSave({
        topic: "Test topic",
        difficulty: "beginner",
        durationMinutes: 5,
        contentType: "mixed",
      })
    ).rejects.toThrow();
  });
});

describe("seedLessons data", () => {
  it("exports SEED_LESSONS with 30+ entries", async () => {
    const { SEED_LESSONS } = await import("./seedLessons");
    expect(SEED_LESSONS.length).toBeGreaterThanOrEqual(30);
  });

  it("each seed lesson has required fields", async () => {
    const { SEED_LESSONS } = await import("./seedLessons");
    for (const lesson of SEED_LESSONS) {
      expect(lesson.title).toBeTruthy();
      expect(lesson.description).toBeTruthy();
      expect(lesson.content).toBeTruthy();
      expect(lesson.content.blocks).toBeTruthy();
      expect(Array.isArray(lesson.content.blocks)).toBe(true);
      expect(lesson.content.blocks.length).toBeGreaterThan(0);
      expect(lesson.durationMinutes).toBeGreaterThan(0);
      expect(["beginner", "intermediate", "advanced"]).toContain(lesson.difficulty);
      expect(["video", "quiz", "scenario", "assessment", "mixed", "article"]).toContain(lesson.contentType);
      expect(lesson.category).toBeTruthy();
      expect(Array.isArray(lesson.tags)).toBe(true);
    }
  });

  it("seed lessons cover multiple categories", async () => {
    const { SEED_LESSONS } = await import("./seedLessons");
    const categories = new Set(SEED_LESSONS.map(l => l.category));
    expect(categories.size).toBeGreaterThanOrEqual(5);
  });

  it("seed lessons cover multiple difficulty levels", async () => {
    const { SEED_LESSONS } = await import("./seedLessons");
    const difficulties = new Set(SEED_LESSONS.map(l => l.difficulty));
    expect(difficulties.has("beginner")).toBe(true);
    expect(difficulties.has("intermediate")).toBe(true);
    expect(difficulties.has("advanced")).toBe(true);
  });
});
