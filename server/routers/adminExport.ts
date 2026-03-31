import { z } from "zod";
import { router, adminProcedure } from "../_core/trpc";
import {
  getAllUsers,
  getUserConsents,
  getPaymentsByOrg,
  getShiftsByUser,
  getOrgSubscription,
  getCertificatesByUser,
  getAttemptsByUser,
} from "../db";

// ─── CSV Helpers ────────────────────────────────────────────────────
function escapeCsv(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(fields: unknown[]): string {
  return fields.map(escapeCsv).join(",");
}

function formatTimestamp(ts: number | null | undefined): string {
  if (!ts) return "";
  return new Date(ts).toISOString();
}

// ─── Export Types ───────────────────────────────────────────────────
const CONSENT_TYPES = [
  "essential_cookies",
  "analytics_tracking",
  "marketing_communications",
  "data_sharing",
  "ai_personalization",
];

export const adminExportRouter = router({
  // Export all users with their data as CSV
  exportUsers: adminProcedure
    .input(
      z.object({
        includeConsents: z.boolean().default(true),
        includePayments: z.boolean().default(true),
        includeShifts: z.boolean().default(false),
        includeCertificates: z.boolean().default(false),
        includeAttempts: z.boolean().default(false),
      }).optional()
    )
    .mutation(async ({ input }) => {
      const opts = input || { includeConsents: true, includePayments: true, includeShifts: false, includeCertificates: false, includeAttempts: false };
      const users = await getAllUsers();

      // Build header
      const headers: string[] = [
        "user_id", "name", "email", "role", "app_role", "org_id",
        "timezone", "created_at", "last_login_at",
      ];

      if (opts.includeConsents) {
        for (const ct of CONSENT_TYPES) {
          headers.push(`consent_${ct}`);
          headers.push(`consent_${ct}_date`);
        }
      }

      if (opts.includePayments) {
        headers.push("subscription_plan", "subscription_status", "subscription_start",
          "total_payments", "total_amount_paid");
      }

      if (opts.includeShifts) {
        headers.push("total_shifts", "next_shift_start", "primary_shift_type");
      }

      if (opts.includeCertificates) {
        headers.push("total_certificates", "latest_certificate_date");
      }

      if (opts.includeAttempts) {
        headers.push("total_attempts", "completed_attempts", "avg_score");
      }

      const rows: string[] = [toCsvRow(headers)];

      for (const user of users) {
        const fields: unknown[] = [
          user.id,
          user.name,
          user.email,
          user.role,
          user.appRole,
          user.orgId,
          user.timezone,
          formatTimestamp(user.createdAt instanceof Date ? user.createdAt.getTime() : user.createdAt),
          formatTimestamp(user.lastSignedIn instanceof Date ? user.lastSignedIn.getTime() : user.lastSignedIn),
        ];

        // Consent data
        if (opts.includeConsents) {
          try {
            const consents = await getUserConsents(user.id);
            const consentMap = new Map<string, { granted: boolean | null; updatedAt: any }>();
            for (const c of consents) {
              consentMap.set(c.consentType, { granted: c.granted, updatedAt: c.updatedAt });
            }
            for (const ct of CONSENT_TYPES) {
              const entry = consentMap.get(ct);
              fields.push(entry ? (entry.granted ? "granted" : "withdrawn") : "not_set");
              const upAt = entry?.updatedAt;
              fields.push(upAt ? formatTimestamp(upAt instanceof Date ? upAt.getTime() : upAt) : "");
            }
          } catch {
            for (const _ct of CONSENT_TYPES) {
              fields.push("error");
              fields.push("");
            }
          }
        }

        // Payment data
        if (opts.includePayments) {
          try {
            const orgId = user.orgId || 0;
            let planName = "";
            let subStatus = "";
            let subStart = "";
            let totalPayments = 0;
            let totalAmount = 0;

            if (orgId > 0) {
              const sub = await getOrgSubscription(orgId);
              if (sub) {
                planName = (sub as any).planName || String((sub as any).planId || "");
                subStatus = (sub as any).status || "";
                subStart = formatTimestamp((sub as any).startDate);
              }

              const payments = await getPaymentsByOrg(orgId);
              totalPayments = payments.length;
              totalAmount = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
            }

            fields.push(planName, subStatus, subStart, totalPayments, totalAmount / 100);
          } catch {
            fields.push("", "", "", 0, 0);
          }
        }

        // Shift data
        if (opts.includeShifts) {
          try {
            const now = Date.now();
            const shifts = await getShiftsByUser(user.id, now - 30 * 86400000, now + 30 * 86400000);
            const futureShifts = shifts.filter((s: any) => s.startTime > now);
            const nextShift = futureShifts.length > 0 ? futureShifts[0] : null;

            // Find primary shift type
            const typeCounts = new Map<string, number>();
            for (const s of shifts) {
              const t = (s as any).shiftType || "unknown";
              typeCounts.set(t, (typeCounts.get(t) || 0) + 1);
            }
            let primaryType = "";
            let maxCount = 0;
            for (const [type, count] of Array.from(typeCounts.entries())) {
              if (count > maxCount) { primaryType = type; maxCount = count; }
            }

            fields.push(shifts.length, nextShift ? formatTimestamp((nextShift as any).startTime) : "", primaryType);
          } catch {
            fields.push(0, "", "");
          }
        }

        // Certificate data
        if (opts.includeCertificates) {
          try {
            const certs = await getCertificatesByUser(user.id);
            const latestDate = certs.length > 0
              ? Math.max(...certs.map((c: any) => {
                  const t = c.issuedAt;
                  return t instanceof Date ? t.getTime() : (t || 0);
                }))
              : null;
            fields.push(certs.length, latestDate ? formatTimestamp(latestDate) : "");
          } catch {
            fields.push(0, "");
          }
        }

        // Attempt data
        if (opts.includeAttempts) {
          try {
            const attempts = await getAttemptsByUser(user.id);
            const completed = attempts.filter((a: any) => a.status === "completed");
            const avgScore = completed.length > 0
              ? completed.reduce((sum: number, a: any) => sum + (a.score || 0), 0) / completed.length
              : 0;
            fields.push(attempts.length, completed.length, Math.round(avgScore * 100) / 100);
          } catch {
            fields.push(0, 0, 0);
          }
        }

        rows.push(toCsvRow(fields));
      }

      return {
        csv: rows.join("\n"),
        filename: `learnshift_users_export_${new Date().toISOString().split("T")[0]}.csv`,
        totalUsers: users.length,
      };
    }),

  // Export consent records only
  exportConsents: adminProcedure.mutation(async () => {
    const users = await getAllUsers();
    const headers = ["user_id", "user_name", "user_email", "consent_type", "status", "updated_at"];
    const rows: string[] = [toCsvRow(headers)];

    for (const user of users) {
      try {
        const consents = await getUserConsents(user.id);
        if (consents.length === 0) {
          // Add a row showing no consents recorded
          for (const ct of CONSENT_TYPES) {
            rows.push(toCsvRow([user.id, user.name, user.email, ct, "not_set", ""]));
          }
        } else {
          for (const c of consents) {
            rows.push(toCsvRow([
              user.id, user.name, user.email,
              c.consentType,
              c.granted ? "granted" : "withdrawn",
              formatTimestamp(c.updatedAt instanceof Date ? c.updatedAt.getTime() : c.updatedAt),
            ]));
          }
        }
      } catch {
        rows.push(toCsvRow([user.id, user.name, user.email, "error", "error", ""]));
      }
    }

    return {
      csv: rows.join("\n"),
      filename: `learnshift_consents_export_${new Date().toISOString().split("T")[0]}.csv`,
      totalRecords: rows.length - 1,
    };
  }),

  // Export payment history
  exportPayments: adminProcedure.mutation(async () => {
    const headers = [
      "payment_id", "org_id", "plan_id", "amount", "currency",
      "status", "payment_method", "external_charge_id",
      "created_at", "paid_at",
    ];
    const rows: string[] = [toCsvRow(headers)];

    // Get all payments via admin function
    const { getAllPaymentsAdmin } = await import("../db");
    const payments = await getAllPaymentsAdmin();

    for (const p of payments) {
      rows.push(toCsvRow([
        p.id,
        p.orgId,
        (p as any).planId || p.subscriptionId || "",
        (p.amount || 0) / 100,
        p.currency || "USD",
        p.status,
        p.paymentMethod || "",
        p.externalChargeId || "",
        formatTimestamp(p.createdAt instanceof Date ? p.createdAt.getTime() : p.createdAt),
        formatTimestamp((p.paidAt as any) instanceof Date ? (p.paidAt as any).getTime() : p.paidAt),
      ]));
    }

    return {
      csv: rows.join("\n"),
      filename: `learnshift_payments_export_${new Date().toISOString().split("T")[0]}.csv`,
      totalRecords: payments.length,
    };
  }),
});
