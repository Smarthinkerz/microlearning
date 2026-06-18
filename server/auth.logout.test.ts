/**
 * auth.logout — Supabase Auth
 *
 * Logout is now handled client-side via supabase.auth.signOut().
 * The server-side tRPC mutation is a no-op that returns { success: true }
 * for API compatibility.
 */
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    supabaseId: "sample-supabase-uuid",
    email: "sample@example.com",
    name: "Sample User",
    role: "user",
    appRole: "learner",
    orgId: null,
    timezone: "UTC",
    avatarUrl: null,
    notificationPreferences: null,
    approvalStatus: "approved",
    approvedAt: null,
    approvedBy: null,
    disapprovalReason: null,
    blockReason: null,
    lastActiveAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return { ctx };
}

describe("auth.logout", () => {
  it("returns success (Supabase logout is handled client-side)", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result).toEqual({ success: true });
  });
});
