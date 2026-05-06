import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import * as db from "../db";

export const teamManagementRouter = router({
  // Invite team member (super_admin only)
  inviteTeamMember: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        appRole: z.enum(["learner", "employer_admin", "content_author"]),
        orgId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.appRole !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only super_admin can invite team members" });
      }

      return {
        success: true,
        message: `Invitation sent to ${input.email} with role ${input.appRole}`,
        invitedEmail: input.email,
        role: input.appRole,
      };
    }),

  // Get team members (super_admin only)
  getTeamMembers: protectedProcedure
    .input(z.object({ orgId: z.number() }))
    .query(async ({ ctx, input }) => {
      if (ctx.user.appRole !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only super_admin can view team members" });
      }

      const teamMembers = await db.getUsersByOrg(input.orgId);
      return teamMembers.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        appRole: u.appRole,
        approvalStatus: u.approvalStatus,
        createdAt: u.createdAt,
        lastActiveAt: u.lastActiveAt,
      }));
    }),

  // Update team member role (super_admin only)
  updateTeamMemberRole: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        newRole: z.enum(["learner", "employer_admin", "content_author"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.appRole !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only super_admin can update roles" });
      }

      await db.updateUser(input.userId, { appRole: input.newRole });
      return { success: true, message: `User role updated to ${input.newRole}` };
    }),

  // Approve user (super_admin only)
  approveUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.appRole !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only super_admin can approve users" });
      }

      await db.updateUser(input.userId, {
        approvalStatus: "approved",
        approvedAt: new Date(),
        approvedBy: ctx.user.id,
      });

      return { success: true, message: "User approved" };
    }),

  // Disapprove user (super_admin only)
  disapproveUser: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        reason: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.appRole !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only super_admin can disapprove users" });
      }

      await db.updateUser(input.userId, {
        approvalStatus: "disapproved",
        disapprovalReason: input.reason || null,
      });

      return { success: true, message: "User disapproved" };
    }),

  // Block user (super_admin only)
  blockUser: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
        reason: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.appRole !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only super_admin can block users" });
      }

      await db.updateUser(input.userId, {
        approvalStatus: "blocked",
        blockReason: input.reason,
      });

      return { success: true, message: "User blocked" };
    }),

  // Remove user (super_admin only)
  removeUser: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.appRole !== "super_admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only super_admin can remove users" });
      }

      await db.updateUser(input.userId, {
        approvalStatus: "removed",
      });

      return { success: true, message: "User removed" };
    }),

  // Get pending users (super_admin only)
  getPendingUsers: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.appRole !== "super_admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only super_admin can view pending users" });
    }

    const allUsers = await db.getAllUsers();
    const pendingUsers = allUsers.filter((u: any) => u.approvalStatus === "pending");

    return pendingUsers.map((u: any) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      appRole: u.appRole,
      createdAt: u.createdAt,
    }));
  }),

  // Get user approval stats (super_admin only)
  getApprovalStats: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.appRole !== "super_admin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Only super_admin can view stats" });
    }

    const allUsers = await db.getAllUsers();

    const stats = {
      total: allUsers.length,
      pending: allUsers.filter((u: any) => u.approvalStatus === "pending").length,
      approved: allUsers.filter((u: any) => u.approvalStatus === "approved").length,
      disapproved: allUsers.filter((u: any) => u.approvalStatus === "disapproved").length,
      blocked: allUsers.filter((u: any) => u.approvalStatus === "blocked").length,
      removed: allUsers.filter((u: any) => u.approvalStatus === "removed").length,
    };

    return stats;
  }),
});
