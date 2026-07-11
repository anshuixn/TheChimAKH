import { randomUUID } from 'crypto';

/**
 * Generate a unique request ID for structured logging and tracking.
 */
export function generateRequestId(): string {
  return randomUUID();
}
