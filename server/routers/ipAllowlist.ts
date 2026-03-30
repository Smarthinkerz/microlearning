import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";
import { invalidateAllowlistCache } from "../middleware/ipAllowlist";

/**
 * Admin-only guard: ensures only admin users can manage IP allowlist.
 */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const ipAllowlistRouter = router({
  /** List all IP allowlist entries */
  list: adminProcedure.query(async () => {
    return db.getAllAllowlistEntries();
  }),

  /** Add a new IP to the allowlist */
  add: adminProcedure
    .input(
      z.object({
        ipAddress: z.string().min(1).max(45),
        label: z.string().max(255).optional(),
        expiresAt: z.string().datetime().optional(), // ISO 8601
      })
    )
    .mutation(async ({ input, ctx }) => {
      // Validate IP format (basic check)
      const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$|^[0-9a-fA-F:]+$/;
      if (!ipRegex.test(input.ipAddress)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Invalid IP address format. Supports IPv4, IPv6, and CIDR notation.",
        });
      }

      await db.addAllowlistEntry({
        ipAddress: input.ipAddress,
        label: input.label ?? null,
        addedBy: ctx.user.id,
        isActive: true,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      });

      // Invalidate cache so the new IP takes effect immediately
      invalidateAllowlistCache();

      await db.createAuditLog({
        userId: ctx.user.id,
        action: "ip_allowlist.add",
        resourceType: "ip_allowlist",
        details: { ipAddress: input.ipAddress, label: input.label } as any,
      });

      return { success: true };
    }),

  /** Remove (soft-delete) an IP from the allowlist */
  remove: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const entries = await db.getAllAllowlistEntries();
      const entry = entries.find((e: any) => e.id === input.id);
      if (!entry) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Entry not found" });
      }

      await db.removeAllowlistEntry(input.id);
      invalidateAllowlistCache();

      await db.createAuditLog({
        userId: ctx.user.id,
        action: "ip_allowlist.remove",
        resourceType: "ip_allowlist",
        details: { ipAddress: entry.ipAddress, label: entry.label } as any,
      });

      return { success: true };
    }),

  /** Permanently delete an IP entry */
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await db.deleteAllowlistEntry(input.id);
      invalidateAllowlistCache();

      await db.createAuditLog({
        userId: ctx.user.id,
        action: "ip_allowlist.delete",
        resourceType: "ip_allowlist",
        details: { entryId: input.id } as any,
      });

      return { success: true };
    }),
});
