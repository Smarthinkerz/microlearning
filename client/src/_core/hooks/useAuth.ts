/**
 * useAuth — Supabase Auth hook
 *
 * Replaces the old Manus OAuth-based hook.
 * Uses Supabase JS client for session management and tRPC for the local user record.
 *
 * The Supabase JWT is sent automatically on every tRPC request via the
 * Authorization header (configured in main.tsx).
 */

import { supabase } from "@/lib/supabase";
import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } =
    options ?? {};

  const utils = trpc.useUtils();

  // Track Supabase session state locally
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    // Hydrate session on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });

    // Subscribe to auth state changes (login, logout, token refresh)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch the local user record from our database (via tRPC)
  // Only run when we have a Supabase session
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
    enabled: session !== undefined, // wait until session is hydrated
  });

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    // Clear tRPC cache
    utils.auth.me.setData(undefined, null);
    await utils.auth.me.invalidate();
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  }, [utils]);

  const sessionLoading = session === undefined;
  const loading = sessionLoading || (session !== null && meQuery.isLoading);

  const state = useMemo(() => {
    const user = meQuery.data ?? null;
    // Persist for any legacy code that reads from localStorage
    if (user) {
      localStorage.setItem("manus-runtime-user-info", JSON.stringify(user));
    }
    return {
      user,
      session,
      loading,
      error: meQuery.error ?? null,
      isAuthenticated: Boolean(session && user),
    };
  }, [meQuery.data, meQuery.error, session, loading]);

  // Redirect to login if unauthenticated (and option is set)
  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (loading) return;
    if (state.isAuthenticated) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;

    window.location.href = redirectPath;
  }, [redirectOnUnauthenticated, redirectPath, loading, state.isAuthenticated]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}
