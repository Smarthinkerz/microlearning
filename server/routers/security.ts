/**
 * Security Router
 * 
 * tRPC procedures for MFA management, GDPR compliance, and audit logging.
 */
import { z } from "zod";
import { protectedProcedure, adminProcedure, router } from "../_core/trpc";
import * as db from "../db";
import {
  generateTOTPSecret,
  verifyTOTP,
  exportUserData,
  deleteUserData,
  logAuditEvent,
  encryptField,
  decryptField,
} from "../services/security";

export const securityRouter = router({
  // ─── MFA ────────────────────────────────────────────────────────

  /**
   * Initialize MFA setup - generates TOTP secret and QR code URI.
   */
  mfaSetup: protectedProcedure.mutation(async ({ ctx }) => {
    const email = ctx.user.email || `user-${ctx.user.id}@learnshift.app`;
    const { secret, uri, backupCodes } = generateTOTPSecret(email);

    // Store encrypted secret temporarily (user must verify before activation)
    const encryptedSecret = encryptField(secret);
    const encryptedBackupCodes = encryptField(JSON.stringify(backupCodes));

    await db.updateUser(ctx.user.id, {
      notificationPreferences: {
        ...((ctx.user as any).notificationPreferences || {}),
        _mfaPendingSecret: encryptedSecret,
        _mfaBackupCodes: encryptedBackupCodes,
      } as any,
    });

    await logAuditEvent(ctx.user.id, "auth.mfa_enabled", {
      step: "setup_initiated",
    });

    return { uri, backupCodes };
  }),

  /**
   * Verify MFA code and activate MFA for the user.
   */
  mfaVerify: protectedProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const prefs = (ctx.user as any).notificationPreferences || {};
      const encryptedSecret = prefs._mfaPendingSecret;

      if (!encryptedSecret) {
        return { success: false, error: "MFA setup not initiated" };
      }

      const secret = decryptField(encryptedSecret);
      const valid = verifyTOTP(secret, input.code);

      if (!valid) {
        await logAuditEvent(ctx.user.id, "auth.mfa_failed", {
          reason: "invalid_code_during_setup",
        });
        return { success: false, error: "Invalid code" };
      }

      // Activate MFA - store encrypted secret permanently
      const encryptedPermanent = encryptField(secret);
      await db.updateUser(ctx.user.id, {
        notificationPreferences: {
          ...prefs,
          _mfaSecret: encryptedPermanent,
          _mfaEnabled: true,
          _mfaPendingSecret: undefined,
        } as any,
      });

      await logAuditEvent(ctx.user.id, "auth.mfa_enabled", {
        step: "activated",
      });

      return { success: true };
    }),

  /**
   * Validate a TOTP code (for login verification).
   */
  mfaValidate: protectedProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const prefs = (ctx.user as any).notificationPreferences || {};
      const encryptedSecret = prefs._mfaSecret;

      if (!encryptedSecret) {
        return { success: false, error: "MFA not enabled" };
      }

      const secret = decryptField(encryptedSecret);
      const valid = verifyTOTP(secret, input.code);

      if (valid) {
        await logAuditEvent(ctx.user.id, "auth.mfa_verified", {});
      } else {
        await logAuditEvent(ctx.user.id, "auth.mfa_failed", {
          reason: "invalid_code",
        });
      }

      return { success: valid };
    }),

  /**
   * Check if MFA is enabled for the current user.
   */
  mfaStatus: protectedProcedure.query(async ({ ctx }) => {
    const prefs = (ctx.user as any).notificationPreferences || {};
    return {
      enabled: Boolean(prefs._mfaEnabled),
      hasPendingSetup: Boolean(prefs._mfaPendingSecret),
    };
  }),

  /**
   * Disable MFA for the current user.
   */
  mfaDisable: protectedProcedure
    .input(z.object({ code: z.string().length(6) }))
    .mutation(async ({ ctx, input }) => {
      const prefs = (ctx.user as any).notificationPreferences || {};
      const encryptedSecret = prefs._mfaSecret;

      if (!encryptedSecret) {
        return { success: false, error: "MFA not enabled" };
      }

      const secret = decryptField(encryptedSecret);
      const valid = verifyTOTP(secret, input.code);

      if (!valid) {
        return { success: false, error: "Invalid code" };
      }

      await db.updateUser(ctx.user.id, {
        notificationPreferences: {
          ...prefs,
          _mfaSecret: undefined,
          _mfaEnabled: false,
          _mfaBackupCodes: undefined,
        } as any,
      });

      await logAuditEvent(ctx.user.id, "auth.mfa_enabled", {
        step: "disabled",
      });

      return { success: true };
    }),

  // ─── GDPR ──────────────────────────────────────────────────────

  /**
   * Export all user data (GDPR Right to Access).
   */
  gdprExport: protectedProcedure.mutation(async ({ ctx }) => {
    await logAuditEvent(ctx.user.id, "gdpr.data_export", {});
    const data = await exportUserData(ctx.user.id);
    return data;
  }),

  /**
   * Request data deletion (GDPR Right to Erasure).
   * Requires confirmation.
   */
  gdprDelete: protectedProcedure
    .input(z.object({
      confirmPhrase: z.literal("DELETE MY DATA"),
    }))
    .mutation(async ({ ctx }) => {
      await logAuditEvent(ctx.user.id, "gdpr.data_deletion", {
        initiatedBy: "user",
      });
      const result = await deleteUserData(ctx.user.id);
      return result;
    }),

  // ─── Audit Logs ────────────────────────────────────────────────

  /**
   * Get audit logs for the current user's organization (admin only).
   */
  getAuditLogs: adminProcedure
    .input(z.object({
      limit: z.number().min(1).max(200).optional(),
      action: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const orgId = (ctx.user as any).orgId;
      if (!orgId) return [];
      return db.getAuditLogs(orgId, input?.limit || 50);
    }),

  /**
   * Get audit logs for a specific user (admin only).
   */
  getUserAuditLogs: adminProcedure
    .input(z.object({
      userId: z.number(),
      limit: z.number().min(1).max(200).optional(),
    }))
    .query(async ({ input }) => {
      return db.getAuditLogsByUser(input.userId, input.limit || 50);
    }),
});
