import { publicProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { subscriptions, payments, auditLogs } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

export const paymentWebhookRouter = router({
  handleSmarthinkerz: publicProcedure
    .input(
      z.object({
        status: z.enum(["paid", "failed", "cancelled", "refunded"]),
        order_id: z.string(),
        tap_id: z.string().optional(),
        external_ref: z.string().optional(),
        amount: z.number().optional(),
        currency: z.string().optional(),
        plan: z.string().optional(),
        customer_email: z.string().email().optional(),
        timestamp: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();

      try {
        if (!db) {
          return { success: false, message: "Database connection failed" };
        }

        // Find the payment record by externalChargeId (maps to our external_ref or order_id)
        const externalRef = input.external_ref || input.tap_id || input.order_id;
        if (!externalRef) {
          return { success: false, message: "Missing payment reference" };
        }

        const paymentRecords = await db
          .select()
          .from(payments)
          .where(eq(payments.externalChargeId, externalRef))
          .limit(1);

        if (!paymentRecords || paymentRecords.length === 0) {
          return { success: false, message: "Payment record not found" };
        }

        const payment = paymentRecords[0];
        const now = new Date();
        const nowMs = Date.now(); // milliseconds for database timestamps

        if (input.status === "paid") {
          // Update payment as succeeded
          await db
            .update(payments)
            .set({
              status: "succeeded",
              externalChargeId: input.tap_id || externalRef,
              paidAt: nowMs,
            })
            .where(eq(payments.id, payment.id));

          // Find and activate the subscription if it exists
          if (payment.subscriptionId) {
            const subs = await db
              .select()
              .from(subscriptions)
              .where(eq(subscriptions.id, payment.subscriptionId))
              .limit(1);

            if (subs && subs.length > 0) {
              const sub = subs[0];
              const currentPeriodStart = nowMs;
              let currentPeriodEnd = nowMs;

              // Calculate end date based on billing cycle from plan or metadata
              const billingCycle = (payment.metadata as Record<string, unknown>)?.billingCycle || "monthly";

              if (billingCycle === "monthly") {
                currentPeriodEnd = nowMs + 30 * 24 * 60 * 60 * 1000;
              } else if (billingCycle === "yearly") {
                currentPeriodEnd = nowMs + 365 * 24 * 60 * 60 * 1000;
              } else if (billingCycle === "one-time") {
                currentPeriodEnd = nowMs + 100 * 365 * 24 * 60 * 60 * 1000; // Lifetime
              }

              await db
                .update(subscriptions)
                .set({
                  status: "active",
                  currentPeriodStart: currentPeriodStart,
                  currentPeriodEnd: currentPeriodEnd,
                  externalPaymentId: input.tap_id || externalRef,
                  updatedAt: now,
                })
                .where(eq(subscriptions.id, sub.id));
            }
          }

          // Log the payment in audit logs
          await db.insert(auditLogs).values({
            action: "payment_received",
            resourceType: "payment",
            resourceId: payment.id,
            details: {
              orderId: input.order_id,
              tapId: input.tap_id,
              amount: input.amount,
              currency: input.currency,
              plan: input.plan,
            },
          });

          return { success: true, message: "Subscription activated" };
        } else if (input.status === "failed") {
          // Update payment as failed
          await db
            .update(payments)
            .set({
              status: "failed",
            })
            .where(eq(payments.id, payment.id));

          // Log the failed payment
          await db.insert(auditLogs).values({
            action: "payment_failed",
            resourceType: "payment",
            resourceId: payment.id,
            details: {
              orderId: input.order_id,
              tapId: input.tap_id,
              amount: input.amount,
              currency: input.currency,
            },
          });

          return { success: true, message: "Payment failure recorded" };
        } else if (input.status === "cancelled") {
          // Update payment as failed (no cancelled status in schema, treat as failed)
          await db
            .update(payments)
            .set({
              status: "failed",
            })
            .where(eq(payments.id, payment.id));

          // Log the cancellation
          await db.insert(auditLogs).values({
            action: "payment_cancelled",
            resourceType: "payment",
            resourceId: payment.id,
            details: {
              orderId: input.order_id,
              tapId: input.tap_id,
            },
          });

          return { success: true, message: "Payment cancellation recorded" };
        } else if (input.status === "refunded") {
          // Update payment as refunded
          await db
            .update(payments)
            .set({
              status: "refunded",
            })
            .where(eq(payments.id, payment.id));

          // End the subscription if it exists
          if (payment.subscriptionId) {
            const subs = await db
              .select()
              .from(subscriptions)
              .where(eq(subscriptions.id, payment.subscriptionId))
              .limit(1);

            if (subs && subs.length > 0) {
              const sub = subs[0];
              await db
                .update(subscriptions)
                .set({
                  status: "canceled",
                  canceledAt: nowMs,
                  updatedAt: now,
                })
                .where(eq(subscriptions.id, sub.id));
            }
          }

          // Log the refund
          await db.insert(auditLogs).values({
            action: "payment_refunded",
            resourceType: "payment",
            resourceId: payment.id,
            details: {
              orderId: input.order_id,
              tapId: input.tap_id,
              amount: input.amount,
              currency: input.currency,
            },
          });

          return { success: true, message: "Refund recorded" };
        }

        return { success: false, message: "Unknown payment status" };
      } catch (error) {
        console.error("Webhook error:", error);
        return { success: false, message: "Webhook processing failed" };
      }
    }),
});
