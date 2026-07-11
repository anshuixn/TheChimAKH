/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/restrict-template-expressions */
/**
 * Client Environment Variable Validation
 */

const PLACEHOLDER_SITE_URL = 'https://maasitaudhyog.com';
const PLACEHOLDER_TURNSTILE_KEY = 'your-turnstile-site-key';

export function getSiteUrl(): string {
  const url = import.meta.env.VITE_SITE_URL;
  if (!url || url.includes('your-') || url === PLACEHOLDER_SITE_URL) {
    // Return window origin as fallback in dev mode
    if (import.meta.env.DEV) {
      return window.location.origin;
    }
  }
  return url || PLACEHOLDER_SITE_URL;
}

export function getTurnstileSiteKey(): string {
  return import.meta.env.VITE_TURNSTILE_SITE_KEY || '';
}

export function isTurnstileConfigured(): boolean {
  const key = import.meta.env.VITE_TURNSTILE_SITE_KEY;
  return !!key && key !== PLACEHOLDER_TURNSTILE_KEY && !key.includes('your-');
}

export function validateClientEnv(): void {
  const url = import.meta.env.VITE_SITE_URL;
  const turnstileKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;

  const isConfigured = 
    !!url && 
    url !== PLACEHOLDER_SITE_URL && 
    !url.includes('your-') &&
    !!turnstileKey && 
    turnstileKey !== PLACEHOLDER_TURNSTILE_KEY && 
    !turnstileKey.includes('your-');

  if (!isConfigured) {
    const notice = 
      `\n[MAA SITA INT UDHYOG] Client-side environment variables incomplete:\n` +
      `  • VITE_SITE_URL: ${url || 'missing'}\n` +
      `  • VITE_TURNSTILE_SITE_KEY: ${turnstileKey || 'missing'}\n\n` +
      `Running in local development / demo mode.\n` +
      `Configure .env.local with valid credentials for full production behaviour.\n`;

    if (import.meta.env.PROD) {
      throw new Error(notice);
    } else {
      console.warn(notice);
    }
  }
}
