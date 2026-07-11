import { describe, test, expect, beforeAll, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { validateOrigin, validateFetchMetadata, validateRequestSize, setSecurityHeaders } from './http';
import { _resetEnvCache } from './env';

describe('HTTP Security Policy Assertions', () => {
  beforeAll(() => {
    process.env.IP_HASH_SECRET = 'test_secret_key_must_be_32_characters_long_or_more';
    process.env.SUPABASE_URL = 'http://localhost:54321';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'dev_key';
    process.env.ALLOWED_ORIGINS = 'https://maasitaudhyog.com';
    process.env.PREVIEW_ALLOWED_ORIGINS = 'https://preview.maasitaudhyog.com';
    process.env.TURNSTILE_SECRET_KEY = 'test_turnstile_secret_key_mocked';
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    _resetEnvCache();
  });

  test('validateOrigin rejects untrusted cross-origins in production', () => {
    const req = {
      method: 'POST',
      headers: {
        origin: 'https://untrusted-competitor.com',
      },
    } as unknown as VercelRequest;

    expect(validateOrigin(req, 'req_1')).toBe(false);
  });

  test('validateOrigin allows config-matching production origins', () => {
    const req = {
      method: 'POST',
      headers: {
        origin: 'https://maasitaudhyog.com',
      },
    } as unknown as VercelRequest;

    expect(validateOrigin(req, 'req_2')).toBe(true);
  });

  test('validateOrigin rejects localhost origins in production', () => {
    const req = {
      method: 'POST',
      headers: {
        origin: 'http://localhost:3000',
      },
    } as unknown as VercelRequest;

    expect(validateOrigin(req, 'req_3')).toBe(false);
  });

  test('validateFetchMetadata blocks cross-site mutation POST requests', () => {
    const req = {
      method: 'POST',
      headers: {
        'sec-fetch-site': 'cross-site',
        'sec-fetch-mode': 'cors',
      },
    } as unknown as VercelRequest;

    expect(validateFetchMetadata(req, 'req_4')).toBe(false);
  });

  test('validateRequestSize flags content length above 50 KB', () => {
    const req = {
      headers: {
        'content-length': String(60 * 1024), // 60 KB
      },
    } as unknown as VercelRequest;

    const res = {
      status: () => ({
        json: () => {},
      }),
      setHeader: () => {},
    } as unknown as VercelResponse;

    expect(validateRequestSize(req, res, 'req_5')).toBe(false);
  });

  test('setSecurityHeaders sets strict transport and CSP rules', () => {
    const headers: Record<string, string> = {};
    const res = {
      setHeader: (name: string, val: string) => {
        headers[name] = val;
      },
    } as unknown as VercelResponse;

    const req = {
      headers: {
        origin: 'https://maasitaudhyog.com',
      },
    } as unknown as VercelRequest;

    setSecurityHeaders(res, req);

    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['Content-Security-Policy']).toContain("script-src 'self' https://challenges.cloudflare.com");
  });
});
