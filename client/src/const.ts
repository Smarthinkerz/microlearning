export { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";

/**
 * Returns the login page URL.
 *
 * Previously this built a Manus OAuth redirect URL.
 * Now it simply returns the local /login route which uses Supabase Auth.
 *
 * @param returnPath - Optional path to redirect to after login (stored in URL hash)
 */
export const getLoginUrl = (returnPath?: string): string => {
  if (returnPath) {
    return `/login?next=${encodeURIComponent(returnPath)}`;
  }
  return "/login";
};
