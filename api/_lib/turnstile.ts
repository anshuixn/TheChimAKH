import { getEnv } from './env.js';
import { logAlert, logError, logInfo, logWarn } from './logger.js';

export type TurnstileResult =
  | 'VERIFIED'
  | 'REJECTED'
  | 'TIMEOUT'
  | 'NETWORK_ERROR'
  | 'PROVIDER_ERROR'
  | 'CONFIGURATION_ERROR';

interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
  action?: string;
}

/**
 * Validates a Turnstile token against Cloudflare APIs.
 * Implements the 6-result taxonomy with fail-closed security.
 */
export async function verifyTurnstileToken(
  token: string,
  clientIp: string,
  requestId: string
): Promise<TurnstileResult> {
  const env = getEnv();

  // Development bypass helper (must never be active in production)
  if (env.DEV_BYPASS_TURNSTILE) {
    logInfo('[Turnstile] Development bypass active. Token verified silently.', { requestId });
    return 'VERIFIED';
  }

  // Strict check: if secret key is missing in production, fail closed
  if (!env.TURNSTILE_SECRET_KEY || env.TURNSTILE_SECRET_KEY === 'dev_turnstile_secret') {
    logAlert('[Turnstile] Secret key is unconfigured or default. Configuration error.', { requestId });
    return 'CONFIGURATION_ERROR';
  }

  const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

  try {
    const response = await fetch(verifyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET_KEY,
        response: token,
        remoteip: clientIp,
      }),
    });

    if (!response.ok) {
      logError(`[Turnstile] Cloudflare verification HTTP failure status: ${response.status}`, null, { requestId });
      return 'PROVIDER_ERROR';
    }

    const result = (await response.json()) as TurnstileVerifyResponse;

    if (result.success) {
      return 'VERIFIED';
    }

    // Evaluate error codes returned by Cloudflare
    const errorCodes = result['error-codes'] || [];
    logWarn('[Turnstile] Verification failed.', { errorCodes, requestId });

    if (errorCodes.includes('invalid-input-secret') || errorCodes.includes('bad-request')) {
      return 'CONFIGURATION_ERROR';
    }

    if (errorCodes.includes('timeout-or-duplicate')) {
      return 'TIMEOUT';
    }

    // Token was invalid, expired, or already used
    return 'REJECTED';
  } catch (err) {
    logError('[Turnstile] Network fetch to Cloudflare API failed.', err, { requestId });
    return 'NETWORK_ERROR';
  }
}
export default verifyTurnstileToken;
