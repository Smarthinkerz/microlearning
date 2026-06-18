import { Router, Request, Response } from "express";
import crypto from "crypto";
import { ENV } from "../_core/env";
import * as db from "../db";
import { notifyOwner } from "../_core/notification";

const tapWebhookRouter = Router();

// ─── Types ──────────────────────────────────────────────────────────
interface TapWebhookPayload {
  id: string;
  object: string;
  live: boolean;
  status: string;
  amount: number;
  currency: string;
  created: number;
  customer?: { id?: string; first_name?: string; last_name?: string; email?: string };
  metadata?: { orgId?: string; planId?: string; type?: string };
  reference?: { transaction?: string; order?: string };
  receipt?: { id?: string; email?: string };
  refund?: { id?: string; amount?: number; status?: string };
}

type WebhookEventType =
  | "charge.captured"
  | "charge.failed"
  | "charge.cancelled"
  | "refund.created"
  | "refund.completed";

// ─── Signature Verification ─────────────────────────────────────────
function verifyTapSignature(rawBody: string, signature: string | undefined): boolean {
  if (!ENV.tapWebhookSecret) {
    console.warn("[TapWebhook] No webhook secret configured — skipping verification in dev mode");
    return !ENV.isProduction;
  }
  if (!signature) {
    console.warn("[TapWebhook] Missing signature header");
    return false;
  }
  const expected = crypto.createHmac("sha256", ENV.tapWebhookSecret).update(rawBody).digest("hex");
  return crypto.timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex"));
}

// ─── Event Handlers ─────────────────────────────────────────────────
async function handleChargeCaptured(payload: TapWebhookPayload): Promise<void> {
  const payment = await db.getPaymentByExternalChargeId(payload.id);
  if (!payment) {
    console.warn(`[TapWebhook] No payment found for charge ${payload.id}`);
    return;
  }
  await db.updatePaymentStatus(payment.id, "succeeded");
  const orgId = payment.orgId;
  const sub = await db.getOrgSubscription(orgId);
  if (sub) {
    await db.updateSubscriptionStatus(sub.id, "active");
    if (payload.customer?.id) {
      await db.updateSubscriptionExternalIds(sub.id, {
        tapChargeId: payload.id,
        tapCustomerId: payload.customer.id,
      });
    }
  }
  await db.createAuditLog({
    userId: 0,
    action: "payment.captured",
    resourceType: "payment",
    resourceId: payment.id,
    details: { chargeId: payload.id, amount: payload.amount, currency: payload.currency, orgId } as any,
  });
  await notifyOwner({
    title: "Payment Captured",
    content: `Payment of ${payload.amount} ${payload.currency} captured for org #${orgId}. Subscription activated.`,
  }).catch(() => {});
}

async function handleChargeFailed(payload: TapWebhookPayload): Promise<void> {
  const payment = await db.getPaymentByExternalChargeId(payload.id);
  if (!payment) {
    console.warn(`[TapWebhook] No payment found for charge ${payload.id}`);
    return;
  }
  await db.updatePaymentStatus(payment.id, "failed");
  const orgId = payment.orgId;
  const sub = await db.getOrgSubscription(orgId);
  if (sub && sub.status === "active") {
    await db.updateSubscriptionStatus(sub.id, "past_due");
  }
  await db.createAuditLog({
    userId: 0,
    action: "payment.failed",
    resourceType: "payment",
    resourceId: payment.id,
    details: { chargeId: payload.id, amount: payload.amount, status: payload.status, orgId } as any,
  });
  await notifyOwner({
    title: "Payment Failed",
    content: `Payment of ${payload.amount} ${payload.currency} failed for org #${orgId}. Charge ID: ${payload.id}`,
  }).catch(() => {});
}

async function handleRefund(payload: TapWebhookPayload): Promise<void> {
  const payment = await db.getPaymentByExternalChargeId(payload.id);
  if (!payment) {
    console.warn(`[TapWebhook] No payment found for charge ${payload.id}`);
    return;
  }
  await db.updatePaymentStatus(payment.id, "refunded");
  const orgId = payment.orgId;
  const sub = await db.getOrgSubscription(orgId);
  if (sub) {
    await db.updateSubscriptionStatus(sub.id, "canceled");
  }
  await db.createAuditLog({
    userId: 0,
    action: "payment.refunded",
    resourceType: "payment",
    resourceId: payment.id,
    details: { chargeId: payload.id, refundAmount: payload.refund?.amount ?? payload.amount, orgId } as any,
  });
  await notifyOwner({
    title: "Payment Refunded",
    content: `Refund of ${payload.refund?.amount ?? payload.amount} ${payload.currency} processed for org #${orgId}. Subscription cancelled.`,
  }).catch(() => {});
}

// ─── Webhook Endpoint ───────────────────────────────────────────────
tapWebhookRouter.post("/tap", express_raw_handler);

async function express_raw_handler(req: Request, res: Response): Promise<void> {
  try {
    const rawBody = JSON.stringify(req.body);
    const signature = req.headers["hashstring"] as string | undefined;
    if (ENV.tapWebhookSecret && !verifyTapSignature(rawBody, signature)) {
      console.warn("[TapWebhook] Invalid signature — rejecting");
      res.status(401).json({ error: "Invalid signature" });
      return;
    }
    const payload = req.body as TapWebhookPayload;
    const eventType = determineEventType(payload);
    console.log(`[TapWebhook] Received event: ${eventType} for charge ${payload.id}`);
    switch (eventType) {
      case "charge.captured":
        await handleChargeCaptured(payload);
        break;
      case "charge.failed":
      case "charge.cancelled":
        await handleChargeFailed(payload);
        break;
      case "refund.created":
      case "refund.completed":
        await handleRefund(payload);
        break;
      default:
        console.log(`[TapWebhook] Unhandled event type: ${eventType}`);
    }
    res.status(200).json({ received: true });
  } catch (error) {
    console.error("[TapWebhook] Error processing webhook:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}

function determineEventType(payload: TapWebhookPayload): WebhookEventType {
  if (payload.refund?.id) {
    return payload.refund.status === "COMPLETED" ? "refund.completed" : "refund.created";
  }
  switch (payload.status?.toUpperCase()) {
    case "CAPTURED":
      return "charge.captured";
    case "FAILED":
    case "DECLINED":
      return "charge.failed";
    case "CANCELLED":
    case "CANCELED":
      return "charge.cancelled";
    default:
      return "charge.failed";
  }
}

export { tapWebhookRouter };
