import type { VercelRequest } from '@vercel/node';

/**
 * Resolves the client IP address from request headers.
 * Precedence:
 * 1. x-real-ip (provided by Vercel router)
 * 2. x-forwarded-for (takes the first left-most IP after canonicalizing)
 *
 * Checks formats and performs IPv4/IPv6 canonicalization.
 */
export function getClientIp(req: VercelRequest): string {
  // 1. Check X-Real-IP
  const xRealIp = req.headers['x-real-ip'];
  if (xRealIp && typeof xRealIp === 'string') {
    return canonicalizeIp(xRealIp.trim());
  }

  // 2. Check X-Forwarded-For
  const xForwardedFor = req.headers['x-forwarded-for'];
  if (xForwardedFor && typeof xForwardedFor === 'string') {
    // Take the first, left-most IP from the list
    const parts = xForwardedFor.split(',');
    const clientPart = parts[0]?.trim();
    if (clientPart) {
      return canonicalizeIp(clientPart);
    }
  }

  // Local development fallback
  if (process.env.NODE_ENV !== 'production') {
    return '127.0.0.1';
  }

  // Production fallback: throw error to fail closed if client identity cannot be verified
  throw new Error('[ClientIP] Unable to resolve trustworthy client identity header in production.');
}

/**
 * Standardizes IP addresses (removing port numbers, canonicalizing loopbacks).
 */
function canonicalizeIp(ip: string): string {
  let cleaned = ip;

  // 1. Remove port numbers from IPv4 (e.g. 192.168.1.1:8080)
  if (cleaned.includes('.') && cleaned.includes(':')) {
    const parts = cleaned.split(':');
    cleaned = parts[0] || cleaned;
  }

  // 2. Normalize local loopbacks
  if (cleaned === '::1' || cleaned === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }

  return cleaned;
}
