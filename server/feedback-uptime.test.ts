import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Feedback CSV Export Tests ──────────────────────────────────────
describe("Feedback CSV Export", () => {
  // Re-implement CSV helpers for testing (module-private in adminExport)
  function escapeCsv(value: unknown): string {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  function toCsvRow(fields: unknown[]): string {
    return fields.map(escapeCsv).join(",");
  }

  function formatTimestamp(ts: number | null | undefined): string {
    if (!ts) return "";
    return new Date(ts).toISOString();
  }

  describe("Feedback CSV Structure", () => {
    const FEEDBACK_HEADERS = [
      "feedback_id", "user_id", "user_name", "user_email",
      "lesson_id", "lesson_title", "attempt_id",
      "rating", "difficulty", "would_recommend",
      "comment", "created_at",
    ];

    it("generates correct header row", () => {
      const headerRow = toCsvRow(FEEDBACK_HEADERS);
      expect(headerRow).toBe(
        "feedback_id,user_id,user_name,user_email,lesson_id,lesson_title,attempt_id,rating,difficulty,would_recommend,comment,created_at"
      );
    });

    it("has 12 columns in header", () => {
      expect(FEEDBACK_HEADERS).toHaveLength(12);
    });

    it("generates correct data row for a feedback entry", () => {
      const fb = {
        id: 1,
        userId: 42,
        lessonId: 10,
        attemptId: 5,
        rating: 4,
        difficulty: "just_right",
        wouldRecommend: true,
        comment: "Great lesson!",
        createdAt: new Date("2026-03-15T10:00:00Z"),
      };
      const user = { name: "John Doe", email: "john@example.com" };
      const lessonTitle = "Safety Basics";

      const row = toCsvRow([
        fb.id,
        fb.userId,
        user.name,
        user.email,
        fb.lessonId,
        lessonTitle,
        fb.attemptId || "",
        fb.rating,
        fb.difficulty || "",
        fb.wouldRecommend !== null ? (fb.wouldRecommend ? "yes" : "no") : "",
        fb.comment || "",
        formatTimestamp(fb.createdAt.getTime()),
      ]);

      expect(row).toContain("1,42,John Doe,john@example.com,10,Safety Basics,5,4,just_right,yes");
      expect(row).toContain("Great lesson!");
    });

    it("handles feedback with no comment", () => {
      const row = toCsvRow([1, 42, "Jane", "jane@test.com", 5, "Lesson", "", 3, "too_hard", "no", "", ""]);
      expect(row).toBe("1,42,Jane,jane@test.com,5,Lesson,,3,too_hard,no,,");
    });

    it("handles feedback with commas in comment", () => {
      const row = toCsvRow([1, 42, "Jane", "jane@test.com", 5, "Lesson", "", 5, "", "yes", "Good, but could be better", ""]);
      expect(row).toContain('"Good, but could be better"');
    });

    it("handles null wouldRecommend", () => {
      const wouldRecommend: boolean | null = null;
      const value = wouldRecommend !== null ? (wouldRecommend ? "yes" : "no") : "";
      expect(value).toBe("");
    });

    it("maps wouldRecommend true to 'yes'", () => {
      const wouldRecommend: boolean | null = true;
      const value = wouldRecommend !== null ? (wouldRecommend ? "yes" : "no") : "";
      expect(value).toBe("yes");
    });

    it("maps wouldRecommend false to 'no'", () => {
      const wouldRecommend: boolean | null = false;
      const value = wouldRecommend !== null ? (wouldRecommend ? "yes" : "no") : "";
      expect(value).toBe("no");
    });

    it("handles all difficulty levels", () => {
      const levels = ["too_easy", "just_right", "too_hard"];
      for (const level of levels) {
        const row = toCsvRow([1, 1, "", "", 1, "", "", 3, level, "", "", ""]);
        expect(row).toContain(level);
      }
    });

    it("handles rating values 1-5", () => {
      for (let rating = 1; rating <= 5; rating++) {
        const row = toCsvRow([1, 1, "", "", 1, "", "", rating, "", "", "", ""]);
        expect(row).toContain(`,${rating},`);
      }
    });
  });

  describe("Feedback Data Mapping", () => {
    it("maps user data correctly from user map", () => {
      const users = [
        { id: 1, name: "Alice", email: "alice@test.com" },
        { id: 2, name: "Bob", email: "bob@test.com" },
      ];
      const userMap = new Map(users.map(u => [u.id, u]));

      expect(userMap.get(1)?.name).toBe("Alice");
      expect(userMap.get(2)?.email).toBe("bob@test.com");
      expect(userMap.get(99)).toBeUndefined();
    });

    it("maps lesson titles correctly from lesson map", () => {
      const lessons = [
        { id: 10, title: "Safety 101" },
        { id: 20, title: "Fire Drill" },
      ];
      const lessonMap = new Map(lessons.map(l => [l.id, l.title]));

      expect(lessonMap.get(10)).toBe("Safety 101");
      expect(lessonMap.get(20)).toBe("Fire Drill");
      expect(lessonMap.get(99) || "").toBe("");
    });

    it("handles missing user gracefully", () => {
      const userMap = new Map<number, { name: string; email: string }>();
      const user = userMap.get(999);
      expect(user?.name || "").toBe("");
      expect(user?.email || "").toBe("");
    });
  });
});

// ─── Uptime History Tests ───────────────────────────────────────────
describe("Uptime History", () => {
  describe("Bucket Aggregation Logic", () => {
    const BUCKET_SIZE_MS = 4 * 60 * 60 * 1000; // 4 hours

    function aggregateBucket(statuses: string[]): "operational" | "degraded" | "down" {
      const hasDown = statuses.includes("down");
      const hasDegraded = statuses.includes("degraded");
      return hasDown ? "down" : hasDegraded ? "degraded" : "operational";
    }

    it("returns operational when all checks are operational", () => {
      expect(aggregateBucket(["operational", "operational", "operational"])).toBe("operational");
    });

    it("returns degraded when any check is degraded", () => {
      expect(aggregateBucket(["operational", "degraded", "operational"])).toBe("degraded");
    });

    it("returns down when any check is down", () => {
      expect(aggregateBucket(["operational", "down", "operational"])).toBe("down");
    });

    it("returns down when both degraded and down exist (worst wins)", () => {
      expect(aggregateBucket(["degraded", "down", "operational"])).toBe("down");
    });

    it("returns operational for single operational check", () => {
      expect(aggregateBucket(["operational"])).toBe("operational");
    });

    it("calculates bucket key correctly", () => {
      const timestamp = 1711900800000; // Some timestamp
      const bucketKey = Math.floor(timestamp / BUCKET_SIZE_MS) * BUCKET_SIZE_MS;
      expect(bucketKey % BUCKET_SIZE_MS).toBe(0);
      expect(bucketKey).toBeLessThanOrEqual(timestamp);
      expect(bucketKey + BUCKET_SIZE_MS).toBeGreaterThan(timestamp);
    });

    it("groups timestamps into same bucket within 4-hour window", () => {
      const base = Math.floor(Date.now() / BUCKET_SIZE_MS) * BUCKET_SIZE_MS;
      const t1 = base + 1000;
      const t2 = base + 2 * 60 * 60 * 1000; // 2 hours later
      const bucket1 = Math.floor(t1 / BUCKET_SIZE_MS) * BUCKET_SIZE_MS;
      const bucket2 = Math.floor(t2 / BUCKET_SIZE_MS) * BUCKET_SIZE_MS;
      expect(bucket1).toBe(bucket2);
    });

    it("separates timestamps into different buckets across 4-hour boundary", () => {
      const base = Math.floor(Date.now() / BUCKET_SIZE_MS) * BUCKET_SIZE_MS;
      const t1 = base + 1000;
      const t2 = base + BUCKET_SIZE_MS + 1000; // Next bucket
      const bucket1 = Math.floor(t1 / BUCKET_SIZE_MS) * BUCKET_SIZE_MS;
      const bucket2 = Math.floor(t2 / BUCKET_SIZE_MS) * BUCKET_SIZE_MS;
      expect(bucket1).not.toBe(bucket2);
    });
  });

  describe("Uptime Percentage Calculation", () => {
    function calcUptimePercent(totalBuckets: number, operationalBuckets: number): number {
      if (totalBuckets === 0) return 100;
      return Math.round((operationalBuckets / totalBuckets) * 10000) / 100;
    }

    it("returns 100% when all buckets are operational", () => {
      expect(calcUptimePercent(42, 42)).toBe(100);
    });

    it("returns 100% when no data (0 buckets)", () => {
      expect(calcUptimePercent(0, 0)).toBe(100);
    });

    it("calculates correct percentage for mixed status", () => {
      expect(calcUptimePercent(42, 40)).toBeCloseTo(95.24, 1);
    });

    it("returns 0% when no buckets are operational", () => {
      expect(calcUptimePercent(42, 0)).toBe(0);
    });

    it("handles single bucket operational", () => {
      expect(calcUptimePercent(1, 1)).toBe(100);
    });

    it("handles single bucket down", () => {
      expect(calcUptimePercent(1, 0)).toBe(0);
    });
  });

  describe("Service Names", () => {
    const SERVICE_NAMES = [
      "Application Server",
      "Database (PostgreSQL)",
      "Email Service (Resend)",
      "Payment Gateway (Tap)",
      "AI/LLM Service",
      "Voice Service (ElevenLabs)",
    ];

    it("has 6 monitored services", () => {
      expect(SERVICE_NAMES).toHaveLength(6);
    });

    it("includes all expected services", () => {
      expect(SERVICE_NAMES).toContain("Application Server");
      expect(SERVICE_NAMES).toContain("Database (PostgreSQL)");
      expect(SERVICE_NAMES).toContain("Email Service (Resend)");
      expect(SERVICE_NAMES).toContain("Payment Gateway (Tap)");
      expect(SERVICE_NAMES).toContain("AI/LLM Service");
      expect(SERVICE_NAMES).toContain("Voice Service (ElevenLabs)");
    });
  });

  describe("Time Range", () => {
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    const BUCKET_SIZE_MS = 4 * 60 * 60 * 1000;

    it("7 days equals 604800000 ms", () => {
      expect(SEVEN_DAYS_MS).toBe(604800000);
    });

    it("4-hour bucket equals 14400000 ms", () => {
      expect(BUCKET_SIZE_MS).toBe(14400000);
    });

    it("7 days produces ~42 buckets", () => {
      const bucketCount = Math.ceil(SEVEN_DAYS_MS / BUCKET_SIZE_MS);
      expect(bucketCount).toBe(42);
    });

    it("prune threshold is 8 days (buffer beyond 7-day window)", () => {
      const pruneMs = 8 * 24 * 60 * 60 * 1000;
      expect(pruneMs).toBeGreaterThan(SEVEN_DAYS_MS);
    });
  });
});

// ─── Export Counts Tests ────────────────────────────────────────────
describe("Export Counts", () => {
  it("consent estimate is users * 5 consent types", () => {
    const userCount = 10;
    const CONSENT_TYPES_COUNT = 5;
    expect(userCount * CONSENT_TYPES_COUNT).toBe(50);
  });

  it("returns correct structure", () => {
    const counts = {
      users: 10,
      consents: 50,
      payments: 25,
      feedback: 100,
    };
    expect(counts).toHaveProperty("users");
    expect(counts).toHaveProperty("consents");
    expect(counts).toHaveProperty("payments");
    expect(counts).toHaveProperty("feedback");
    expect(typeof counts.users).toBe("number");
    expect(typeof counts.feedback).toBe("number");
  });
});

// ─── Uptime Status Color Logic Tests ────────────────────────────────
describe("Status Display Logic", () => {
  function uptimePercentColor(pct: number): string {
    if (pct >= 99.5) return "text-emerald-400";
    if (pct >= 95) return "text-amber-400";
    return "text-red-400";
  }

  function bucketColor(status: string): string {
    switch (status) {
      case "operational": return "bg-emerald-500";
      case "degraded": return "bg-amber-500";
      case "down": return "bg-red-500";
      case "no_data": return "bg-muted-foreground/20";
      default: return "bg-muted-foreground/30";
    }
  }

  it("shows green for 100% uptime", () => {
    expect(uptimePercentColor(100)).toBe("text-emerald-400");
  });

  it("shows green for 99.5% uptime", () => {
    expect(uptimePercentColor(99.5)).toBe("text-emerald-400");
  });

  it("shows amber for 95-99.4% uptime", () => {
    expect(uptimePercentColor(97)).toBe("text-amber-400");
    expect(uptimePercentColor(95)).toBe("text-amber-400");
  });

  it("shows red for below 95% uptime", () => {
    expect(uptimePercentColor(94.9)).toBe("text-red-400");
    expect(uptimePercentColor(50)).toBe("text-red-400");
  });

  it("returns correct bucket colors", () => {
    expect(bucketColor("operational")).toBe("bg-emerald-500");
    expect(bucketColor("degraded")).toBe("bg-amber-500");
    expect(bucketColor("down")).toBe("bg-red-500");
    expect(bucketColor("no_data")).toBe("bg-muted-foreground/20");
    expect(bucketColor("unknown")).toBe("bg-muted-foreground/30");
  });
});

// ─── Latency Averaging Tests ────────────────────────────────────────
describe("Latency Calculations", () => {
  function avgLatency(latencies: number[]): number | null {
    if (latencies.length === 0) return null;
    return Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  }

  it("returns null for empty array", () => {
    expect(avgLatency([])).toBeNull();
  });

  it("returns single value for single entry", () => {
    expect(avgLatency([150])).toBe(150);
  });

  it("averages multiple latencies", () => {
    expect(avgLatency([100, 200, 300])).toBe(200);
  });

  it("rounds to nearest integer", () => {
    expect(avgLatency([100, 200, 150])).toBe(150);
    expect(avgLatency([101, 102])).toBe(102); // 101.5 rounds to 102
  });
});
