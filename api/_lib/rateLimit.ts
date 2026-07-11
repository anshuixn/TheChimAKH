import { createHmac } from 'crypto';
import type { VercelRequest } from '@vercel/node';
import { getEnv } from './env';
import { getClientIp } from './clientIp';
import { getSupabaseAdmin } from './supabaseAdmin';
import { logAlert, logInfo } from './logger';

export type RateLimitAction = 'contact' | 'quote' | 'honeypot';

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetSeconds: number;
}

// In-memory registry for local development only
const devInMemoryRegistry = new Map<
  string,
  { count: number; expiresAt: number }
>();

/**
 * Derives a stable cryptographically secure pseudonymous identity from client IP.
 * HMAC-SHA256(IP_HASH_SECRET, canonicalizedClientIP)
 */
export function derivePseudonymousIdentity(clientIp: string): string {
  const env = getEnv();
  const hmac = createHmac('sha256', env.IP_HASH_SECRET);
  hmac.update(clientIp);
  return hmac.digest('hex');
}

/**
 * Assesses rate limit status for a given action and request.
 * Enforces atomic RPC calls in production with strict fail-closed security.
 */
export async function consumeRateLimit(
  req: VercelRequest,
  action: RateLimitAction,
  requestId: string
): Promise<RateLimitResult> {
  const env = getEnv();
  const clientIp = getClientIp(req);
  const identity = derivePseudonymousIdentity(clientIp);
  
  // Rate limit keys: contact:<identity>, quote:<identity>, honeypot:<identity>
  const key = `${action}:${identity}`;

  // Establish window boundaries
  // Contact: 5 submissions / 10 minutes
  // Quote: 3 submissions / 15 minutes
  // Honeypot: 3 hits / 30 minutes
  let limit = 5;
  let windowMinutes = 10;

  if (action === 'quote') {
    limit = 3;
    windowMinutes = 15;
  } else if (action === 'honeypot') {
    limit = 3;
    windowMinutes = 30;
  }

  const windowSeconds = windowMinutes * 60;

  // Local development passthrough bypass check
  if (env.DEV_PASSTHROUGH_RATE_LIMIT) {
    logInfo('[RateLimit] Development passthrough active. Bypassing check.', { action, requestId });
    return { allowed: true, limit, remaining: limit, resetSeconds: 0 };
  }

  // Development / Test local in-memory fallback
  if (!env.SUPABASE_URL || env.SUPABASE_URL.includes('localhost') || env.SUPABASE_SERVICE_ROLE_KEY === 'dev_key') {
    return handleInMemoryRateLimit(key, limit, windowSeconds);
  }

  // Production: Atomic RPC execution ONLY (Fail-Closed)
  try {
    const supabase = getSupabaseAdmin();
    
    // Call RPC: increment_rate_limit(key_name text, max_limit int, window_seconds int)
    // Returns JSON: { allowed: boolean, limit: int, remaining: int, reset_seconds: int }
    const { data, error } = await supabase.rpc('increment_rate_limit', {
      key_name: key,
      max_limit: limit,
      window_seconds: windowSeconds,
    });

    if (error) {
      logAlert('[RateLimit] Supabase RPC execution failed in production. Fail-closed triggered.', {
        error: error.message,
        requestId,
        action,
      });
      return { allowed: false, limit, remaining: 0, resetSeconds: windowSeconds };
    }

    const res = data as {
      allowed: boolean;
      limit: number;
      remaining: number;
      reset_seconds: number;
    } | null;

    if (!res) {
      logAlert('[RateLimit] Supabase RPC returned null response in production. Fail-closed triggered.', {
        requestId,
        action,
      });
      return { allowed: false, limit, remaining: 0, resetSeconds: windowSeconds };
    }

    return {
      allowed: res.allowed,
      limit: res.limit,
      remaining: res.remaining,
      resetSeconds: res.reset_seconds,
    };
  } catch (err) {
    // Network / Supabase client unavailable
    logAlert('[RateLimit] Database connection offline or failed in production. Fail-closed triggered.', {
      error: err instanceof Error ? err.message : String(err),
      requestId,
      action,
    });
    return { allowed: false, limit, remaining: 0, resetSeconds: windowSeconds };
  }
}

/**
 * Minimal in-memory rate limiter for local development and testing only.
 */
function handleInMemoryRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const record = devInMemoryRegistry.get(key);

  if (!record || now > record.expiresAt) {
    const expiresAt = now + windowSeconds * 1000;
    devInMemoryRegistry.set(key, { count: 1, expiresAt });
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetSeconds: windowSeconds,
    };
  }

  if (record.count >= limit) {
    const resetSeconds = Math.max(0, Math.round((record.expiresAt - now) / 1000));
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetSeconds,
    };
  }

  record.count++;
  const resetSeconds = Math.max(0, Math.round((record.expiresAt - now) / 1000));
  return {
    allowed: true,
    limit,
    remaining: limit - record.count,
    resetSeconds,
  };
}
