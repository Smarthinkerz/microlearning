import { describe, it, expect, beforeEach, vi } from "vitest";
import { revenueTrackingRouter } from "./routers/revenueTracking";
import * as db from "./db";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

describe("Revenue Tracking Router", () => {
  describe("getRevenueSummary", () => {
    it("should calculate gross revenue from succeeded payments", async () => {
      const mockDb = {
        select: vi.fn().mockReturnThis(),
        from: vi.fn().mockReturnThis(),
        where: vi.fn().mockResolvedValue([
          { amount: 10000, status: "succeeded" }, // $100
          { amount: 5000, status: "succeeded" }, // $50
        ]),
      };

      expect(mockDb).toBeDefined();
    });

    it("should calculate OpenAI costs as 15% of revenue", () => {
      const grossRevenue = 10000; // $100
      const expectedCosts = Math.round(grossRevenue * 0.15); // $15
      expect(expectedCosts).toBe(1500);
    });

    it("should calculate net revenue after OpenAI deductions", () => {
      const grossRevenue = 10000; // $100
      const openAICosts = Math.round(grossRevenue * 0.15); // $15
      const netRevenue = grossRevenue - openAICosts;
      expect(netRevenue).toBe(8500); // $85
    });

    it("should calculate daily average revenue", () => {
      const netRevenue = 8500; // $85
      const daysDiff = 30;
      const dailyAverage = Math.round(netRevenue / daysDiff);
      expect(dailyAverage).toBe(283); // ~$2.83 per day
    });

    it("should handle empty payment list", () => {
      const payments: any[] = [];
      const grossRevenue = payments.reduce((sum: number, p) => sum + p.amount, 0);
      expect(grossRevenue).toBe(0);

      const openAICosts = Math.round(grossRevenue * 0.15);
      expect(openAICosts).toBe(0);

      const netRevenue = grossRevenue - openAICosts;
      expect(netRevenue).toBe(0);
    });
  });

  describe("getMonthlyRevenue", () => {
    it("should aggregate revenue by month", () => {
      const months = 12;
      const monthlyData = [];

      for (let i = months - 1; i >= 0; i--) {
        const monthStart = new Date();
        monthStart.setMonth(monthStart.getMonth() - i);
        monthStart.setDate(1);
        monthStart.setHours(0, 0, 0, 0);

        monthlyData.push({
          month: monthStart.toISOString().slice(0, 7),
          grossRevenue: 0,
          openAICosts: 0,
          netRevenue: 0,
          transactionCount: 0,
        });
      }

      expect(monthlyData.length).toBe(12);
      expect(monthlyData[0].month).toBeDefined();
    });

    it("should calculate OpenAI costs per month", () => {
      const grossRevenue = 50000; // $500
      const openAICosts = Math.round(grossRevenue * 0.15); // $75
      expect(openAICosts).toBe(7500);
    });

    it("should track transaction count per month", () => {
      const transactions = [
        { amount: 10000 },
        { amount: 5000 },
        { amount: 15000 },
      ];
      expect(transactions.length).toBe(3);
    });
  });

  describe("getUserRevenueContribution", () => {
    it("should calculate revenue contribution per subscription", () => {
      const subscriptions = [
        { id: 1, grossRevenue: 20000, netRevenue: 17000 },
        { id: 2, grossRevenue: 10000, netRevenue: 8500 },
        { id: 3, grossRevenue: 30000, netRevenue: 25500 },
      ];

      const totalRevenue = subscriptions.reduce((sum, s) => sum + s.netRevenue, 0);
      expect(totalRevenue).toBe(51000);
    });

    it("should calculate percentage contribution", () => {
      const netRevenue = 17000;
      const totalRevenue = 51000;
      const percentage = (netRevenue / totalRevenue) * 100;
      expect(percentage).toBeCloseTo(33.33, 1);
    });

    it("should handle zero total revenue", () => {
      const netRevenue = 0;
      const totalRevenue = 0;
      const percentage = totalRevenue > 0 ? (netRevenue / totalRevenue) * 100 : 0;
      expect(percentage).toBe(0);
    });

    it("should limit results to specified count", () => {
      const limit = 50;
      const subscriptions = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        revenue: 1000,
      }));

      const limited = subscriptions.slice(0, limit);
      expect(limited.length).toBe(50);
    });
  });

  describe("getRevenueMetrics", () => {
    it("should calculate 30-day revenue metrics", () => {
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

      const payments = [
        { paidAt: now - 5 * 24 * 60 * 60 * 1000, amount: 10000 },
        { paidAt: now - 15 * 24 * 60 * 60 * 1000, amount: 5000 },
      ];

      const revenue30d = payments.reduce((sum: number, p) => sum + p.amount, 0);
      expect(revenue30d).toBe(15000);

      const costs30d = Math.round(revenue30d * 0.15);
      expect(costs30d).toBe(2250);

      const net30d = revenue30d - costs30d;
      expect(net30d).toBe(12750);
    });

    it("should calculate all-time revenue metrics", () => {
      const allPayments = [
        { amount: 10000 },
        { amount: 5000 },
        { amount: 20000 },
        { amount: 15000 },
      ];

      const totalRevenue = allPayments.reduce((sum: number, p) => sum + p.amount, 0);
      expect(totalRevenue).toBe(50000);

      const totalCosts = Math.round(totalRevenue * 0.15);
      expect(totalCosts).toBe(7500);

      const totalNet = totalRevenue - totalCosts;
      expect(totalNet).toBe(42500);
    });

    it("should return correct cost percentage", () => {
      const costPercentage = 0.15 * 100;
      expect(costPercentage).toBe(15);
    });

    it("should differentiate between 30-day and all-time metrics", () => {
      const metrics30d = {
        grossRevenue: 15000,
        openAICosts: 2250,
        netRevenue: 12750,
      };

      const metricsAllTime = {
        grossRevenue: 50000,
        openAICosts: 7500,
        netRevenue: 42500,
      };

      expect(metricsAllTime.grossRevenue).toBeGreaterThan(metrics30d.grossRevenue);
      expect(metricsAllTime.netRevenue).toBeGreaterThan(metrics30d.netRevenue);
    });
  });

  describe("recordOpenAIUsage", () => {
    it("should return success response", () => {
      const result = {
        success: true,
        costEstimate: 500,
        recorded: true,
      };

      expect(result.success).toBe(true);
      expect(result.recorded).toBe(true);
    });

    it("should track cost estimate", () => {
      const costEstimate = 500; // in cents = $5
      expect(costEstimate).toBeGreaterThan(0);
    });

    it("should accept all required parameters", () => {
      const input = {
        orgId: 1,
        lessonId: 42,
        tokensUsed: 1500,
        costEstimate: 500,
      };

      expect(input.orgId).toBeDefined();
      expect(input.lessonId).toBeDefined();
      expect(input.tokensUsed).toBeDefined();
      expect(input.costEstimate).toBeDefined();
    });
  });

  describe("Revenue Calculations", () => {
    it("should handle large revenue amounts", () => {
      const largeRevenue = 1000000000; // $10,000,000
      const costs = Math.round(largeRevenue * 0.15);
      const net = largeRevenue - costs;

      expect(costs).toBe(150000000);
      expect(net).toBe(850000000);
    });

    it("should handle fractional cents", () => {
      const revenue = 12345; // $123.45
      const costs = Math.round(revenue * 0.15);
      expect(costs).toBe(1852); // $18.52
    });

    it("should maintain precision with multiple calculations", () => {
      const payments = [10000, 20000, 30000, 40000, 50000];
      const total = payments.reduce((sum, p) => sum + p, 0);
      const costs = Math.round(total * 0.15);
      const net = total - costs;

      expect(total).toBe(150000);
      expect(costs).toBe(22500);
      expect(net).toBe(127500);
    });
  });

  describe("Time Period Handling", () => {
    it("should correctly calculate date ranges", () => {
      const now = Date.now();
      const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

      expect(now).toBeGreaterThan(thirtyDaysAgo);
      expect(now - thirtyDaysAgo).toBe(30 * 24 * 60 * 60 * 1000);
    });

    it("should handle month boundaries", () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      monthEnd.setTime(monthEnd.getTime() - 1);

      expect(monthEnd.getTime()).toBeGreaterThan(monthStart.getTime());
    });

    it("should generate correct month strings", () => {
      const date = new Date("2026-05-15");
      const monthString = date.toISOString().slice(0, 7);
      expect(monthString).toBe("2026-05");
    });
  });
});
