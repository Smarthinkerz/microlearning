/**
 * A/B Testing Service
 * 
 * Manages experiment creation, variant assignment, and metric tracking.
 */
import { getDb } from "../db";
import { eq, and, gte } from "drizzle-orm";
import { abTests, abTestVariants, abTestAssignments, abTestMetrics } from "../../drizzle/schema";

/**
 * Deterministic hash-based variant assignment
 * Ensures consistent assignment for the same user across sessions
 */
function assignVariantByHash(userId: number, testId: number, variants: any[]) {
  // Create a deterministic hash from userId + testId
  const hash = (userId + testId * 73856093) ^ ((userId >> 16) * 19349663);
  const randomValue = Math.abs(hash % 100);
  
  let cumulativeWeight = 0;
  for (const variant of variants) {
    cumulativeWeight += variant.weight;
    if (randomValue < cumulativeWeight) {
      return variant;
    }
  }
  
  // Fallback to last variant
  return variants[variants.length - 1];
}

/**
 * Get or create variant assignment for a user in a test
 */
export async function getOrAssignVariant(
  userId: number,
  testId: number
) {
  const db = await getDb();
  if (!db) return null;
  
  // Check if already assigned
  const existing = await db.select().from(abTestAssignments)
    .where(and(
      eq(abTestAssignments.testId, testId),
      eq(abTestAssignments.userId, userId)
    ))
    .limit(1);
  
  if (existing.length > 0) {
    return existing[0];
  }
  
  // Get test and variants
  const test = await db.select().from(abTests)
    .where(and(
      eq(abTests.id, testId),
      eq(abTests.status, "active")
    ))
    .limit(1);
  
  if (test.length === 0) {
    return null;
  }
  
  const variants = await db.select().from(abTestVariants)
    .where(eq(abTestVariants.testId, testId));
  
  if (variants.length === 0) {
    return null;
  }
  
  // Assign variant deterministically
  const selectedVariant = assignVariantByHash(userId, testId, variants);
  
  // Save assignment
  const now = Date.now();
  const result = await db.insert(abTestAssignments).values({
    testId,
    userId,
    variantId: selectedVariant.id,
    assignedAt: now,
  });
  
  return {
    id: 0,
    testId,
    userId,
    variantId: selectedVariant.id,
    assignedAt: now,
  };
}

/**
 * Record a metric event for a variant
 */
export async function recordMetric(
  testId: number,
  variantId: number,
  metricName: string,
  value: number
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(abTestMetrics).values({
    testId,
    variantId,
    metricName,
    value: value.toString() as any,
    count: 1,
    recordedAt: new Date(),
  });
}

/**
 * Get test results and statistics
 */
export async function getTestResults(testId: number) {
  const db = await getDb();
  if (!db) return [];
  
  const variants = await db.select().from(abTestVariants)
    .where(eq(abTestVariants.testId, testId));
  
  const results = [];
  
  for (const variant of variants) {
    const assignments = await db.select().from(abTestAssignments)
      .where(and(
        eq(abTestAssignments.testId, testId),
        eq(abTestAssignments.variantId, variant.id)
      ));
    
    results.push({
      variant: variant.name,
      variantId: variant.id,
      weight: variant.weight,
      assignments: assignments.length,
    });
  }
  
  return results;
}

/**
 * Create a new A/B test
 */
export async function createTest(
  name: string,
  description: string,
  type: "pricing" | "feature" | "ui" | "messaging",
  targetAudience: string,
  createdBy: number,
  variants: Array<{ name: string; weight: number; config?: Record<string, unknown> }>
): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  
  // Create test
  const result = await db.insert(abTests).values({
    name,
    description,
    type,
    status: "draft",
    targetAudience,
    createdBy,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  
  const testId = result[0]?.insertId || 0;
  
  // Create variants
  for (const variant of variants) {
    await db.insert(abTestVariants).values({
      testId,
      name: variant.name,
      weight: variant.weight,
      config: variant.config,
      createdAt: new Date(),
    });
  }
  
  return testId;
}

/**
 * Update test status
 */
export async function updateTestStatus(
  testId: number,
  status: "draft" | "active" | "paused" | "completed"
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(abTests)
    .set({ status, updatedAt: new Date() })
    .where(eq(abTests.id, testId));
}

/**
 * Get pricing test configuration
 */
export async function getPricingVariant(userId: number): Promise<Record<string, unknown> | null> {
  const db = await getDb();
  if (!db) return null;
  
  // Find active pricing test
  const tests = await db.select().from(abTests)
    .where(and(
      eq(abTests.type, "pricing"),
      eq(abTests.status, "active")
    ))
    .limit(1);
  
  if (tests.length === 0) {
    return null;
  }
  
  const test = tests[0];
  const assignment = await getOrAssignVariant(userId, test.id);
  
  if (!assignment) {
    return null;
  }
  
  // Get variant config
  const variants = await db.select().from(abTestVariants)
    .where(eq(abTestVariants.id, assignment.variantId))
    .limit(1);
  
  if (variants.length === 0) {
    return null;
  }
  
  return variants[0].config || null;
}
