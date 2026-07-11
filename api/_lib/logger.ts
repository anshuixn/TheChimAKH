/**
 * api/_lib/logger.ts
 * ===================
 * Centralized, structured JSON logger.
 * Auto-redacts sensitive fields (PII) like name, phone, email, company, message,
 * and Turnstile tokens before writing to stdout.
 *
 * Sinks:
 * - Production stdout (JSON format) -> Auto-collected by Vercel Logs.
 * - Alerts sink: Logs containing "[ALERT]" will trigger Vercel log alarms or Slack webhooks
 *   configured in the Vercel integration console.
 */

const SENSITIVE_KEYS = new Set([
  'name',
  'phone',
  'email',
  'company',
  'message',
  'turnstileToken',
  'projectLocation',
  '_hp',
]);

/**
 * Traverses a payload object and replaces values of sensitive keys with "[REDACTED]".
 */
export function redact(payload: any): any {
  if (payload === null || payload === undefined) return payload;
  
  if (Array.isArray(payload)) {
    return payload.map(redact);
  }
  
  if (typeof payload === 'object') {
    const redacted: Record<string, any> = {};
    for (const key of Object.keys(payload)) {
      if (SENSITIVE_KEYS.has(key)) {
        redacted[key] = '[REDACTED]';
      } else {
        redacted[key] = redact(payload[key]);
      }
    }
    return redacted;
  }
  
  return payload;
}

export function logInfo(message: string, context?: Record<string, any>): void {
  console.log(
    JSON.stringify({
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message,
      context: context ? redact(context) : undefined,
    })
  );
}

export function logWarn(message: string, context?: Record<string, any>): void {
  console.warn(
    JSON.stringify({
      level: 'WARN',
      timestamp: new Date().toISOString(),
      message,
      context: context ? redact(context) : undefined,
    })
  );
}

/**
 * Log structural or configuration alerts. Contains the [ALERT] tag
 * to trigger configured notification systems (Slack, Email alarms) at Vercel.
 */
export function logAlert(message: string, context?: Record<string, any>): void {
  console.error(
    JSON.stringify({
      level: 'ALERT',
      timestamp: new Date().toISOString(),
      message: `[ALERT] ${message}`,
      context: context ? redact(context) : undefined,
    })
  );
}

export function logError(message: string, error?: any, context?: Record<string, any>): void {
  console.error(
    JSON.stringify({
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message,
      error: error instanceof Error ? { name: error.name, message: error.message, stack: '[REDACTED_STACK]' } : String(error),
      context: context ? redact(context) : undefined,
    })
  );
}
export default { redact, logInfo, logWarn, logAlert, logError };
