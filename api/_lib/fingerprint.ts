import { createHash } from 'crypto';

/**
 * Derives a stable content-based SHA-256 hash of the normalized business parameters.
 * Explicitly excludes transient / security fields (turnstileToken, submissionId, _hp).
 */
export function deriveRequestFingerprint(payload: Record<string, any>): string {
  // 1. Filter out transient and security keys
  const keysToExclude = new Set(['turnstileToken', 'submissionId', '_hp', 'consentCaptured']);
  
  const sortedKeys = Object.keys(payload)
    .filter((k) => !keysToExclude.has(k))
    .sort();

  // 2. Build a canonical key-value structure
  const canonicalObj: Record<string, any> = {};
  for (const k of sortedKeys) {
    const val = payload[k];
    // Normalize spacing to avoid spacing differences changing the hash
    canonicalObj[k] = typeof val === 'string' ? val.trim().toLowerCase() : val;
  }

  // 3. Hash the string representation
  const canonicalString = JSON.stringify(canonicalObj);
  const hash = createHash('sha256');
  hash.update(canonicalString);
  return hash.digest('hex');
}
export default deriveRequestFingerprint;
