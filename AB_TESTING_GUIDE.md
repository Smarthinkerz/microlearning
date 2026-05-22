# A/B Testing Implementation Guide

## Overview

The MicroLearning Coach platform includes a comprehensive A/B testing system for running pricing experiments, feature tests, and UI optimization tests. This guide covers setup, usage, and best practices.

## Architecture

### Database Schema

Four core tables support A/B testing:

- **ab_tests**: Main experiment records with status, type, and targeting
- **ab_test_variants**: Variant configurations with weighted allocation
- **ab_test_assignments**: User-to-variant mappings (deterministic)
- **ab_test_metrics**: Performance metrics and conversion tracking

### Service Layer

`server/services/abTesting.ts` provides:

- **createTest()**: Create new experiments with variants
- **updateTestStatus()**: Activate, pause, or complete tests
- **getOrAssignVariant()**: Deterministic variant assignment
- **recordMetric()**: Track performance metrics
- **getPricingVariant()**: Get active pricing configuration for users

### API Integration

`server/routers/abTesting.ts` exposes tRPC procedures:

- `createTest` (admin): Create new experiment
- `updateStatus` (admin): Change test status
- `getVariant` (protected): Get user's assigned variant
- `recordMetric` (protected): Record metric event
- `getResults` (admin): View experiment results
- `getPricingVariant` (protected): Get pricing variant

## Quick Start

### 1. Create a Pricing Experiment

```typescript
const testId = await trpc.abTesting.createTest.mutate({
  name: "Pro Tier Pricing Test",
  description: "Test $19.95 vs $24.95 pricing",
  type: "pricing",
  targetAudience: "new_users",
  variants: [
    {
      name: "control",
      weight: 50,
      config: {
        price: 1995, // $19.95 in cents
        name: "Pro",
        features: ["analytics", "authoring", "gamification"]
      }
    },
    {
      name: "variant_a",
      weight: 50,
      config: {
        price: 2495, // $24.95 in cents
        name: "Pro Plus",
        features: ["analytics", "authoring", "gamification", "vr_xr"]
      }
    }
  ]
});
```

### 2. Activate the Test

```typescript
await trpc.abTesting.updateStatus.mutate({
  testId,
  status: "active"
});
```

### 3. Get User's Variant

```typescript
const assignment = await trpc.abTesting.getVariant.query({ testId });
// Returns: { testId, userId, variantId, assignedAt }

// Fetch variant config
const variant = await trpc.abTesting.getPricingVariant.query();
// Returns: { price: 1995, name: "Pro", features: [...] }
```

### 4. Track Conversions

```typescript
// When user completes purchase
await trpc.abTesting.recordMetric.mutate({
  testId,
  variantId: assignment.variantId,
  metricName: "conversion",
  value: 1
});

// Track revenue
await trpc.abTesting.recordMetric.mutate({
  testId,
  variantId: assignment.variantId,
  metricName: "revenue",
  value: 1995 // in cents
});
```

### 5. View Results

```typescript
const results = await trpc.abTesting.getResults.query({ testId });
// Returns: [
//   {
//     variant: "control",
//     variantId: 1,
//     weight: 50,
//     assignments: 245,
//     metrics: [
//       { name: "conversion", totalValue: 42, totalCount: 42, average: 1 }
//     ]
//   },
//   ...
// ]
```

## Deterministic Assignment

Users are assigned to variants deterministically using a hash function:

```typescript
hash = (userId + testId * 73856093) ^ ((userId >> 16) * 19349663)
randomValue = Math.abs(hash % 100)
```

This ensures:
- Same user always gets same variant
- Consistent across sessions
- No server-side state required
- Reproducible results

## Best Practices

### 1. Sample Size

- Run tests for at least 1-2 weeks
- Target minimum 100-200 conversions per variant
- Use power analysis for statistical significance

### 2. Metric Selection

**Primary Metrics:**
- Conversion rate (subscription completion)
- Revenue per user
- Churn rate

**Secondary Metrics:**
- Engagement (lessons completed)
- Feature adoption
- Support tickets

### 3. Targeting

Use `targetAudience` to segment experiments:

```typescript
// New users only
targetAudience: "new_users"

// Existing Pro subscribers
targetAudience: "pro_users"

// Specific organization
targetAudience: "org_123"

// All users
targetAudience: "all"
```

### 4. Variant Allocation

- Start with 50/50 split for equal power
- Use 90/10 for risk-averse tests
- Adjust weights based on confidence

### 5. Test Duration

```typescript
// Set test duration
startDate: Date.now(),
endDate: Date.now() + (7 * 24 * 60 * 60 * 1000) // 7 days
```

## Pricing Experiment Example

### Scenario: Test higher Pro tier price

**Setup:**
```typescript
const testId = await createTest(
  "Pro Pricing Optimization",
  "Test $19.95 vs $29.95 for Pro tier",
  "pricing",
  "new_users",
  adminUserId,
  [
    {
      name: "control",
      weight: 50,
      config: {
        tier: "pro",
        price: 1995,
        billingCycle: "monthly"
      }
    },
    {
      name: "premium_price",
      weight: 50,
      config: {
        tier: "pro_plus",
        price: 2995,
        billingCycle: "monthly",
        extraFeatures: ["priority_support", "vr_xr"]
      }
    }
  ]
);
```

**Activation:**
```typescript
await updateTestStatus(testId, "active");
```

**Tracking:**
```typescript
// In payment flow
const variant = await getPricingVariant(userId);
const price = variant?.config?.price || 1995;

// After successful payment
await recordMetric(testId, variantId, "conversion", 1);
await recordMetric(testId, variantId, "revenue", price);
```

**Analysis:**
```typescript
const results = await getTestResults(testId);

// Calculate conversion rates
const controlConversion = results[0].metrics[0].average;
const variantConversion = results[1].metrics[0].average;

// Calculate revenue impact
const controlRevenue = results[0].metrics[1].totalValue;
const variantRevenue = results[1].metrics[1].totalValue;

// Statistical significance (use external tool)
// p-value < 0.05 = significant
```

## Monitoring

### Key Metrics to Track

1. **Conversion Rate**: (conversions / assignments) * 100
2. **Revenue per User**: total_revenue / assignments
3. **Churn Rate**: (canceled / conversions) * 100
4. **Time to Conversion**: average days from assignment to purchase

### Red Flags

- Conversion rate drops > 20%
- Revenue per user decreases significantly
- High variance in metrics (suggests data quality issues)
- Unexpected traffic patterns

## Troubleshooting

### Test Not Activating

```typescript
// Verify test exists
const tests = await db.query.abTests.findMany({
  where: eq(abTests.id, testId)
});

// Check status
console.log(tests[0]?.status); // Should be "active"
```

### Users Not Getting Assigned

```typescript
// Verify variants exist
const variants = await db.query.abTestVariants.findMany({
  where: eq(abTestVariants.testId, testId)
});

// Check weights sum to 100
const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
console.log(totalWeight); // Should be 100
```

### Metrics Not Recording

```typescript
// Verify assignments exist
const assignments = await db.query.abTestAssignments.findMany({
  where: eq(abTestAssignments.testId, testId)
});

// Check metrics table
const metrics = await db.query.abTestMetrics.findMany({
  where: eq(abTestMetrics.testId, testId)
});
```

## Advanced: Custom Metrics

Record any metric you need:

```typescript
// Engagement
await recordMetric(testId, variantId, "lessons_completed", 5);

// Feature adoption
await recordMetric(testId, variantId, "used_analytics", 1);

// Support
await recordMetric(testId, variantId, "support_tickets", 2);

// Retention
await recordMetric(testId, variantId, "day_30_retention", 1);
```

## API Reference

### createTest(name, description, type, targetAudience, createdBy, variants)

Creates a new A/B test.

**Parameters:**
- `name`: string - Test name
- `description`: string - Test description
- `type`: "pricing" | "feature" | "ui" | "messaging"
- `targetAudience`: string - Targeting criteria
- `createdBy`: number - Admin user ID
- `variants`: Array of variant configs

**Returns:** number (testId)

### updateTestStatus(testId, status)

Updates test status.

**Parameters:**
- `testId`: number
- `status`: "draft" | "active" | "paused" | "completed"

### getOrAssignVariant(userId, testId)

Gets or creates variant assignment.

**Parameters:**
- `userId`: number
- `testId`: number

**Returns:** ABTestAssignment | null

### recordMetric(testId, variantId, metricName, value)

Records a metric event.

**Parameters:**
- `testId`: number
- `variantId`: number
- `metricName`: string
- `value`: number

### getTestResults(testId)

Gets test results and statistics.

**Parameters:**
- `testId`: number

**Returns:** Array of variant results with metrics

### getPricingVariant(userId)

Gets active pricing variant for user.

**Parameters:**
- `userId`: number

**Returns:** Record<string, unknown> | null

## Integration with Pricing Page

```tsx
import { trpc } from "@/lib/trpc";

export function PricingPage() {
  const { data: pricingVariant } = trpc.abTesting.getPricingVariant.useQuery();
  const { data: variant } = trpc.abTesting.getVariant.useQuery({ testId: 1 });

  // Use pricingVariant?.config to display test price
  const price = pricingVariant?.config?.price || 1995;

  return (
    <div>
      <h2>Pro Plan</h2>
      <p className="text-3xl font-bold">
        ${(price / 100).toFixed(2)}/month
      </p>
      {/* ... */}
    </div>
  );
}
```

## Conclusion

The A/B testing system enables data-driven optimization of pricing, features, and user experience. Start with small experiments, measure carefully, and iterate based on results.

For questions or issues, refer to the test suite in `server/routers/abTesting.test.ts`.
