import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "../db";

const CONSENT_TYPES = [
  "terms_of_service",
  "privacy_policy",
  "marketing_emails",
  "analytics_tracking",
  "data_processing",
  "third_party_sharing",
] as const;

const consentTypeSchema = z.enum(CONSENT_TYPES);

export const consentRouter = router({
  /** Get all consent records for the current user */
  getMyConsents: protectedProcedure.query(async ({ ctx }) => {
    const records = await db.getUserConsents(ctx.user.id);
    // Build a map of consent type → status for easy UI consumption
    const consentMap: Record<string, { granted: boolean; grantedAt: number | null; withdrawnAt: number | null; version: string | null }> = {};
    for (const type of CONSENT_TYPES) {
      const record = records.find((r: any) => r.consentType === type);
      consentMap[type] = {
        granted: record?.granted ?? false,
        grantedAt: record?.grantedAt ?? null,
        withdrawnAt: record?.withdrawnAt ?? null,
        version: record?.version ?? null,
      };
    }
    return {
      consents: consentMap,
      availableTypes: CONSENT_TYPES,
      raw: records,
    };
  }),

  /** Record or update a consent decision */
  updateConsent: protectedProcedure
    .input(
      z.object({
        consentType: consentTypeSchema,
        granted: z.boolean(),
        version: z.string().max(32).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await db.upsertConsent({
        userId: ctx.user.id,
        consentType: input.consentType,
        granted: input.granted,
        ipAddress: null, // Could be extracted from request in production
        userAgent: null,
        version: input.version ?? "1.0",
      });

      await db.createAuditLog({
        userId: ctx.user.id,
        action: input.granted ? "consent.granted" : "consent.withdrawn",
        resourceType: "consent",
        details: {
          consentType: input.consentType,
          granted: input.granted,
          version: input.version ?? "1.0",
        } as any,
      });

      return { success: true };
    }),

  /** Batch update multiple consents at once (e.g., during signup) */
  batchUpdate: protectedProcedure
    .input(
      z.object({
        consents: z.array(
          z.object({
            consentType: consentTypeSchema,
            granted: z.boolean(),
            version: z.string().max(32).optional(),
          })
        ),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const results = [];
      for (const consent of input.consents) {
        await db.upsertConsent({
          userId: ctx.user.id,
          consentType: consent.consentType,
          granted: consent.granted,
          ipAddress: null,
          userAgent: null,
          version: consent.version ?? "1.0",
        });
        results.push({ consentType: consent.consentType, granted: consent.granted });
      }

      await db.createAuditLog({
        userId: ctx.user.id,
        action: "consent.batch_update",
        resourceType: "consent",
        details: { consents: results } as any,
      });

      return { success: true, updated: results.length };
    }),

  /** Withdraw a specific consent */
  withdraw: protectedProcedure
    .input(z.object({ consentType: consentTypeSchema }))
    .mutation(async ({ input, ctx }) => {
      await db.withdrawConsent(ctx.user.id, input.consentType);

      await db.createAuditLog({
        userId: ctx.user.id,
        action: "consent.withdrawn",
        resourceType: "consent",
        details: { consentType: input.consentType } as any,
      });

      return { success: true };
    }),

  /** Get consent policy metadata (public, no auth required) */
  getPolicyInfo: publicProcedure.query(async () => {
    return {
      types: CONSENT_TYPES.map((type) => ({
        id: type,
        label: formatConsentLabel(type),
        description: getConsentDescription(type),
        required: isRequiredConsent(type),
        currentVersion: "1.0",
      })),
      lastUpdated: "2026-03-30",
    };
  }),
});

// ─── Helpers ────────────────────────────────────────────────────────
function formatConsentLabel(type: string): string {
  const labels: Record<string, string> = {
    terms_of_service: "Terms of Service",
    privacy_policy: "Privacy Policy",
    marketing_emails: "Marketing Communications",
    analytics_tracking: "Analytics & Usage Tracking",
    data_processing: "Data Processing Agreement",
    third_party_sharing: "Third-Party Data Sharing",
  };
  return labels[type] ?? type;
}

function getConsentDescription(type: string): string {
  const descriptions: Record<string, string> = {
    terms_of_service: "I agree to the Terms of Service governing the use of LearnShift platform.",
    privacy_policy: "I acknowledge and agree to the Privacy Policy describing how my data is collected and used.",
    marketing_emails: "I consent to receiving marketing emails, product updates, and promotional content.",
    analytics_tracking: "I consent to anonymized analytics tracking to help improve the platform experience.",
    data_processing: "I consent to the processing of my personal data as described in the Data Processing Agreement.",
    third_party_sharing: "I consent to sharing my data with trusted third-party partners for service delivery.",
  };
  return descriptions[type] ?? "";
}

function isRequiredConsent(type: string): boolean {
  return ["terms_of_service", "privacy_policy", "data_processing"].includes(type);
}
