/**
 * Server-Side Environment Variable Validation
 */

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export interface ServerEnv {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  IP_HASH_SECRET: string;
  TURNSTILE_SECRET_KEY: string;
  RESEND_API_KEY?: string;
  ALLOWED_ORIGINS: string[];
  PREVIEW_ALLOWED_ORIGINS: string[];
  NOTIFICATION_EMAIL?: string;
  // Dev mode bypass flags (must NEVER be active in production)
  DEV_BYPASS_TURNSTILE: boolean;
  DEV_PASSTHROUGH_RATE_LIMIT: boolean;
}

let cachedEnv: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cachedEnv) return cachedEnv;

  const url = process.env.SUPABASE_URL;
  const roleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const ipSecret = process.env.IP_HASH_SECRET;
  const turnstileSecret = process.env.TURNSTILE_SECRET_KEY;
  const resendKey = process.env.RESEND_API_KEY;
  const allowed = process.env.ALLOWED_ORIGINS;
  const previewAllowed = process.env.PREVIEW_ALLOWED_ORIGINS;
  const notificationEmail = process.env.NOTIFICATION_EMAIL;

  const errors: string[] = [];

  // 1. Mandatory variables in any environment
  if (!url) errors.push('SUPABASE_URL is missing.');

  // 2. Production strict checks
  if (isProduction()) {
    if (!roleKey) {
      errors.push('SUPABASE_SERVICE_ROLE_KEY is mandatory in production.');
    }
    if (!ipSecret) {
      errors.push('IP_HASH_SECRET is mandatory in production.');
    } else if (ipSecret.length < 32) {
      errors.push('IP_HASH_SECRET must be at least 32 characters long for cryptographic safety.');
    }
    if (!turnstileSecret) {
      errors.push('TURNSTILE_SECRET_KEY is mandatory in production.');
    }
  } else {
    // Development fallback values to prevent blocks during initial local setups
    if (!roleKey) console.warn('[Env] SUPABASE_SERVICE_ROLE_KEY is missing. Local actions might fail.');
    if (!ipSecret) console.warn('[Env] IP_HASH_SECRET is missing. Defaulting to development key.');
    if (!turnstileSecret) console.warn('[Env] TURNSTILE_SECRET_KEY is missing. Security bypass flags must be configured.');
  }

  if (errors.length > 0) {
    throw new Error(`[Env Config Failure] Server configuration incomplete:\n  ${errors.join('\n  ')}`);
  }

  // Parse CORS arrays
  const parseOrigins = (raw: string | undefined): string[] => {
    if (!raw) return [];
    return raw.split(',').map((o) => o.trim()).filter(Boolean);
  };

  const parsedAllowed = parseOrigins(allowed);
  const parsedPreview = parseOrigins(previewAllowed);

  // Check development bypass flags (fail-closed check: throw if set in production)
  const isBypassTurnstile = process.env.BOT_PROTECTION_MODE === 'development_bypass';
  const isPassthroughRateLimit = process.env.RATE_LIMIT_MODE === 'development_passthrough';

  if (isProduction()) {
    if (isBypassTurnstile) {
      throw new Error('[Env Fail-Closed] BOT_PROTECTION_MODE=development_bypass is prohibited in production.');
    }
    if (isPassthroughRateLimit) {
      throw new Error('[Env Fail-Closed] RATE_LIMIT_MODE=development_passthrough is prohibited in production.');
    }
  }

  cachedEnv = {
    SUPABASE_URL: url || '',
    SUPABASE_SERVICE_ROLE_KEY: roleKey || 'dev_key',
    IP_HASH_SECRET: ipSecret || 'dev_temporary_ip_hash_secret_min_32_chars',
    TURNSTILE_SECRET_KEY: turnstileSecret || 'dev_turnstile_secret',
    RESEND_API_KEY: resendKey,
    ALLOWED_ORIGINS: parsedAllowed,
    PREVIEW_ALLOWED_ORIGINS: parsedPreview,
    NOTIFICATION_EMAIL: notificationEmail,
    DEV_BYPASS_TURNSTILE: !isProduction() && isBypassTurnstile,
    DEV_PASSTHROUGH_RATE_LIMIT: !isProduction() && isPassthroughRateLimit,
  };

  return cachedEnv;
}

export function _resetEnvCache(): void {
  cachedEnv = null;
}

export default getEnv;
