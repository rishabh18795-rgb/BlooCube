import { measureApiCall } from '@/lib/performance';
import { loadingManager } from '@/lib/loading';
import { getApiBase } from '@/lib/config';
import { ApiError } from '@/lib/errors';

// type TokenPair = { accessToken: string; refreshToken: string; expiresIn: number };

// Request cache for GET requests
const requestCache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
const pendingRequests = new Map<string, Promise<unknown>>();

// Cache TTL in milliseconds
const CACHE_TTL = {
  SHORT: 30 * 1000,    // 30 seconds
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000   // 30 minutes
};

// Cache size limits
const MAX_CACHE_SIZE = 100;
const MAX_PENDING_REQUESTS = 50;

// Request timeout in milliseconds
const REQUEST_TIMEOUT_MS = 30000; // 30 seconds

function sleep(ms: number) { return new Promise(resolve => setTimeout(resolve, ms)); }

// Enhanced token refresh with caching
let refreshPromise: Promise<string | null> | null = null;

async function refreshAppToken(): Promise<string | null> {
  // Prevent multiple simultaneous refresh attempts
  if (refreshPromise) {
    return refreshPromise;
  }

  refreshPromise = (async () => {
    if (typeof window === 'undefined') return null;

    const base = getApiBase();
    const res = await fetch(`${base}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include' // This will send the refresh token cookie
    });
    
    if (!res.ok) return null;
    
    const data: { success?: boolean; data?: { user: Record<string, unknown> } } = await res.json().catch(() => ({}));
    if (data && data.data && data.data.user) {
      // Update user data in cookie (tokens are handled by server)
      const { cookieAuthUtils } = await import('@/lib/cookieAuth');
      cookieAuthUtils.updateUserData(data.data.user);
      return 'refreshed'; // Return a success indicator
    }
    return null;
  })();

  try {
    return await refreshPromise;
  } finally {
    refreshPromise = null;
  }
}

// Generate cache key for requests
function getCacheKey(path: string, init: RequestInit): string {
  const method = init.method || 'GET';
  const body = init.body ? JSON.stringify(init.body) : '';
  // Include query parameters in cache key to prevent collisions
  try {
    const url = new URL(path, 'http://dummy');
    const query = url.search; // Includes '?' and all query params
    return `${method}:${path}${query}:${body}`;
  } catch {
    // If URL parsing fails, use original path
    return `${method}:${path}:${body}`;
  }
}

// Check if request should be cached
function shouldCache(path: string, method: string): boolean {
  return method === 'GET' && !path.includes('/auth/') && !path.includes('/callback');
}

// Get cache TTL based on endpoint
function getCacheTTL(path: string): number {
  // Posts data - relatively stable, can cache longer (optimized from 30s to 2min)
  if (path.includes('/posts') && !path.includes('/sync') && !path.includes('/publish') && !path.includes('/schedule')) {
    return 2 * 60 * 1000; // 2 minutes (was 30 seconds)
  }
  
  // Analytics - changes frequently, keep short
  if (path.includes('/analytics')) {
    return CACHE_TTL.SHORT; // 30 seconds
  }
  
  // Platform connections - stable, cache longer
  if (path.includes('/platform') || path.includes('/connection')) {
    return CACHE_TTL.MEDIUM; // 5 minutes
  }
  
  // Profile - very stable
  if (path.includes('/profile') || path.includes('/channel')) {
    return 10 * 60 * 1000; // 10 minutes (was 5 minutes)
  }
  
  // Campaigns - moderate stability
  if (path.includes('/campaigns')) {
    return CACHE_TTL.SHORT; // 30 seconds
  }
  
  // Auth status - very stable
  if (path.includes('/auth/status')) {
    return CACHE_TTL.LONG; // 30 minutes
  }
  
  return CACHE_TTL.SHORT; // Default: 30 seconds
}

// Cleanup old cache entries and enforce size limits
function cleanupCache(): void {
  const now = Date.now();
  const keysToDelete: string[] = [];
  
  // Remove expired entries
  for (const [key, value] of requestCache.entries()) {
    if (now - value.timestamp > value.ttl) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => requestCache.delete(key));
  
  // Limit cache size (remove oldest entries)
  if (requestCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(requestCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toRemove = entries.slice(0, requestCache.size - MAX_CACHE_SIZE);
    toRemove.forEach(([key]) => requestCache.delete(key));
  }
  
  // Limit pending requests size
  if (pendingRequests.size > MAX_PENDING_REQUESTS) {
    // Remove oldest pending requests (we can't sort promises, so just clear some)
    const keys = Array.from(pendingRequests.keys()).slice(0, pendingRequests.size - MAX_PENDING_REQUESTS);
    keys.forEach(key => pendingRequests.delete(key));
  }
}

// Run cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(cleanupCache, 5 * 60 * 1000);
}

export async function apiRequest<T = unknown>(path: string, init: RequestInit = {}, retries = 1): Promise<T> {
  const base = getApiBase();
  const method = init.method || 'GET';
  const cacheKey = getCacheKey(path, init);
  // Only show global loading when explicitly requested (manual refresh)
  const showLoading = (init as unknown as { showLoading?: boolean })?.showLoading === true
    || (typeof init.headers === 'object' && init.headers !== null && (init.headers as Record<string, string>)['X-Show-Loading'] === '1');
  
  // Check cache for GET requests
  if (shouldCache(path, method)) {
    const cached = requestCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      console.log(`📦 Cache hit: ${method} ${path}`);
      return cached.data as T;
    }
  }

  // Check for pending requests to prevent duplicates
  if (pendingRequests.has(cacheKey)) {
    console.log(`⏳ Request deduplication: ${method} ${path}`);
    return pendingRequests.get(cacheKey)! as Promise<T>;
  }

  // With HttpOnly cookies, we don't need to manually add Authorization header
  // The cookies will be sent automatically with credentials: 'include'
  
  console.log(`🌐 API Request: ${method} ${base}${path}`, {
    retries,
    cached: false,
    baseUrl: base,
    fullUrl: `${base}${path}`,
    usingCookies: true
  });

  // Create request promise with performance monitoring
  const requestPromise = (async (): Promise<T> => {
    if (showLoading) loadingManager.start();
    try {
      return await measureApiCall(async (): Promise<T> => {
        // Check if body is FormData - if so, don't set Content-Type header
        const isFormData = init.body instanceof FormData;
        const headers: Record<string, string> = {};
        
        if (!isFormData) {
          headers['Content-Type'] = 'application/json';
        }
        
        // Merge any additional headers
        if (init.headers) {
          Object.assign(headers, init.headers);
        }
        
        // Create AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        
        let res: Response;
        try {
          res = await fetch(`${base}${path}`, {
            ...init,
            headers,
            credentials: 'include', // This sends HttpOnly cookies automatically
            signal: controller.signal
          });
          clearTimeout(timeoutId);
        } catch (fetchError) {
          clearTimeout(timeoutId);
          // Clean up pending request
          pendingRequests.delete(cacheKey);
          if (showLoading) loadingManager.done();
          
          // Handle network errors
          if (fetchError instanceof TypeError && fetchError.message === 'Failed to fetch') {
            throw new ApiError('Network error. Please check your connection.', {
              status: 0,
              code: 'NETWORK_ERROR'
            });
          }
          if (fetchError instanceof Error && fetchError.name === 'AbortError') {
            throw new ApiError('Request timeout. Please try again.', {
              status: 0,
              code: 'TIMEOUT'
            });
          }
          throw new ApiError('Request failed. Please try again.', {
            status: 0,
            code: 'REQUEST_FAILED'
          });
        }

      // Only attempt refresh for protected, non-auth endpoints
      const isAuthEndpoint = path.startsWith('/api/auth/');
      if (res.status === 401 && retries > 0 && !isAuthEndpoint) {
        console.log('🔑 Token expired, attempting refresh...');
        const newToken = await refreshAppToken();
        if (newToken) {
          console.log('✅ Token refreshed successfully, retrying request');
          // Wait a bit for cookies to be set
          await sleep(100);
          // Remove current pending request before retrying
          pendingRequests.delete(cacheKey);
          return apiRequest<T>(path, init, retries - 1);
        } else {
          console.log('❌ Token refresh failed, clearing auth and redirecting');
          if (typeof window !== 'undefined') {
            // Clear user data cookie
            const { cookieAuthUtils } = await import('@/lib/cookieAuth');
            cookieAuthUtils.clearAuth();
            // Also clear the request cache, same as the explicit logout
            // button (performLogout) does — otherwise a stale cached
            // /api/profile/me (or any other cached GET) from this session
            // could be served to whoever logs in next on this tab, on the
            // rare path below where no redirect happens (already on a
            // public route).
            cacheUtils.clearAll();
            // Trigger auth sync to update UI
            window.dispatchEvent(new CustomEvent('authChange'));
            // Only redirect if not already on login page or landing page
            const pathname = window.location.pathname;
            const publicRoutes = ['/', '/about', '/privacy', '/terms', '/login', '/signup'];
            const isPublicRoute = publicRoutes.includes(pathname) || pathname.startsWith('/auth/');
            if (!isPublicRoute) {
              window.location.href = '/login';
            }
          }
          throw new ApiError('Authentication failed - please sign in again', { status: 401 });
        }
      }

      // Handle 429 (Too Many Requests) with Retry-After header support
      if (res.status === 429 && retries > 0) {
        const retryAfterHeader = res.headers.get('retry-after');
        let delay: number;
        
        if (retryAfterHeader) {
          // Respect server's Retry-After header (in seconds)
          const retryAfterSeconds = Number.parseInt(retryAfterHeader, 10);
          delay = retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : 60000; // Default to 60s if invalid
          console.log(`⏸️ Rate limited. Retrying after ${retryAfterSeconds}s as per Retry-After header`);
        } else {
          // Exponential backoff if no Retry-After header
          const attempt = Math.max(1, 2 - retries + 1);
          delay = Math.min(1000 * Math.pow(2, attempt), 60000); // Cap at 60 seconds
          console.log(`⏸️ Rate limited. Retrying after ${delay}ms (exponential backoff)`);
        }
        
        await sleep(delay);
        // Remove current pending request before retrying
        pendingRequests.delete(cacheKey);
        return apiRequest<T>(path, init, retries - 1);
      }

      // Exponential backoff for 5xx errors
      if (res.status >= 500 && res.status <= 599 && retries > 0) {
        const attempt = Math.max(1, 2 - retries + 1);
        const delay = Math.min(300 * Math.pow(2, attempt - 1), 3000);
        await sleep(delay);
        // Remove current pending request before retrying
        pendingRequests.delete(cacheKey);
        return apiRequest<T>(path, init, retries - 1);
      }

      if (!res.ok) {
        // Read response as text first (response body can only be consumed once)
        const responseText = await res.text().catch(() => 'Could not read response text');
        let body: unknown = null;
        try {
          body = responseText ? JSON.parse(responseText) : { message: `HTTP ${res.status} ${res.statusText}` };
        } catch (e) {
          console.log(`❌ Failed to parse error response as JSON:`, e);
          body = { message: `HTTP ${res.status} ${res.statusText}` };
        }
        
        // Normalize error message extraction (handle different error structures)
        const parsed = body as {
          error?: string | { message?: string; code?: string };
          message?: string;
          code?: string | number;
          details?: unknown;
          validation_errors?: unknown;
          errors?: unknown;
          validation?: unknown;
        } | null;
        
        let message = '';
        if (typeof parsed?.error === 'string') {
          message = parsed.error;
        } else if (parsed?.error && typeof parsed.error === 'object' && parsed.error.message) {
          message = parsed.error.message;
        } else if (parsed?.message) {
          message = parsed.message;
        } else {
          message = `HTTP ${res.status} ${res.statusText}`;
        }
        
        const retryAfterHeader = res.headers.get('retry-after');
        const retryAfter = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) : undefined;
        
        console.log(`❌ API Error: ${res.status} ${res.statusText}`, {
          path,
          message,
          code: parsed?.code,
          details: parsed?.details,
          validationErrors: parsed?.validation_errors || parsed?.errors || parsed?.validation,
          fullResponse: parsed,
          responseText: responseText
        });
        
        // Throw structured ApiError with helpful fields
        throw new ApiError(message, {
          status: res.status,
          code: parsed?.code,
          details: parsed?.details || parsed?.validation_errors || parsed?.errors || parsed?.validation,
          retryAfter,
          raw: parsed ?? body
        });
      }

      // Validate content-type before parsing JSON
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text().catch(() => 'Could not read response');
        throw new ApiError(`Unexpected response format: ${contentType}`, {
          status: res.status,
          code: 'INVALID_RESPONSE_FORMAT',
          raw: text
        });
      }

      // Parse JSON response with error handling
      // Read response as text first, then parse (in case parsing fails, we have the text)
      const responseText = await res.text().catch(() => 'Could not read response');
      let data: T;
      try {
        data = JSON.parse(responseText) as T;
      } catch (parseError) {
        throw new ApiError('Failed to parse response', {
          status: res.status,
          code: 'PARSE_ERROR',
          raw: responseText
        });
      }

      // Cache successful GET requests
      if (shouldCache(path, method)) {
        const ttl = getCacheTTL(path);
        requestCache.set(cacheKey, {
          data,
          timestamp: Date.now(),
          ttl
        });
        console.log(`💾 Cached: ${method} ${path} (TTL: ${ttl}ms)`);
      }

      // Auto-invalidate cache for mutations (POST/PUT/DELETE/PATCH)
      if (method !== 'GET' && res.ok) {
        // Extract base path without query params for cache invalidation
        const basePath = path.split('?')[0];
        
        // Invalidate related caches
        if (basePath.includes('/posts')) {
          cacheUtils.clearPattern('/api/posts');
          cacheUtils.clearPattern('/api/analytics');
          console.log(`🗑️ Auto-invalidated cache for: /api/posts, /api/analytics`);
        } else if (basePath.includes('/campaigns')) {
          cacheUtils.clearPattern('/api/campaigns');
          console.log(`🗑️ Auto-invalidated cache for: /api/campaigns`);
        } else if (basePath.includes('/bids')) {
          cacheUtils.clearPattern('/api/bids');
          cacheUtils.clearPattern('/api/campaigns');
          console.log(`🗑️ Auto-invalidated cache for: /api/bids, /api/campaigns`);
        } else if (basePath.includes('/analytics')) {
          cacheUtils.clearPattern('/api/analytics');
          console.log(`🗑️ Auto-invalidated cache for: /api/analytics`);
        } else if (basePath.includes('/engagement')) {
          cacheUtils.clearPattern('/api/engagement');
          console.log(`🗑️ Auto-invalidated cache for: /api/engagement`);
        } else if (basePath.includes('/conversations')) {
          cacheUtils.clearPattern('/api/conversations');
          console.log(`🗑️ Auto-invalidated cache for: /api/conversations`);
        } else if (basePath.includes('/profile')) {
          // Avatar upload/remove, profile save, and delete-account all mutate
          // GET /api/profile/me, which is cached for 10 minutes (see
          // getCacheTTL). Without this, a refreshProfile() call right after
          // a successful mutation serves the stale pre-mutation response —
          // the UI shows a success toast but the change never visibly
          // appears until the cache naturally expires or a full page reload
          // resets this in-memory cache.
          cacheUtils.clearPattern('/api/profile');
          console.log(`🗑️ Auto-invalidated cache for: /api/profile`);
        }
      }

        return data;
      }, path);
    } catch (error) {
      // Re-throw error after ensuring cleanup
      throw error;
    } finally {
      // Always cleanup, even on errors
      pendingRequests.delete(cacheKey);
      if (showLoading) loadingManager.done();
    }
  })();

  // Store pending request
  pendingRequests.set(cacheKey, requestPromise);

  return requestPromise;
}

// Cache management utilities
export const cacheUtils = {
  // Clear all cache
  clearAll(): void {
    requestCache.clear();
    pendingRequests.clear();
    console.log('🗑️ All API cache cleared');
  },

  // Clear cache for specific path pattern
  clearPattern(pattern: string): void {
    const keysToDelete = Array.from(requestCache.keys()).filter(key => key.includes(pattern));
    keysToDelete.forEach(key => requestCache.delete(key));
    console.log(`🗑️ Cleared cache for pattern: ${pattern} (${keysToDelete.length} entries)`);
  },

  // Clear cache for specific endpoint (exact match or pattern)
  clearEndpoint(endpoint: string): void {
    const keysToDelete = Array.from(requestCache.keys()).filter(key => {
      // Match GET requests to this endpoint (with or without query params)
      return key.startsWith(`GET:${endpoint}`) || key.includes(`:${endpoint}?`) || key.includes(`:${endpoint}:`);
    });
    keysToDelete.forEach(key => requestCache.delete(key));
    console.log(`🗑️ Cleared cache for endpoint: ${endpoint} (${keysToDelete.length} entries)`);
  },

  // Get cache stats
  getStats(): { size: number; keys: string[] } {
    return {
      size: requestCache.size,
      keys: Array.from(requestCache.keys())
    };
  },

  // Run cleanup manually
  cleanup(): void {
    cleanupCache();
  }
};

