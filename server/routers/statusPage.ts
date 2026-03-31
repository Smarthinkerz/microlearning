import { z } from "zod";
import { router, adminProcedure, publicProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { sql } from "drizzle-orm";

// ─── Service Health Check Types ─────────────────────────────────────
interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "down" | "unknown";
  latencyMs: number | null;
  lastChecked: number;
  message?: string;
}

interface SystemMetrics {
  uptime: number;
  totalRequests24h: number;
  errorRate24h: number;
  avgResponseTime: number;
}

// ─── Health Check Functions ─────────────────────────────────────────

async function checkDatabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const db = await getDb();
    if (!db) throw new Error("Database not initialized");
    await db.execute(sql`SELECT 1`);
    const latency = Date.now() - start;
    return {
      name: "Database (PostgreSQL)",
      status: latency < 500 ? "operational" : "degraded",
      latencyMs: latency,
      lastChecked: Date.now(),
      message: latency < 500 ? "Connected and responsive" : "High latency detected",
    };
  } catch (err: any) {
    return {
      name: "Database (PostgreSQL)",
      status: "down",
      latencyMs: null,
      lastChecked: Date.now(),
      message: `Connection failed: ${err.message?.substring(0, 100)}`,
    };
  }
}

async function checkResendEmail(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return {
        name: "Email Service (Resend)",
        status: "unknown",
        latencyMs: null,
        lastChecked: Date.now(),
        message: "API key not configured",
      };
    }
    // Lightweight check: hit Resend API domains endpoint
    const res = await fetch("https://api.resend.com/domains", {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });
    const latency = Date.now() - start;
    if (res.ok || res.status === 200) {
      return {
        name: "Email Service (Resend)",
        status: latency < 2000 ? "operational" : "degraded",
        latencyMs: latency,
        lastChecked: Date.now(),
        message: "API reachable",
      };
    }
    return {
      name: "Email Service (Resend)",
      status: res.status === 401 ? "degraded" : "down",
      latencyMs: latency,
      lastChecked: Date.now(),
      message: `HTTP ${res.status}: ${res.statusText}`,
    };
  } catch (err: any) {
    return {
      name: "Email Service (Resend)",
      status: "down",
      latencyMs: null,
      lastChecked: Date.now(),
      message: `Unreachable: ${err.message?.substring(0, 100)}`,
    };
  }
}

async function checkTapPayments(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const secretKey = process.env.TAP_SECRET_KEY;
    if (!secretKey) {
      return {
        name: "Payment Gateway (Tap)",
        status: "unknown",
        latencyMs: null,
        lastChecked: Date.now(),
        message: "API keys not configured — awaiting activation",
      };
    }
    const res = await fetch("https://api.tap.company/v2/charges/list", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ period: { date: { from: Date.now() - 60000, to: Date.now() } }, limit: 1 }),
      signal: AbortSignal.timeout(5000),
    });
    const latency = Date.now() - start;
    if (res.ok || res.status === 200) {
      return {
        name: "Payment Gateway (Tap)",
        status: latency < 3000 ? "operational" : "degraded",
        latencyMs: latency,
        lastChecked: Date.now(),
        message: "API reachable",
      };
    }
    return {
      name: "Payment Gateway (Tap)",
      status: "degraded",
      latencyMs: latency,
      lastChecked: Date.now(),
      message: `HTTP ${res.status}: ${res.statusText}`,
    };
  } catch (err: any) {
    return {
      name: "Payment Gateway (Tap)",
      status: "down",
      latencyMs: null,
      lastChecked: Date.now(),
      message: `Unreachable: ${err.message?.substring(0, 100)}`,
    };
  }
}

async function checkLLMService(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const apiUrl = process.env.BUILT_IN_FORGE_API_URL;
    const apiKey = process.env.BUILT_IN_FORGE_API_KEY;
    if (!apiUrl || !apiKey) {
      return {
        name: "AI/LLM Service",
        status: "unknown",
        latencyMs: null,
        lastChecked: Date.now(),
        message: "API credentials not configured",
      };
    }
    // Simple health check via models endpoint
    const res = await fetch(`${apiUrl}/v1/models`, {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: AbortSignal.timeout(5000),
    });
    const latency = Date.now() - start;
    return {
      name: "AI/LLM Service",
      status: res.ok ? (latency < 2000 ? "operational" : "degraded") : "down",
      latencyMs: latency,
      lastChecked: Date.now(),
      message: res.ok ? "Models endpoint reachable" : `HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      name: "AI/LLM Service",
      status: "down",
      latencyMs: null,
      lastChecked: Date.now(),
      message: `Unreachable: ${err.message?.substring(0, 100)}`,
    };
  }
}

async function checkElevenLabs(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return {
        name: "Voice Service (ElevenLabs)",
        status: "unknown",
        latencyMs: null,
        lastChecked: Date.now(),
        message: "API key not configured",
      };
    }
    const res = await fetch("https://api.elevenlabs.io/v1/voices", {
      method: "GET",
      headers: { "xi-api-key": apiKey },
      signal: AbortSignal.timeout(5000),
    });
    const latency = Date.now() - start;
    return {
      name: "Voice Service (ElevenLabs)",
      status: res.ok ? (latency < 2000 ? "operational" : "degraded") : "down",
      latencyMs: latency,
      lastChecked: Date.now(),
      message: res.ok ? "Voices endpoint reachable" : `HTTP ${res.status}`,
    };
  } catch (err: any) {
    return {
      name: "Voice Service (ElevenLabs)",
      status: "down",
      latencyMs: null,
      lastChecked: Date.now(),
      message: `Unreachable: ${err.message?.substring(0, 100)}`,
    };
  }
}

function getAppService(): ServiceStatus {
  return {
    name: "Application Server",
    status: "operational",
    latencyMs: 0,
    lastChecked: Date.now(),
    message: "Running",
  };
}

// ─── In-Memory Metrics Store ────────────────────────────────────────
// Simple in-memory counters (reset on server restart)
const metricsStore = {
  requestCount: 0,
  errorCount: 0,
  totalResponseTime: 0,
  startedAt: Date.now(),
};

export function recordRequest(durationMs: number, isError: boolean) {
  metricsStore.requestCount++;
  metricsStore.totalResponseTime += durationMs;
  if (isError) metricsStore.errorCount++;
}

// ─── Status Page Router ─────────────────────────────────────────────
export const statusPageRouter = router({
  // Public health check (lightweight, no auth required)
  health: publicProcedure.query(async () => {
    const dbStatus = await checkDatabase();
    const allOperational = dbStatus.status === "operational";
    return {
      status: allOperational ? "healthy" : "degraded",
      timestamp: Date.now(),
      database: dbStatus.status,
    };
  }),

  // Full status check (admin only)
  fullStatus: adminProcedure.query(async () => {
    // Run all health checks in parallel
    const [dbStatus, resendStatus, tapStatus, llmStatus, elevenLabsStatus] =
      await Promise.all([
        checkDatabase(),
        checkResendEmail(),
        checkTapPayments(),
        checkLLMService(),
        checkElevenLabs(),
      ]);

    const appStatus = getAppService();

    const services: ServiceStatus[] = [
      appStatus,
      dbStatus,
      resendStatus,
      tapStatus,
      llmStatus,
      elevenLabsStatus,
    ];

    // Calculate overall status
    const statuses = services.map((s) => s.status);
    const hasDown = statuses.includes("down");
    const hasDegraded = statuses.includes("degraded");
    const overallStatus = hasDown
      ? "partial_outage"
      : hasDegraded
        ? "degraded"
        : "all_operational";

    // System metrics
    const uptimeMs = Date.now() - metricsStore.startedAt;
    const metrics: SystemMetrics = {
      uptime: uptimeMs,
      totalRequests24h: metricsStore.requestCount,
      errorRate24h:
        metricsStore.requestCount > 0
          ? Math.round(
              (metricsStore.errorCount / metricsStore.requestCount) * 10000
            ) / 100
          : 0,
      avgResponseTime:
        metricsStore.requestCount > 0
          ? Math.round(
              metricsStore.totalResponseTime / metricsStore.requestCount
            )
          : 0,
    };

    return {
      overallStatus,
      services,
      metrics,
      checkedAt: Date.now(),
    };
  }),

  // Refresh a single service check (admin only)
  checkService: adminProcedure
    .input(z.object({ service: z.string() }))
    .mutation(async ({ input }) => {
      switch (input.service) {
        case "database":
          return checkDatabase();
        case "resend":
          return checkResendEmail();
        case "tap":
          return checkTapPayments();
        case "llm":
          return checkLLMService();
        case "elevenlabs":
          return checkElevenLabs();
        case "app":
          return getAppService();
        default:
          return {
            name: input.service,
            status: "unknown" as const,
            latencyMs: null,
            lastChecked: Date.now(),
            message: "Unknown service",
          };
      }
    }),
});
