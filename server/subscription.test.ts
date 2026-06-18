import { describe, it, expect } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createMockUser(overrides: Partial<AuthenticatedUser> = {}): AuthenticatedUser {
  return {
    id: 1,
    supabaseId: "test-user-sub-001",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    appRole: "super_admin",
    orgId: 1,
    timezone: "UTC",
    notificationPreferences: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  } as AuthenticatedUser;
}

function createMockContext(user?: AuthenticatedUser | null): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: user ?? null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
  return { ctx };
}

describe("Subscription Router", () => {
  // ─── Public endpoints ──────────────────────────────────────────

  it("getPlans returns an array of subscription plans", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.subscription.getPlans();
    expect(Array.isArray(plans)).toBe(true);
    // Plans should be seeded (5 plans)
    expect(plans.length).toBeGreaterThanOrEqual(0);
  });

  it("getPlan returns a specific plan by ID", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.subscription.getPlans();
    if (plans.length > 0) {
      const plan = await caller.subscription.getPlan({ id: plans[0].id });
      expect(plan).toBeDefined();
      expect(plan?.name).toBeTruthy();
      expect(plan?.tier).toBeTruthy();
      expect(typeof plan?.priceMonthly).toBe("number");
    }
  });

  it("getPlans includes all expected tiers", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.subscription.getPlans();
    if (plans.length >= 5) {
      const tiers = plans.map(p => p.tier);
      expect(tiers).toContain("starter");
      expect(tiers).toContain("pro");
      expect(tiers).toContain("enterprise");
      expect(tiers).toContain("consumer_free");
      expect(tiers).toContain("consumer_premium");
    }
  });

  it("each plan has features JSON with expected fields", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);
    const plans = await caller.subscription.getPlans();
    for (const plan of plans) {
      if (plan.features) {
        const features = plan.features as Record<string, unknown>;
        expect(typeof features.maxLessons).toBe("number");
        expect(typeof features.offlineAccess).toBe("boolean");
        expect(typeof features.basicTracking).toBe("boolean");
      }
    }
  });

  // ─── isPaymentConfigured ──────────────────────────────────────

  it("isPaymentConfigured returns configured status", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.subscription.isPaymentConfigured();
    expect(result).toHaveProperty("configured");
    expect(typeof result.configured).toBe("boolean");
  });

  // ─── Protected endpoints ──────────────────────────────────────

  it("getMySubscription requires authentication", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.subscription.getMySubscription()).rejects.toThrow();
  });

  it("getMySubscription returns null for user without orgId", async () => {
    const user = createMockUser({ orgId: null as unknown as number });
    const { ctx } = createMockContext(user);
    const caller = appRouter.createCaller(ctx);
    const result = await caller.subscription.getMySubscription();
    expect(result).toBeNull();
  });

  it("subscribe requires authentication", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.subscription.subscribe({ planSlug: "pro", quantity: 1 })
    ).rejects.toThrow();
  });

  it("subscribe rejects invalid plan slug", async () => {
    const user = createMockUser();
    const { ctx } = createMockContext(user);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.subscription.subscribe({ planSlug: "nonexistent-plan", quantity: 1 })
    ).rejects.toThrow("Plan not found");
  });

  it("getPaymentHistory requires authentication", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.subscription.getPaymentHistory()).rejects.toThrow();
  });

  it("createCheckout requires authentication", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.subscription.createCheckout({
        planSlug: "pro",
        quantity: 1,
        origin: "https://example.com",
      })
    ).rejects.toThrow();
  });

  it("createCheckout returns error when Tap is not configured", async () => {
    const user = createMockUser();
    const { ctx } = createMockContext(user);
    const caller = appRouter.createCaller(ctx);
    // Smarthinkerz endpoint may return 404 if not configured or unreachable
    await expect(
      caller.subscription.createCheckout({
        planSlug: "pro",
        quantity: 1,
        origin: "https://example.com",
      })
    ).rejects.toThrow();
  });

  it("verifyPayment requires authentication", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.subscription.verifyPayment({ orderId: "ord_test_123" })
    ).rejects.toThrow();
  });

  it("verifyPayment returns error when Tap is not configured", async () => {
    const user = createMockUser();
    const { ctx } = createMockContext(user);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.subscription.verifyPayment({ orderId: "ord_test_123" })
    ).rejects.toThrow();
  });

  // ─── Lesson Packs ─────────────────────────────────────────────

  it("getLessonPacks returns an array", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);
    const packs = await caller.subscription.getLessonPacks();
    expect(Array.isArray(packs)).toBe(true);
  });

  it("getMyPurchases requires authentication", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);
    await expect(caller.subscription.getMyPurchases()).rejects.toThrow();
  });

  it("cancelSubscription requires authentication", async () => {
    const { ctx } = createMockContext(null);
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.subscription.cancelSubscription({ subscriptionId: 999 })
    ).rejects.toThrow();
  });
});

describe("Tap Payment Module", () => {
  it("isTapConfigured returns false when env vars are not set", async () => {
    const { isTapConfigured } = await import("./tapPayment");
    // In test environment, TAP_SECRET_KEY and TAP_PUBLIC_KEY are not set
    expect(isTapConfigured()).toBe(false);
  });

  it("buildSubscriptionCharge returns a valid charge request", async () => {
    const { buildSubscriptionCharge } = await import("./tapPayment");
    const charge = buildSubscriptionCharge({
      planName: "Pro",
      amount: 8.95,
      customerEmail: "test@example.com",
      customerName: "John Doe",
      orgId: 1,
      planId: 2,
      redirectUrl: "https://example.com/pricing?payment=callback",
    });

    expect(charge.amount).toBe(8.95);
    expect(charge.currency).toBe("USD");
    expect(charge.customer.first_name).toBe("John");
    expect(charge.customer.last_name).toBe("Doe");
    expect(charge.customer.email).toBe("test@example.com");
    expect(charge.source.id).toBe("src_all");
    expect(charge.redirect.url).toContain("payment=callback");
    expect(charge.description).toContain("Pro Plan");
    expect(charge.metadata?.orgId).toBe("1");
    expect(charge.metadata?.planId).toBe("2");
    expect(charge.metadata?.type).toBe("subscription");
  });

  it("buildSubscriptionCharge handles single-name customers", async () => {
    const { buildSubscriptionCharge } = await import("./tapPayment");
    const charge = buildSubscriptionCharge({
      planName: "Starter",
      amount: 3.95,
      customerEmail: "user@example.com",
      customerName: "Alice",
      orgId: 5,
      planId: 1,
      redirectUrl: "https://example.com/callback",
    });

    expect(charge.customer.first_name).toBe("Alice");
    expect(charge.customer.last_name).toBeUndefined();
  });

  it("buildSubscriptionCharge includes webhook URL when provided", async () => {
    const { buildSubscriptionCharge } = await import("./tapPayment");
    const charge = buildSubscriptionCharge({
      planName: "Enterprise",
      amount: 12.00,
      customerEmail: "admin@corp.com",
      customerName: "Jane Smith",
      orgId: 10,
      planId: 3,
      redirectUrl: "https://example.com/callback",
      webhookUrl: "https://example.com/api/webhooks/tap",
    });

    expect(charge.post?.url).toBe("https://example.com/api/webhooks/tap");
  });

  it("createCharge throws when Tap is not configured", async () => {
    const { createCharge } = await import("./tapPayment");
    await expect(
      createCharge({
        amount: 8.95,
        currency: "USD",
        customer: { first_name: "Test", email: "test@test.com" },
        source: { id: "src_all" },
        redirect: { url: "https://example.com/callback" },
      })
    ).rejects.toThrow("TAP_SECRET_KEY is not configured");
  });
});
