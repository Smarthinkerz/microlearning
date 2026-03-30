import { Request, Response, NextFunction } from "express";
import * as dbHelpers from "../db";

// ─── In-Memory Cache ────────────────────────────────────────────────
let cachedAllowedIPs: string[] = [];
let cacheLastRefreshed = 0;
const CACHE_TTL_MS = 60_000; // Refresh every 60 seconds

async function refreshAllowlistCache(): Promise<void> {
  try {
    const entries = await dbHelpers.getActiveAllowlistEntries();
    const now = Date.now();
    const validEntries = entries.filter(
      (entry: any) => !entry.expiresAt || new Date(entry.expiresAt).getTime() > now
    );
    cachedAllowedIPs = validEntries.map((entry: any) => entry.ipAddress);
    cacheLastRefreshed = Date.now();
  } catch (error) {
    console.error("[IPAllowlist] Failed to refresh cache:", error);
  }
}

async function getAllowedIPs(): Promise<string[]> {
  if (Date.now() - cacheLastRefreshed > CACHE_TTL_MS) {
    await refreshAllowlistCache();
  }
  return cachedAllowedIPs;
}

// ─── Normalize IP ───────────────────────────────────────────────────
function normalizeIP(ip: string): string {
  if (ip.startsWith("::ffff:")) {
    return ip.substring(7);
  }
  return ip;
}

// ─── Middleware ──────────────────────────────────────────────────────
/**
 * IP allowlist middleware for admin API endpoints.
 * If no IPs are configured, all requests are allowed (open mode).
 * When IPs are configured, only requests from allowed IPs pass through.
 */
export async function ipAllowlistMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const allowedIPs = await getAllowedIPs();

    // If no IPs configured, allow all (open mode)
    if (allowedIPs.length === 0) {
      next();
      return;
    }

    const clientIP = normalizeIP(req.ip || req.socket.remoteAddress || "");

    // Direct match
    if (allowedIPs.includes(clientIP)) {
      next();
      return;
    }

    // CIDR match
    for (let i = 0; i < allowedIPs.length; i++) {
      const allowed = allowedIPs[i];
      if (allowed.includes("/") && isIPInCIDR(clientIP, allowed)) {
        next();
        return;
      }
    }

    console.warn(`[IPAllowlist] Blocked admin access from IP: ${clientIP}`);
    res.status(403).json({
      error: "Forbidden",
      message: "Your IP address is not authorized for admin access.",
    });
  } catch (error) {
    console.error("[IPAllowlist] Middleware error:", error);
    // Fail open to avoid locking out admins on cache errors
    next();
  }
}

/**
 * Force refresh the IP allowlist cache (call after CRUD operations).
 */
export function invalidateAllowlistCache(): void {
  cacheLastRefreshed = 0;
}

// ─── CIDR Matching ──────────────────────────────────────────────────
function ipToLong(ip: string): number {
  const parts = ip.split(".").map(Number);
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isIPInCIDR(ip: string, cidr: string): boolean {
  try {
    const [network, bits] = cidr.split("/");
    const mask = ~(2 ** (32 - parseInt(bits)) - 1) >>> 0;
    return (ipToLong(ip) & mask) === (ipToLong(network) & mask);
  } catch {
    return false;
  }
}

export { getAllowedIPs, refreshAllowlistCache };
