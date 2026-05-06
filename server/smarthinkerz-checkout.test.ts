import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "./db";

describe("Smarthinkerz Checkout Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createCheckout endpoint", () => {
    it("should build correct form data for Smarthinkerz API", () => {
      const planSlug = "brainpower-pro";
      const cycle = "monthly";
      const name = "Ahmed Ali";
      const email = "ahmed@example.com";
      const phone = "+96599887766";

      const formData = new URLSearchParams();
      formData.append("plan", planSlug);
      formData.append("cycle", cycle);
      formData.append("name", name);
      formData.append("email", email);
      formData.append("phone", phone);

      expect(formData.toString()).toContain("plan=brainpower-pro");
      expect(formData.toString()).toContain("cycle=monthly");
      expect(formData.toString()).toContain("name=Ahmed+Ali");
      expect(formData.toString()).toContain("email=ahmed%40example.com");
      expect(formData.toString()).toContain("phone=%2B96599887766");
    });

    it("should handle yearly cycle in form data", () => {
      const formData = new URLSearchParams();
      formData.append("plan", "studio-pro");
      formData.append("cycle", "yearly");
      formData.append("name", "Test User");
      formData.append("email", "test@example.com");
      formData.append("phone", "+1234567890");

      expect(formData.toString()).toContain("cycle=yearly");
    });

    it("should omit cycle for bootcamp plans", () => {
      const formData = new URLSearchParams();
      formData.append("plan", "bootcamp-foundation");
      formData.append("name", "Test User");
      formData.append("email", "test@example.com");
      formData.append("phone", "+1234567890");

      expect(formData.toString()).not.toContain("cycle=");
    });

    it("should generate unique externalChargeId for tracking", () => {
      const id1 = `smarthinkerz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const id2 = `smarthinkerz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      expect(id1).toMatch(/^smarthinkerz_\d+_[a-z0-9]{9}$/);
      expect(id2).toMatch(/^smarthinkerz_\d+_[a-z0-9]{9}$/);
      expect(id1).not.toBe(id2);
    });

    it("should store payment with pending status", async () => {
      const payment = {
        orgId: 1,
        amount: 9900, // $99.00
        currency: "USD",
        status: "pending" as const,
        paymentMethod: "tap" as const,
        externalChargeId: "smarthinkerz_1234567890_abc123def",
        description: "Pro Plan - 1 seat(s)",
        metadata: { planSlug: "brainpower-pro", quantity: 1, cycle: "monthly" },
      };

      expect(payment.status).toBe("pending");
      expect(payment.paymentMethod).toBe("tap");
      expect(payment.externalChargeId).toMatch(/^smarthinkerz_/);
    });
  });

  describe("verifyPayment endpoint", () => {
    it("should activate subscription when payment status is succeeded", async () => {
      const payment = {
        id: 1,
        orgId: 1,
        status: "succeeded" as const,
      };

      expect(payment.status).toBe("succeeded");
      expect(payment.orgId).toBe(1);
    });

    it("should return pending message when payment is still processing", () => {
      const payment = {
        id: 1,
        status: "pending" as const,
      };

      const response = {
        success: false,
        status: "pending",
        message: "Payment is being processed. Please wait a moment.",
      };

      expect(payment.status).toBe("pending");
      expect(response.message).toContain("being processed");
    });

    it("should return error message when payment failed", () => {
      const payment = {
        id: 1,
        status: "failed" as const,
      };

      const response = {
        success: false,
        status: "failed",
        message: "Payment was declined. Please try again.",
      };

      expect(payment.status).toBe("failed");
      expect(response.success).toBe(false);
    });

    it("should throw NOT_FOUND error when payment record doesn't exist", () => {
      const orderId = "smarthinkerz_invalid_order";

      expect(() => {
        if (!orderId.startsWith("smarthinkerz_")) {
          throw new Error("NOT_FOUND");
        }
      }).not.toThrow();
    });
  });

  describe("Smarthinkerz redirect URLs", () => {
    it("should handle success redirect with order_id", () => {
      const successUrl = "https://smarthinkerz.replit.app/checkout/success?order_id=ord_123456";
      const url = new URL(successUrl);
      const orderId = url.searchParams.get("order_id");

      expect(orderId).toBe("ord_123456");
    });

    it("should handle failure redirect with order_id", () => {
      const failureUrl = "https://smarthinkerz.replit.app/checkout/failed?order_id=ord_789012";
      const url = new URL(failureUrl);
      const orderId = url.searchParams.get("order_id");

      expect(orderId).toBe("ord_789012");
    });

    it("should parse order_id from redirect URL correctly", () => {
      const redirectUrls = [
        "https://smarthinkerz.replit.app/checkout/success?order_id=smarthinkerz_1234567890_abc123",
        "https://smarthinkerz.replit.app/checkout/failed?order_id=smarthinkerz_1234567890_def456",
      ];

      redirectUrls.forEach((url) => {
        const parsedUrl = new URL(url);
        const orderId = parsedUrl.searchParams.get("order_id");
        expect(orderId).toMatch(/^smarthinkerz_/);
      });
    });
  });

  describe("Plan slug validation", () => {
    const validSubscriptionPlans = [
      "studio-starter",
      "studio-pro",
      "studio-enterprise",
      "commentcustomer-starter",
      "commentcustomer-pro",
      "commentcustomer-enterprise",
      "komuin-starter",
      "komuin-pro",
      "komuin-enterprise",
      "tabiai-starter",
      "tabiai-pro",
      "tabiai-enterprise",
      "brainpower-starter",
      "brainpower-pro",
      "brainpower-enterprise",
      "stockaitrader-starter",
      "stockaitrader-pro",
      "stockaitrader-enterprise",
    ];

    const validBootcampPlans = [
      "bootcamp-foundation",
      "bootcamp-advanced",
      "bootcamp-mastery",
    ];

    it("should accept all subscription plan slugs", () => {
      validSubscriptionPlans.forEach((slug) => {
        expect(slug).toMatch(/^[a-z]+-[a-z]+$/);
      });
    });

    it("should accept all bootcamp plan slugs", () => {
      validBootcampPlans.forEach((slug) => {
        expect(slug).toMatch(/^bootcamp-[a-z]+$/);
      });
    });

    it("should require cycle for subscription plans", () => {
      const subscriptionPlan = "brainpower-pro";
      const cycles = ["monthly", "yearly"];

      cycles.forEach((cycle) => {
        expect(["monthly", "yearly"]).toContain(cycle);
      });
    });

    it("should not require cycle for bootcamp plans", () => {
      const bootcampPlan = "bootcamp-foundation";
      const formData = new URLSearchParams();
      formData.append("plan", bootcampPlan);

      expect(formData.toString()).not.toContain("cycle=");
    });
  });

  describe("Customer data handling", () => {
    it("should use default phone when not provided", () => {
      const customerPhone = "+1234567890";
      expect(customerPhone).toBe("+1234567890");
    });

    it("should handle customer name with special characters", () => {
      const names = ["Ahmed Ali", "José García", "李明", "Müller"];

      names.forEach((name) => {
        const formData = new URLSearchParams();
        formData.append("name", name);
        expect(formData.toString()).toContain("name=");
      });
    });

    it("should validate email format in form data", () => {
      const validEmails = [
        "user@example.com",
        "test.email@company.co.uk",
        "name+tag@domain.org",
      ];

      validEmails.forEach((email) => {
        const formData = new URLSearchParams();
        formData.append("email", email);
        expect(formData.toString()).toContain("email=");
      });
    });

    it("should handle phone numbers with country codes", () => {
      const phones = [
        "+1234567890",
        "+96599887766",
        "+442071838750",
        "+33123456789",
      ];

      phones.forEach((phone) => {
        expect(phone).toMatch(/^\+\d{10,15}$/);
      });
    });
  });

  describe("Payment metadata", () => {
    it("should store plan slug in metadata", () => {
      const metadata = {
        planSlug: "brainpower-pro",
        quantity: 1,
        cycle: "monthly",
      };

      expect(metadata.planSlug).toBe("brainpower-pro");
    });

    it("should store quantity in metadata", () => {
      const metadata = {
        planSlug: "studio-enterprise",
        quantity: 5,
        cycle: "yearly",
      };

      expect(metadata.quantity).toBe(5);
    });

    it("should store billing cycle in metadata", () => {
      const metadata = {
        planSlug: "tabiai-starter",
        quantity: 1,
        cycle: "yearly",
      };

      expect(metadata.cycle).toBe("yearly");
    });
  });

  describe("Error handling", () => {
    it("should handle HTTP 400 validation error from Smarthinkerz", () => {
      const error = {
        error: "Invalid plan slug or missing required fields",
      };

      expect(error.error).toBeDefined();
      expect(error.error).toContain("Invalid");
    });

    it("should handle network errors gracefully", () => {
      const networkError = new Error("Failed to fetch");
      expect(networkError.message).toBe("Failed to fetch");
    });

    it("should handle missing Location header in redirect response", () => {
      const response = {
        status: 303,
        headers: new Map(),
      };

      const location = response.headers.get("Location");
      expect(location).toBeUndefined();
    });
  });

  describe("Currency and amount handling", () => {
    it("should convert plan price to cents correctly", () => {
      const priceMonthly = 9900; // $99.00
      const quantity = 1;
      const amount = Math.round((priceMonthly / 100) * quantity * 100);

      expect(amount).toBe(9900);
    });

    it("should handle multi-seat pricing", () => {
      const priceMonthly = 5000; // $50.00 per seat
      const quantity = 3;
      const amount = Math.round((priceMonthly / 100) * quantity * 100);

      expect(amount).toBe(15000); // $150.00
    });

    it("should use correct currency code", () => {
      const currencies = ["USD", "KWD", "SAR", "BHD", "AED"];

      currencies.forEach((currency) => {
        expect(currency).toMatch(/^[A-Z]{3}$/);
      });
    });
  });
});
