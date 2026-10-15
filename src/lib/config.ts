// src/lib/config.ts

// Helper function to get frontend URL based on environment
const getFrontendUrl = (): string => {
  if (typeof window !== 'undefined') {
    // Client-side: use current origin
    return window.location.origin;
  }

  // Server-side: use environment variable with fallback
  if (process.env.NODE_ENV === 'production') {
    return process.env.FRONTEND_URL || 'https://Bloocube.com';
  }
  return process.env.FRONTEND_URL || 'http://localhost:3000';
};

export const config = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL,
  appUrl: process.env.NEXT_FRONTEND_API_URL,
  FRONTEND_URL: process.env.FRONTEND_URL,
  aiVideoGenUrl: process.env.NEXT_PUBLIC_AI_VIDEO_GEN_URL || '',
  twitter: {
    callbackUrl: getFrontendUrl() + '/auth/twitter/callback'
  },
  youtube: {
    callbackUrl: getFrontendUrl() + '/auth/youtube/callback'
  },
  instagram: {
    callbackUrl: getFrontendUrl() + '/auth/instagram/callback'
  },
  facebook: {
    callbackUrl: getFrontendUrl() + '/auth/facebook/callback'
  },
  linkedin: {
    callbackUrl: getFrontendUrl() + '/auth/linkedin/callback'
  },
  google: {
    callbackUrl: getFrontendUrl() + '/auth/google/callback'
  },
};

export const getApiBase = (): string => {
  // In development mode, default to localhost but allow overriding the port
  // (e.g. when 5000 is already taken by macOS AirPlay Receiver / ControlCenter).
  if (process.env.NODE_ENV === 'development' || (typeof window !== 'undefined' && window.location.hostname === 'localhost')) {
    return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  }

  const runtime = (globalThis as any)?.NEXT_PUBLIC_API_URL as string | undefined;
  const base = runtime || process.env.NEXT_PUBLIC_API_URL;

  // No base configured (or explicitly empty) means: call this same deployment's
  // own origin. next.config.ts rewrites /api/* to BACKEND_API_URL server-side,
  // so a relative path works no matter which domain (apex, www, or the
  // vercel.app URL) actually served the page — an absolute cross-origin base
  // here would otherwise get blocked by CORS when the page is loaded from a
  // domain other than the one baked into this value at build time.
  if (!base) {
    return '';
  }
  return base.replace(/\/+$/, '');
};