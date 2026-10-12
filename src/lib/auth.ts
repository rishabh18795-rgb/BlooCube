// Single, correct logout implementation shared by every dashboard
// (creator/brand/admin). Previously each dashboard had its own ad-hoc
// handleLogout that only called cookieAuthUtils.clearAuth() — a
// client-side-only cookie wipe — and never actually told the backend to
// invalidate the session. Combined with a separate bug in clearAuth()'s
// cookie deletion (see cookieAuth.ts), logout appeared to do nothing:
// the session cookie survived, middleware saw a still-valid session on
// the next navigation, and bounced the user straight back to their
// dashboard.
import { apiRequest, cacheUtils } from "./apiClient";
import { cookieAuthUtils } from "./cookieAuth";

export async function performLogout(): Promise<{ success: boolean; error?: string }> {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } catch (err) {
    // The server call is the one thing that actually invalidates the
    // session (HttpOnly access/refresh tokens can't be cleared any other
    // way). If it fails, don't claim success — the caller should show an
    // error and leave the user where they are rather than pretend they're
    // logged out while a live session cookie remains.
    const message = err instanceof Error ? err.message : "Logout failed. Please try again.";
    return { success: false, error: message };
  }

  // Only reached on a successful server-side logout: clear local cookie
  // state and every cached API response so no stale "still logged in"
  // data can resurface before the redirect completes.
  cookieAuthUtils.clearAuth();
  cacheUtils.clearAll();

  return { success: true };
}
