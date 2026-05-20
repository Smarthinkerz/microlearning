import { router, protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { getDb } from "../db";
import { subscriptions, payments } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const paymentCallbackRouter = router({
  verifyPayment: protectedProcedure
    .input(
      z.object({
        orderId: z.string().min(1),
        tapId: z.string().optional(),
        externalRef: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }: any) => {
      try {
        const db = await getDb();
        if (!db) {
          return {
            success: false,
            message: "Database connection failed",
          };
        }

        // Find the payment by order ID
        const payment = await db
          .select()
          .from(payments)
          .where(eq(payments.externalChargeId, input.orderId))
          .limit(1);

        if (!payment || payment.length === 0) {
          return {
            success: false,
            message: "Payment not found",
          };
        }

        const paymentRecord = payment[0];

        // Verify the payment belongs to the user's organization
        if (paymentRecord.orgId !== ctx.user.orgId) {
          return {
            success: false,
            message: "Payment organization mismatch",
          };
        }

        // Update payment status to succeeded
        await db
          .update(payments)
          .set({
            status: "succeeded",
            paidAt: Date.now(),
          })
          .where(eq(payments.id, paymentRecord.id));

        // Get the subscription
        if (!paymentRecord.subscriptionId) {
          return {
            success: false,
            message: "Subscription not found for payment",
          };
        }

        const subscription = await db
          .select()
          .from(subscriptions)
          .where(eq(subscriptions.id, paymentRecord.subscriptionId))
          .limit(1);

        if (!subscription || subscription.length === 0) {
          return {
            success: false,
            message: "Subscription not found",
          };
        }

        // Activate the subscription
        const now = Date.now();
        const trialDays = 14;
        const trialEnds = now + trialDays * 24 * 60 * 60 * 1000;

        await db
          .update(subscriptions)
          .set({
            status: "active",
            currentPeriodStart: now as any,
            currentPeriodEnd: trialEnds as any,
            externalPaymentId: input.tapId || paymentRecord.externalChargeId,
            metadata: {
              ...(paymentRecord.metadata || {}),
              verifiedAt: new Date().toISOString(),
              externalRef: input.externalRef,
            },
          })
          .where(eq(subscriptions.id, paymentRecord.subscriptionId));

        // Log the successful payment
        console.log(
          `[Payment Callback] Payment verified for org ${paymentRecord.orgId}, subscription ${paymentRecord.subscriptionId}`
        );

        return {
          success: true,
          message: "Payment verified and subscription activated",
          orderId: input.orderId,
          subscriptionId: paymentRecord.subscriptionId,
        };
      } catch (error) {
        console.error("[Payment Callback] Error verifying payment:", error);
        return {
          success: false,
          message: "Error verifying payment",
        };
      }
    }),

  getPaymentStatus: protectedProcedure
    .input(z.object({ orderId: z.string() }))
    .query(async ({ input, ctx }: any) => {
      try {
        const db = await getDb();
        if (!db) {
          return { status: "unknown", message: "Database error" };
        }

        const payment = await db
          .select()
          .from(payments)
          .where(
            and(
              eq(payments.externalChargeId, input.orderId),
              eq(payments.orgId, ctx.user.orgId)
            )
          )
          .limit(1);

        if (!payment || payment.length === 0) {
          return { status: "not_found", message: "Payment not found" };
        }

        return {
          status: payment[0].status,
          amount: payment[0].amount,
          currency: payment[0].currency,
          createdAt: payment[0].createdAt,
        };
      } catch (error) {
        console.error("[Payment Status] Error:", error);
        return { status: "error", message: "Error fetching payment status" };
      }
    }),
});
