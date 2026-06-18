/**
 * Supabase Auth Routes
 *
 * Supabase handles the full OAuth/email flow on the client side.
 * The server only needs:
 * 1. A /api/auth/me endpoint to return the current user (from JWT)
 * 2. A /api/auth/logout endpoint to clear any server-side state
 *
 * All login/register/OAuth flows are handled by the Supabase JS client
 * on the frontend — no server-side OAuth callback needed.
 */

import type { Express, Request, Response } from "express";
import * as db from "../db";
import { sdk } from "./sdk";

export function registerOAuthRoutes(app: Express) {
  /**
   * GET /api/auth/me
   * Returns the current authenticated user from the Supabase JWT.
   * Used by the frontend to hydrate auth state on page load.
   */
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    try {
      const user = await sdk.authenticateRequest(req);
      res.json({ user });
    } catch {
      res.status(401).json({ user: null });
    }
  });

  /**
   * POST /api/auth/logout
   * Stateless logout — Supabase JWTs are short-lived (1 hour).
   * The frontend calls supabase.auth.signOut() which clears the token.
   * This endpoint is a no-op but kept for API consistency.
   */
  app.post("/api/auth/logout", (_req: Request, res: Response) => {
    res.json({ success: true });
  });

  /**
   * Legacy Manus OAuth callback — kept to avoid 404 errors during migration.
   * Redirects to home; users should log in via Supabase Auth.
   */
  app.get("/api/oauth/callback", (_req: Request, res: Response) => {
    res.redirect(302, "/?auth=supabase");
  });
}
