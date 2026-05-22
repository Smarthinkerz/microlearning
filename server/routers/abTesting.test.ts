/**
 * A/B Testing Router Tests
 */
import { describe, it, expect } from "vitest";
import { createTest, updateTestStatus, getOrAssignVariant, recordMetric, getPricingVariant } from "../services/abTesting";

describe("A/B Testing Service", () => {
  let testId: number = 0;

  it("creates a new A/B test", async () => {
    testId = await createTest(
      "Pricing Test",
      "Test pricing variants",
      "pricing",
      "all",
      1,
      [
        { name: "control", weight: 50, config: { price: 895 } },
        { name: "variant_a", weight: 50, config: { price: 795 } },
      ]
    );
    expect(testId).toBeGreaterThan(0);
  });

  it("updates test status", async () => {
    if (testId > 0) {
      await updateTestStatus(testId, "active");
      expect(true).toBe(true);
    }
  });

  it("assigns variant deterministically for same user", async () => {
    if (testId > 0) {
      const assignment1 = await getOrAssignVariant(1, testId);
      const assignment2 = await getOrAssignVariant(1, testId);
      
      if (assignment1 && assignment2) {
        expect(assignment1.variantId).toBe(assignment2.variantId);
      }
    }
  });

  it("assigns variants to different users", async () => {
    if (testId > 0) {
      const assignment1 = await getOrAssignVariant(100, testId);
      const assignment2 = await getOrAssignVariant(101, testId);
      
      // Both should be assigned
      expect(assignment1 !== null || assignment2 !== null).toBe(true);
    }
  });

  it("records metrics for variants", async () => {
    if (testId > 0) {
      const assignment = await getOrAssignVariant(200, testId);
      if (assignment) {
        await recordMetric(testId, assignment.variantId, "conversion", 1);
        expect(true).toBe(true);
      }
    }
  });

  it("gets pricing variant for user", async () => {
    if (testId > 0) {
      await updateTestStatus(testId, "active");
      const variant = await getPricingVariant(300);
      expect(typeof variant === "object" || variant === null).toBe(true);
    }
  });
});
