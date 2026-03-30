import rateLimit from "express-rate-limit";
import type { Request, Response } from "express";

/**
 * Rate Limiting Configuration
 * 
 * Four tiers of rate limiting:
 * 1. General API: 200 req/min per IP (standard CRUD operations)
 * 2. AI/LLM endpoints: 15 req/min per IP (expensive compute)
 * 3. Voice synthesis: 10 req/min per IP (expensive external API)
 * 4. Auth endpoints: 30 req/min per IP (brute-force protection)
 */

const standardHeaders = true;
const legacyHeaders = false;

// General API rate limiter: 200 requests per minute
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders,
  legacyHeaders,
  message: {
    error: "Too many requests. Please try again in a moment.",
    retryAfter: 60,
  },
  skip: (req: Request) => {
    // Skip rate limiting for health checks
    return req.path === "/api/health";
  },
});

// AI/LLM endpoint rate limiter: 15 requests per minute
export const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders,
  legacyHeaders,
  message: {
    error: "AI generation rate limit reached. Please wait before generating more content.",
    retryAfter: 60,
  },
});

// Voice synthesis rate limiter: 10 requests per minute
export const voiceLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders,
  legacyHeaders,
  message: {
    error: "Voice synthesis rate limit reached. Please wait before generating more audio.",
    retryAfter: 60,
  },
});

// Auth endpoint rate limiter: 30 requests per minute
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders,
  legacyHeaders,
  message: {
    error: "Too many authentication attempts. Please try again later.",
    retryAfter: 60,
  },
});

// Strict limiter for sensitive operations: 5 requests per minute
export const strictLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders,
  legacyHeaders,
  message: {
    error: "Rate limit exceeded for this operation. Please wait.",
    retryAfter: 60,
  },
});

/**
 * tRPC path-based rate limiter middleware
 * Routes tRPC calls to appropriate rate limiters based on procedure path
 */
export function trpcRateLimiter(req: Request, res: Response, next: () => void) {
  const path = req.query?.["input"] as string || "";
  const url = req.url || "";

  // AI endpoints
  if (url.includes("ai.generate") || url.includes("ai.getRecommendations")) {
    return aiLimiter(req, res, next);
  }

  // Voice endpoints
  if (url.includes("voice.synthesize")) {
    return voiceLimiter(req, res, next);
  }

  // Auth endpoints
  if (url.includes("auth.")) {
    return authLimiter(req, res, next);
  }

  // Admin operations (more lenient)
  if (url.includes("crm.") || url.includes("admin")) {
    return generalLimiter(req, res, next);
  }

  // Default: general limiter
  return generalLimiter(req, res, next);
}
