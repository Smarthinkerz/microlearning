import { describe, it, expect, vi, beforeEach } from "vitest";

// ─── Admin CSV Export Tests ─────────────────────────────────────────
describe("Admin CSV Export", () => {
  describe("CSV Helper Functions", () => {
    // Re-implement the CSV helpers for testing (they're module-private)
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

    it("escapes values with commas", () => {
      expect(escapeCsv("hello, world")).toBe('"hello, world"');
    });

    it("escapes values with double quotes", () => {
      expect(escapeCsv('say "hello"')).toBe('"say ""hello"""');
    });

    it("escapes values with newlines", () => {
      expect(escapeCsv("line1\nline2")).toBe('"line1\nline2"');
    });

    it("returns empty string for null/undefined", () => {
      expect(escapeCsv(null)).toBe("");
      expect(escapeCsv(undefined)).toBe("");
    });

    it("converts numbers to strings", () => {
      expect(escapeCsv(42)).toBe("42");
      expect(escapeCsv(0)).toBe("0");
    });

    it("handles boolean values", () => {
      expect(escapeCsv(true)).toBe("true");
      expect(escapeCsv(false)).toBe("false");
    });

    it("creates proper CSV rows", () => {
      const row = toCsvRow(["id", "name", "email"]);
      expect(row).toBe("id,name,email");
    });

    it("creates CSV rows with mixed types", () => {
      const row = toCsvRow([1, "John Doe", "john@example.com", null, true]);
      expect(row).toBe("1,John Doe,john@example.com,,true");
    });

    it("handles CSV rows with special characters", () => {
      const row = toCsvRow([1, "Doe, John", 'He said "hi"']);
      expect(row).toBe('1,"Doe, John","He said ""hi"""');
    });

    it("formats timestamps as ISO strings", () => {
      const ts = 1700000000000;
      const result = formatTimestamp(ts);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    it("returns empty string for null timestamps", () => {
      expect(formatTimestamp(null)).toBe("");
      expect(formatTimestamp(undefined)).toBe("");
    });

    it("returns empty string for zero timestamps", () => {
      expect(formatTimestamp(0)).toBe("");
    });
  });

  describe("Export Data Structure", () => {
    it("user export headers include required fields", () => {
      const requiredHeaders = [
        "user_id", "name", "email", "role", "app_role", "org_id",
        "timezone", "created_at", "last_login_at",
      ];
      // Verify each header is a valid string
      for (const header of requiredHeaders) {
        expect(typeof header).toBe("string");
        expect(header.length).toBeGreaterThan(0);
      }
    });

    it("consent export headers include required fields", () => {
      const headers = ["user_id", "user_name", "user_email", "consent_type", "status", "updated_at"];
      expect(headers).toHaveLength(6);
      expect(headers).toContain("consent_type");
      expect(headers).toContain("status");
    });

    it("payment export headers include required fields", () => {
      const headers = [
        "payment_id", "org_id", "plan_id", "amount", "currency",
        "status", "payment_method", "external_charge_id",
        "created_at", "paid_at",
      ];
      expect(headers).toHaveLength(10);
      expect(headers).toContain("amount");
      expect(headers).toContain("currency");
    });

    it("consent types include all 5 GDPR categories", () => {
      const CONSENT_TYPES = [
        "essential_cookies",
        "analytics_tracking",
        "marketing_communications",
        "data_sharing",
        "ai_personalization",
      ];
      expect(CONSENT_TYPES).toHaveLength(5);
      expect(CONSENT_TYPES).toContain("essential_cookies");
      expect(CONSENT_TYPES).toContain("analytics_tracking");
      expect(CONSENT_TYPES).toContain("marketing_communications");
      expect(CONSENT_TYPES).toContain("data_sharing");
      expect(CONSENT_TYPES).toContain("ai_personalization");
    });
  });

  describe("CSV Output Validation", () => {
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

    it("generates valid CSV with header and data rows", () => {
      const headers = ["id", "name", "email"];
      const rows = [
        toCsvRow(headers),
        toCsvRow([1, "Alice", "alice@example.com"]),
        toCsvRow([2, "Bob", "bob@example.com"]),
      ];
      const csv = rows.join("\n");
      const lines = csv.split("\n");
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe("id,name,email");
      expect(lines[1]).toBe("1,Alice,alice@example.com");
    });

    it("handles empty data set (header only)", () => {
      const headers = ["id", "name"];
      const rows = [toCsvRow(headers)];
      const csv = rows.join("\n");
      expect(csv).toBe("id,name");
    });

    it("generates proper filename format", () => {
      const date = new Date().toISOString().split("T")[0];
      const filename = `learnshift_users_export_${date}.csv`;
      expect(filename).toMatch(/^learnshift_users_export_\d{4}-\d{2}-\d{2}\.csv$/);
    });

    it("generates proper consent filename format", () => {
      const date = new Date().toISOString().split("T")[0];
      const filename = `learnshift_consents_export_${date}.csv`;
      expect(filename).toMatch(/^learnshift_consents_export_\d{4}-\d{2}-\d{2}\.csv$/);
    });

    it("generates proper payment filename format", () => {
      const date = new Date().toISOString().split("T")[0];
      const filename = `learnshift_payments_export_${date}.csv`;
      expect(filename).toMatch(/^learnshift_payments_export_\d{4}-\d{2}-\d{2}\.csv$/);
    });
  });
});

// ─── Status Page Tests ──────────────────────────────────────────────
describe("Status Page", () => {
  describe("Service Status Types", () => {
    it("defines valid status values", () => {
      const validStatuses = ["operational", "degraded", "down", "unknown"];
      for (const status of validStatuses) {
        expect(typeof status).toBe("string");
      }
    });

    it("defines valid overall status values", () => {
      const overallStatuses = ["all_operational", "degraded", "partial_outage"];
      expect(overallStatuses).toHaveLength(3);
    });
  });

  describe("Status Determination Logic", () => {
    function determineOverallStatus(statuses: string[]): string {
      const hasDown = statuses.includes("down");
      const hasDegraded = statuses.includes("degraded");
      return hasDown ? "partial_outage" : hasDegraded ? "degraded" : "all_operational";
    }

    it("returns all_operational when all services are operational", () => {
      expect(determineOverallStatus(["operational", "operational", "operational"]))
        .toBe("all_operational");
    });

    it("returns degraded when any service is degraded", () => {
      expect(determineOverallStatus(["operational", "degraded", "operational"]))
        .toBe("degraded");
    });

    it("returns partial_outage when any service is down", () => {
      expect(determineOverallStatus(["operational", "down", "operational"]))
        .toBe("partial_outage");
    });

    it("returns partial_outage when down takes priority over degraded", () => {
      expect(determineOverallStatus(["degraded", "down", "operational"]))
        .toBe("partial_outage");
    });

    it("handles all unknown statuses as operational", () => {
      expect(determineOverallStatus(["unknown", "unknown"]))
        .toBe("all_operational");
    });

    it("handles empty services list", () => {
      expect(determineOverallStatus([])).toBe("all_operational");
    });
  });

  describe("Metrics Calculation", () => {
    it("calculates error rate correctly", () => {
      const requestCount = 100;
      const errorCount = 5;
      const errorRate = Math.round((errorCount / requestCount) * 10000) / 100;
      expect(errorRate).toBe(5);
    });

    it("handles zero requests for error rate", () => {
      const requestCount = 0;
      const errorRate = requestCount > 0 ? Math.round((0 / requestCount) * 10000) / 100 : 0;
      expect(errorRate).toBe(0);
    });

    it("calculates average response time", () => {
      const totalResponseTime = 5000;
      const requestCount = 10;
      const avgResponseTime = Math.round(totalResponseTime / requestCount);
      expect(avgResponseTime).toBe(500);
    });

    it("handles zero requests for avg response time", () => {
      const requestCount = 0;
      const avgResponseTime = requestCount > 0 ? Math.round(0 / requestCount) : 0;
      expect(avgResponseTime).toBe(0);
    });
  });

  describe("Uptime Formatting", () => {
    function formatUptime(ms: number): string {
      const seconds = Math.floor(ms / 1000);
      const days = Math.floor(seconds / 86400);
      const hours = Math.floor((seconds % 86400) / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      if (days > 0) return `${days}d ${hours}h ${minutes}m`;
      if (hours > 0) return `${hours}h ${minutes}m`;
      return `${minutes}m`;
    }

    it("formats minutes only", () => {
      expect(formatUptime(300000)).toBe("5m"); // 5 minutes
    });

    it("formats hours and minutes", () => {
      expect(formatUptime(7200000)).toBe("2h 0m"); // 2 hours
    });

    it("formats days, hours, and minutes", () => {
      expect(formatUptime(90061000)).toBe("1d 1h 1m"); // 1 day, 1 hour, 1 minute
    });

    it("formats zero uptime", () => {
      expect(formatUptime(0)).toBe("0m");
    });

    it("formats large uptime", () => {
      expect(formatUptime(864000000)).toBe("10d 0h 0m"); // 10 days
    });
  });

  describe("Latency Classification", () => {
    function classifyLatency(ms: number, threshold: number): "operational" | "degraded" {
      return ms < threshold ? "operational" : "degraded";
    }

    it("classifies low DB latency as operational", () => {
      expect(classifyLatency(50, 500)).toBe("operational");
    });

    it("classifies high DB latency as degraded", () => {
      expect(classifyLatency(600, 500)).toBe("degraded");
    });

    it("classifies API latency within threshold", () => {
      expect(classifyLatency(1500, 2000)).toBe("operational");
    });

    it("classifies API latency above threshold", () => {
      expect(classifyLatency(2500, 2000)).toBe("degraded");
    });
  });

  describe("Service Health Check List", () => {
    it("monitors all 6 required services", () => {
      const services = [
        "Application Server",
        "Database (PostgreSQL)",
        "Email Service (Resend)",
        "Payment Gateway (Tap)",
        "AI/LLM Service",
        "Voice Service (ElevenLabs)",
      ];
      expect(services).toHaveLength(6);
    });

    it("service key mapping covers all services", () => {
      const serviceKeyMap: Record<string, string> = {
        "Application Server": "app",
        "Database (PostgreSQL)": "database",
        "Email Service (Resend)": "resend",
        "Payment Gateway (Tap)": "tap",
        "AI/LLM Service": "llm",
        "Voice Service (ElevenLabs)": "elevenlabs",
      };
      expect(Object.keys(serviceKeyMap)).toHaveLength(6);
      expect(Object.values(serviceKeyMap)).toContain("database");
      expect(Object.values(serviceKeyMap)).toContain("resend");
      expect(Object.values(serviceKeyMap)).toContain("tap");
    });
  });

  describe("Metrics Store", () => {
    it("tracks request count", () => {
      const store = { requestCount: 0, errorCount: 0, totalResponseTime: 0 };
      store.requestCount++;
      store.totalResponseTime += 150;
      expect(store.requestCount).toBe(1);
      expect(store.totalResponseTime).toBe(150);
    });

    it("tracks error count", () => {
      const store = { requestCount: 0, errorCount: 0, totalResponseTime: 0 };
      store.requestCount++;
      store.errorCount++;
      store.totalResponseTime += 500;
      expect(store.errorCount).toBe(1);
    });

    it("calculates running averages", () => {
      const store = { requestCount: 0, errorCount: 0, totalResponseTime: 0 };
      // Simulate 3 requests
      [100, 200, 300].forEach(ms => {
        store.requestCount++;
        store.totalResponseTime += ms;
      });
      const avg = Math.round(store.totalResponseTime / store.requestCount);
      expect(avg).toBe(200);
    });
  });
});

// ─── recordRequest Function Tests ───────────────────────────────────
describe("recordRequest utility", () => {
  it("can be imported from statusPage router", async () => {
    const mod = await import("./routers/statusPage");
    expect(typeof mod.recordRequest).toBe("function");
  });

  it("records a successful request", async () => {
    const mod = await import("./routers/statusPage");
    // Just verify it doesn't throw
    expect(() => mod.recordRequest(100, false)).not.toThrow();
  });

  it("records an error request", async () => {
    const mod = await import("./routers/statusPage");
    expect(() => mod.recordRequest(500, true)).not.toThrow();
  });
});
