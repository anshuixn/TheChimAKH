import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getEnv } from './env.js';
import { logWarn } from './logger.js';
import { sendResponse } from './responseContract.js';

/**
 * Validates the CORS origin of the incoming request against trust boundaries.
 * Returns true if allowed, false if rejected.
 */
export function validateOrigin(req: VercelRequest, requestId: string): boolean {
  const origin = req.headers.origin;
  if (!origin) {
    // If there's no origin, check Sec-Fetch-Site for same-origin
    const secSite = req.headers['sec-fetch-site'];
    if (secSite === 'same-origin' || secSite === 'same-site') {
      return true;
    }
    // Allow non-cors requests (like server-to-server or direct browser navigation)
    // only if they are GET/HEAD requests. Mutation requests (POST) require an origin.
    if (req.method === 'POST') {
      logWarn('[CORS] Mutation request received without Origin header.', { requestId });
      return false;
    }
    return true;
  }

  const env = getEnv();

  // 1. Local Development Trust
  const isLocal = origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:');
  if (isLocal) {
    if (process.env.NODE_ENV === 'production') {
      logWarn('[CORS] Localhost origin rejected in production environment.', { origin, requestId });
      return false;
    }
    return true;
  }

  // 2. Production Allowed Origins Match
  if (env.ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  // 3. Preview Allowed Origins Match
  if (env.PREVIEW_ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  logWarn('[CORS] Origin rejected under trust policies.', { origin, requestId });
  return false;
}

/**
 * Enforces security headers (CSP, X-Content-Type-Options, HSTS, frame options).
 */
export function setSecurityHeaders(res: VercelResponse, req: VercelRequest): void {
  // Allow origin matching if it passed validation
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-CSRF-Token');
  }

  // Prevent credentials leakage
  res.setHeader('Access-Control-Allow-Credentials', 'false');

  // Prevent framing
  res.setHeader('X-Frame-Options', 'DENY');

  // MIME sniffing protection
  res.setHeader('X-Content-Type-Options', 'nosniff');

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

  // HSTS (2 years, production only)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload');
  }

  // Strict CSP
  // Allow Turnstile origins specifically. Supabase is server-only.
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' https://challenges.cloudflare.com; frame-src 'self' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';"
  );
}

/**
 * Sec-Fetch-Site and Sec-Fetch-Mode cross-site request validation (CSRF mitigation).
 */
export function validateFetchMetadata(req: VercelRequest, requestId: string): boolean {
  const secSite = req.headers['sec-fetch-site'];
  const secMode = req.headers['sec-fetch-mode'];

  if (secSite && secMode) {
    // If it's cross-site, only allow navigated GET requests. Block mutation requests.
    if (secSite === 'cross-site' && req.method === 'POST') {
      logWarn('[Security] Sec-Fetch metadata violation. Blocked cross-site POST.', {
        secSite,
        secMode,
        requestId,
      });
      return false;
    }
  }

  return true;
}

/**
 * Validates request payload sizes (strict 50 KB body size threshold).
 */
export function validateRequestSize(req: VercelRequest, res: VercelResponse, requestId: string): boolean {
  const contentLength = req.headers['content-length'];
  if (contentLength) {
    const size = parseInt(contentLength, 10);
    if (isNaN(size) || size > 50 * 1024) {
      logWarn('[Security] Content-Length exceeds 50 KB threshold.', { size, requestId });
      sendResponse(res, 'PAYLOAD_TOO_LARGE', 'PAYLOAD EXCEEDS STORAGE BOUNDARIES.', requestId);
      return false;
    }
  }
  return true;
}
export default { validateOrigin, setSecurityHeaders, validateFetchMetadata, validateRequestSize };
