/**
 * Tap Payment Gateway Integration
 *
 * This module provides a clean interface to the Tap payment API.
 * Tap is a MENA-region payment gateway supporting cards, Apple Pay,
 * Samsung Pay, and local payment methods.
 *
 * API Reference: https://developers.tap.company/reference
 *
 * To activate:
 * 1. Set TAP_SECRET_KEY (sk_test_... or sk_live_...)
 * 2. Set TAP_PUBLIC_KEY (pk_test_... or pk_live_...)
 * 3. Optionally set TAP_WEBHOOK_SECRET for webhook signature verification
 */

import { ENV } from "./_core/env";

const TAP_API_BASE = "https://api.tap.company/v2";

// ─── Types ──────────────────────────────────────────────────────────

export interface TapChargeRequest {
  amount: number; // in the currency's smallest unit (e.g. 3.95 for $3.95)
  currency: string; // "USD", "KWD", "SAR", "BHD", "AED", etc.
  customer: {
    first_name: string;
    last_name?: string;
    email: string;
    phone?: { country_code: string; number: string };
  };
  source: { id: string }; // "src_all" for redirect, or token from goSell.js
  redirect: { url: string }; // URL to redirect after payment
  post?: { url: string }; // Webhook URL for charge updates
  description?: string;
  metadata?: Record<string, string>;
  receipt?: { email: boolean; sms: boolean };
  reference?: { transaction: string; order: string };
}

export interface TapChargeResponse {
  id: string; // chg_TS...
  status: "INITIATED" | "AUTHORIZED" | "CAPTURED" | "VOID" | "REFUNDED" | "DECLINED" | "RESTRICTED" | "CANCELLED";
  amount: number;
  currency: string;
  customer: { id: string; first_name: string; email: string };
  source: { id: string; type: string; payment_method: string };
  redirect: { status: string; url: string };
  transaction: { url: string; created: string; timezone: string; authorization_id: string };
  reference?: { transaction: string; order: string };
  receipt?: { id: string; email: boolean };
  metadata?: Record<string, string>;
  response?: { code: string; message: string };
}

export interface TapCustomerRequest {
  first_name: string;
  last_name?: string;
  email: string;
  phone?: { country_code: string; number: string };
  metadata?: Record<string, string>;
}

export interface TapCustomerResponse {
  id: string; // cus_TS...
  first_name: string;
  email: string;
  phone?: { country_code: string; number: string };
}

// ─── Helpers ────────────────────────────────────────────────────────

function getHeaders() {
  if (!ENV.tapSecretKey) {
    throw new Error(
      "TAP_SECRET_KEY is not configured. Please set it in your environment variables."
    );
  }
  return {
    Authorization: `Bearer ${ENV.tapSecretKey}`,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

export function isTapConfigured(): boolean {
  return Boolean(ENV.tapSecretKey && ENV.tapPublicKey);
}

// ─── Charges ────────────────────────────────────────────────────────

/**
 * Create a new charge (payment).
 * For redirect-based flow, use source.id = "src_all" and provide redirect.url.
 * For token-based flow (goSell.js), pass the token as source.id.
 */
export async function createCharge(
  params: TapChargeRequest
): Promise<TapChargeResponse> {
  const res = await fetch(`${TAP_API_BASE}/charges`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      `Tap API error (${res.status}): ${JSON.stringify(error)}`
    );
  }

  return res.json();
}

/**
 * Retrieve a charge by ID to check its status.
 */
export async function getCharge(chargeId: string): Promise<TapChargeResponse> {
  const res = await fetch(`${TAP_API_BASE}/charges/${chargeId}`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      `Tap API error (${res.status}): ${JSON.stringify(error)}`
    );
  }

  return res.json();
}

// ─── Customers ──────────────────────────────────────────────────────

/**
 * Create a Tap customer for recurring billing.
 */
export async function createCustomer(
  params: TapCustomerRequest
): Promise<TapCustomerResponse> {
  const res = await fetch(`${TAP_API_BASE}/customers`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(params),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      `Tap API error (${res.status}): ${JSON.stringify(error)}`
    );
  }

  return res.json();
}

/**
 * Retrieve a Tap customer by ID.
 */
export async function getCustomer(
  customerId: string
): Promise<TapCustomerResponse> {
  const res = await fetch(`${TAP_API_BASE}/customers/${customerId}`, {
    method: "GET",
    headers: getHeaders(),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(
      `Tap API error (${res.status}): ${JSON.stringify(error)}`
    );
  }

  return res.json();
}

// ─── Webhook Verification ───────────────────────────────────────────

/**
 * Verify a Tap webhook signature.
 * Tap sends a hashstring in the header that can be verified.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string
): boolean {
  if (!ENV.tapWebhookSecret) {
    console.warn("[TapPayment] No webhook secret configured, skipping verification");
    return true; // Skip verification if no secret is set
  }

  // Tap uses HMAC-SHA256 for webhook verification
  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", ENV.tapWebhookSecret)
    .update(payload)
    .digest("hex");

  return signature === expectedSignature;
}

// ─── Checkout Session Builder ───────────────────────────────────────

/**
 * Build a checkout charge request for a subscription plan.
 * This creates a redirect-based payment flow.
 */
export function buildSubscriptionCharge(params: {
  planName: string;
  amount: number; // in dollars (e.g. 8.95)
  currency?: string;
  customerEmail: string;
  customerName: string;
  orgId: number;
  planId: number;
  redirectUrl: string;
  webhookUrl?: string;
}): TapChargeRequest {
  const [firstName, ...lastParts] = params.customerName.split(" ");
  const lastName = lastParts.join(" ") || undefined;

  return {
    amount: params.amount,
    currency: params.currency || "USD",
    customer: {
      first_name: firstName,
      last_name: lastName,
      email: params.customerEmail,
    },
    source: { id: "src_all" }, // Redirect to Tap payment page
    redirect: { url: params.redirectUrl },
    ...(params.webhookUrl ? { post: { url: params.webhookUrl } } : {}),
    description: `Smarthinkerz LearnShift - ${params.planName} Plan`,
    metadata: {
      orgId: String(params.orgId),
      planId: String(params.planId),
      type: "subscription",
    },
    receipt: { email: true, sms: false },
    reference: {
      transaction: `sub_${params.orgId}_${params.planId}_${Date.now()}`,
      order: `ord_${params.orgId}_${Date.now()}`,
    },
  };
}
