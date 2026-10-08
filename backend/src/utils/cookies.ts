import { Response } from 'express';

const isProd = process.env.NODE_ENV === 'production';

// Local dev: frontend and backend are both on "localhost" (different ports),
// which browsers treat as same-site — SameSite=Lax works, and Secure must
// stay off since dev runs over plain HTTP.
//
// Production: frontend (e.g. Vercel) and backend (e.g. Cloud Run) are on
// genuinely different domains — that's cross-site, not just cross-origin.
// SameSite=Lax cookies are never attached to cross-site fetch()/XHR calls
// (only to top-level navigations), so with Lax here every authenticated
// API call from the deployed frontend would silently drop its cookies.
// Cross-site cookies require SameSite=None, which browsers only honor
// alongside Secure.
const baseOpts = {
  httpOnly: true,
  sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  secure: isProd,
  path: '/',
};

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string, userData: Record<string, unknown>) {
  res.cookie('access_token', accessToken, { ...baseOpts, maxAge: 15 * 60 * 1000 });
  res.cookie('refresh_token', refreshToken, { ...baseOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
  // user_data is readable by the frontend (not HttpOnly) — mirrors cookieAuth.ts
  // contract. Keep the default percent-encoding here (raw JSON contains
  // characters like {, }, "," that Node's cookie serializer rejects
  // outright) — see the decodeURIComponent fix in cookieAuth.ts's getUser().
  res.cookie('user_data', JSON.stringify(userData), { ...baseOpts, httpOnly: false, maxAge: 7 * 24 * 60 * 60 * 1000 });
}

export function clearAuthCookies(res: Response) {
  res.clearCookie('access_token', baseOpts);
  res.clearCookie('refresh_token', baseOpts);
  res.clearCookie('user_data', { ...baseOpts, httpOnly: false });
}
