import { describe, it, expect, beforeEach, vi } from "vitest";
import { teamManagementRouter } from "./routers/teamManagement";
import { TRPCError } from "@trpc/server";

// Mock context
const createMockContext = (user: any) => ({
  user,
  req: {} as any,
  res: {} as any,
});

describe("Team Management Router", () => {
  describe("inviteTeamMember", () => {
    it("super_admin can invite team members", async () => {
      const ctx = createMockContext({
        id: 1,
        appRole: "super_admin",
        orgId: 1,
      });

      const caller = teamManagementRouter.createCaller(ctx);
      const result = await caller.inviteTeamMember({
        email: "newmember@example.com",
        appRole: "employer_admin",
        orgId: 1,
      });

      expect(result.success).toBe(true);
      expect(result.invitedEmail).toBe("newmember@example.com");
      expect(result.role).toBe("employer_admin");
    });

    it("non-super_admin cannot invite team members", async () => {
      const ctx = createMockContext({
        id: 2,
        appRole: "learner",
        orgId: 1,
      });

      const caller = teamManagementRouter.createCaller(ctx);

      await expect(
        caller.inviteTeamMember({
          email: "newmember@example.com",
          appRole: "employer_admin",
          orgId: 1,
        })
      ).rejects.toThrow("Only super_admin can invite team members");
    });

    it("validates email format", async () => {
      const ctx = createMockContext({
        id: 1,
        appRole: "super_admin",
        orgId: 1,
      });

      const caller = teamManagementRouter.createCaller(ctx);

      await expect(
        caller.inviteTeamMember({
          email: "invalid-email",
          appRole: "employer_admin",
          orgId: 1,
        })
      ).rejects.toThrow();
    });
  });

  describe("updateTeamMemberRole", () => {
    it("super_admin can update team member role", async () => {
      const ctx = createMockContext({
        id: 1,
        appRole: "super_admin",
        orgId: 1,
      });

      const caller = teamManagementRouter.createCaller(ctx);
      const result = await caller.updateTeamMemberRole({
        userId: 2,
        newRole: "content_author",
      });

      expect(result.success).toBe(true);
      expect(result.message).toContain("content_author");
    });

    it("non-super_admin cannot update roles", async () => {
      const ctx = createMockContext({
        id: 2,
        appRole: "employer_admin",
        orgId: 1,
      });

      const caller = teamManagementRouter.createCaller(ctx);

      await expect(
        caller.updateTeamMemberRole({
          userId: 3,
          newRole: "learner",
        })
      ).rejects.toThrow("Only super_admin can update roles");
    });
  });

  describe("approveUser", () => {
    it("super_admin can approve users", async () => {
      const ctx = createMockContext({
        id: 1,
        appRole: "super_admin",
        orgId: 1,
      });

      const caller = teamManagementRouter.createCaller(ctx);
      const result = await caller.approveUser({ userId: 2 });

      expect(result.success).toBe(true);
      expect(result.message).toBe("User approved");
    });

    it("non-super_admin cannot approve users", async () => {
      const ctx = createMockContext({
        id: 2,
        appRole: "learner",
        orgId: 1,
      });

      const caller = teamManagementRouter.createCaller(ctx);

      await expect(caller.approveUser({ userId: 3 })).rejects.toThrow(
        "Only super_admin can approve users"
      );
    });
  });

  describe("disapproveUser", () => {
    it("super_admin can disapprove users with reason", async () => {
      const ctx = createMockContext({
        id: 1,
        appRole: "super_admin",
        orgId: 1,
      });

      const caller = teamManagementRouter.createCaller(ctx);
      const result = await caller.disapproveUser({
        userId: 2,
        reason: "Does not meet requirements",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("User disapproved");
    });

    it("super_admin can disapprove users without reason", async () => {
      const ctx = createMockContext({
        id: 1,
        appRole: "super_admin",
        orgId: 1,
      });

      const caller = teamManagementRouter.createCaller(ctx);
      const result = await caller.disapproveUser({ userId: 2 });

      expect(result.success).toBe(true);
    });

    it("non-super_admin cannot disapprove users", async () => {
      const ctx = createMockContext({
        id: 2,
        appRole: "employer_admin",
        orgId: 1,
      });

      const caller = teamManagementRouter.createCaller(ctx);

      await expect(
        caller.disapproveUser({ userId: 3, reason: "Test" })
      ).rejects.toThrow("Only super_admin can disapprove users");
    });
  });

  describe("blockUser", () => {
    it("super_admin can block users", async () => {
      const ctx = createMockContext({
        id: 1,
        appRole: "super_admin",
        orgId: 1,
      });

      const caller = teamManagementRouter.createCaller(ctx);
      const result = await caller.blockUser({
        userId: 2,
        reason: "Violation of terms",
      });

      expect(result.success).toBe(true);
      expect(result.message).toBe("User blocked");
    });

    it("non-super_admin cannot block users", async () => {
      const ctx = createMockContext({
        id: 2,
        appRole: "learner",
        orgId: 1,
      });

      const caller = teamManagementRouter.createCaller(ctx);

      await expect(
        caller.blockUser({ userId: 3, reason: "Test" })
      ).rejects.toThrow("Only super_admin can block users");
    });
  });

  describe("removeUser", () => {
    it("super_admin can remove users", async () => {
      const ctx = createMockContext({
        id: 1,
        appRole: "super_admin",
        orgId: 1,
      });

      const caller = teamManagementRouter.createCaller(ctx);
      const result = await caller.removeUser({ userId: 2 });

      expect(result.success).toBe(true);
      expect(result.message).toBe("User removed");
    });

    it("non-super_admin cannot remove users", async () => {
      const ctx = createMockContext({
        id: 2,
        appRole: "employer_admin",
        orgId: 1,
      });

      const caller = teamManagementRouter.createCaller(ctx);

      await expect(caller.removeUser({ userId: 3 })).rejects.toThrow(
        "Only super_admin can remove users"
      );
    });
  });

  describe("getPendingUsers", () => {
    it("super_admin can get pending users", async () => {
      const ctx = createMockContext({
        id: 1,
        appRole: "super_admin",
        orgId: 1,
      });

      const caller = teamManagementRouter.createCaller(ctx);
      const result = await caller.getPendingUsers();

      expect(Array.isArray(result)).toBe(true);
    });

    it("non-super_admin cannot get pending users", async () => {
      const ctx = createMockContext({
        id: 2,
        appRole: "learner",
        orgId: 1,
      });

      const caller = teamManagementRouter.createCaller(ctx);

      await expect(caller.getPendingUsers()).rejects.toThrow(
        "Only super_admin can view pending users"
      );
    });
  });

  describe("getApprovalStats", () => {
    it("super_admin can get approval statistics", async () => {
      const ctx = createMockContext({
        id: 1,
        appRole: "super_admin",
        orgId: 1,
      });

      const caller = teamManagementRouter.createCaller(ctx);
      const result = await caller.getApprovalStats();

      expect(result).toHaveProperty("total");
      expect(result).toHaveProperty("pending");
      expect(result).toHaveProperty("approved");
      expect(result).toHaveProperty("disapproved");
      expect(result).toHaveProperty("blocked");
      expect(result).toHaveProperty("removed");
      expect(typeof result.total).toBe("number");
    });

    it("non-super_admin cannot get approval stats", async () => {
      const ctx = createMockContext({
        id: 2,
        appRole: "employer_admin",
        orgId: 1,
      });

      const caller = teamManagementRouter.createCaller(ctx);

      await expect(caller.getApprovalStats()).rejects.toThrow(
        "Only super_admin can view stats"
      );
    });
  });

  describe("getTeamMembers", () => {
    it("super_admin can get team members by org", async () => {
      const ctx = createMockContext({
        id: 1,
        appRole: "super_admin",
        orgId: 1,
      });

      const caller = teamManagementRouter.createCaller(ctx);
      const result = await caller.getTeamMembers({ orgId: 1 });

      expect(Array.isArray(result)).toBe(true);
    });

    it("non-super_admin cannot get team members", async () => {
      const ctx = createMockContext({
        id: 2,
        appRole: "learner",
        orgId: 1,
      });

      const caller = teamManagementRouter.createCaller(ctx);

      await expect(caller.getTeamMembers({ orgId: 1 })).rejects.toThrow(
        "Only super_admin can view team members"
      );
    });
  });
});
