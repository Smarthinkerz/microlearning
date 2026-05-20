import { getDb } from "./db";
import { subscriptions, payments } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export interface SmarthinkerPaymentWebhook {
  status: "paid" | "failed" | "refunded" | "pending";
  order_id: string;
  tap_id: string;
  external_ref?: string;
  amount?: number;
  currency?: string;
  timestamp?: string;
}

/**
 * Verify webhook signature (basic validation)
 * In production, implement HMAC-SHA256 verification with Smarthinkerz webhook secret
 */
export function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  // TODO: Implement HMAC-SHA256 verification
  // For now, return true - implement with: crypto.createHmac('sha256', secret).update(payload).digest('hex') === signature
  return true;
}

/**
 * Process Smarthinkerz payment webhook
 */
export async function processSmarthinkerWebhook(webhook: SmarthinkerPaymentWebhook) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  const { status, order_id, tap_id } = webhook;

  try {
    // Find payment by externalChargeId (order_id)
    const paymentResult = await db
      .select()
      .from(payments)
      .where(eq(payments.externalChargeId, order_id))
      .limit(1);

    const payment = paymentResult[0];

    if (!payment) {
      console.error(`[Webhook] Payment not found for order_id: ${order_id}`);
      return { success: false, error: "Payment not found" };
    }

    // Update payment status
    const statusMap: Record<string, "pending" | "succeeded" | "failed" | "refunded"> = {
      paid: "succeeded",
      failed: "failed",
      refunded: "refunded",
      pending: "pending",
    };

    const paidAtTime = status === "paid" ? Date.now() : null;

    await db
      .update(payments)
      .set({
        status: statusMap[status] || "pending",
        externalChargeId: tap_id,
        paidAt: paidAtTime,
      })
      .where(eq(payments.id, payment.id));

    // Auto-activate subscription if payment succeeded
    if (status === "paid" && payment.subscriptionId) {
      const subscriptionResult = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.id, payment.subscriptionId))
        .limit(1);

      const subscription = subscriptionResult[0];

      if (subscription && subscription.status !== "active") {
        const startDate = Date.now();
        const endDate = startDate + 30 * 24 * 60 * 60 * 1000; // 30 days

        await db
          .update(subscriptions)
          .set({
            status: "active",
            currentPeriodStart: startDate,
            currentPeriodEnd: endDate,
          })
          .where(eq(subscriptions.id, payment.subscriptionId));

        console.log(`[Webhook] Subscription ${subscription.id} activated for payment ${payment.id}`);
      }
    }

    return { success: true, message: `Payment ${status} processed successfully` };
  } catch (error) {
    console.error("[Webhook] Error processing payment:", error);
    throw error;
  }
}

/**
 * Handle duplicate webhook deliveries (idempotency)
 */
export async function isDuplicateWebhook(order_id: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const paymentResult = await db
    .select()
    .from(payments)
    .where(eq(payments.externalChargeId, order_id))
    .limit(1);

  return paymentResult.length > 0;
}
