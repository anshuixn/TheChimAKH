import { describe, test, expect, vi, beforeAll, afterEach } from 'vitest';
import type { VercelRequest, VercelResponse } from '@vercel/node';
import contactHandler from '../../api/contact';
import quoteHandler from '../../api/quote';
import { _resetEnvCache } from '../../api/_lib/env';

// Mock Supabase lazy admin client
const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });

const mockBuilder = {
  select: mockSelect,
  insert: mockInsert,
  eq: mockEq,
  maybeSingle: mockSingle,
};

vi.mock('../../api/_lib/supabaseAdmin', () => ({
  getSupabaseAdmin: () => ({
    from: () => mockBuilder,
  }),
}));

// Mock Turnstile verify token
vi.mock('../../api/_lib/turnstile', () => ({
  verifyTurnstileToken: vi.fn().mockResolvedValue('VERIFIED'),
}));

// Mock Email notification
vi.mock('../../api/_lib/email', () => ({
  sendEmailNotification: vi.fn().mockResolvedValue(undefined),
}));

describe('API Endpoints Security Pipeline Tests', () => {
  beforeAll(() => {
    process.env.IP_HASH_SECRET = 'test_secret_key_must_be_32_characters_long_or_more';
    process.env.SUPABASE_URL = 'http://localhost:54321';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'dev_key';
    process.env.ALLOWED_ORIGINS = 'https://maasitaudhyog.com';
    process.env.TURNSTILE_SECRET_KEY = 'test_turnstile_secret';
    process.env.NODE_ENV = 'production';
  });

  afterEach(() => {
    vi.clearAllMocks();
    _resetEnvCache();
  });

  test('POST /api/contact blocks requests from untrusted origins', async () => {
    const req = {
      method: 'POST',
      headers: {
        origin: 'https://hacker.com',
      },
    } as unknown as VercelRequest;

    let statusCode: number | null = null;
    let responseBody: any = null;

    const res = {
      status: (code: number) => {
        statusCode = code;
        return {
          json: (body: any) => {
            responseBody = body;
          },
        };
      },
      setHeader: () => {},
    } as unknown as VercelResponse;

    await contactHandler(req, res);

    expect(statusCode).toBe(403);
    expect(responseBody.category).toBe('ORIGIN_REJECTED');
  });

  test('POST /api/contact validates payload schema', async () => {
    const req = {
      method: 'POST',
      headers: {
        origin: 'https://maasitaudhyog.com',
        'content-type': 'application/json',
        'x-real-ip': '127.0.0.1',
      },
      body: {
        name: '', // Empty name (invalid)
        phone: '12345', // Short phone
        email: 'invalid-email',
        message: '',
        submissionId: 'not-a-uuid',
        turnstileToken: '',
        consentCaptured: false,
      },
    } as unknown as VercelRequest;

    let statusCode: number | null = null;
    let responseBody: any = null;

    const res = {
      status: (code: number) => {
        statusCode = code;
        return {
          json: (body: any) => {
            responseBody = body;
          },
        };
      },
      setHeader: () => {},
    } as unknown as VercelResponse;

    await contactHandler(req, res);

    expect(statusCode).toBe(400);
    expect(responseBody.category).toBe('VALIDATION_ERROR');
    expect(responseBody.errors).toBeDefined();
  });

  test('POST /api/contact captures honeypot and returns silent success', async () => {
    const req = {
      method: 'POST',
      headers: {
        origin: 'https://maasitaudhyog.com',
        'content-type': 'application/json',
        'x-real-ip': '127.0.0.1',
      },
      body: {
        name: 'Bot User',
        phone: '9876543210',
        email: 'bot@spam.com',
        message: 'Spam content',
        submissionId: '550e8400-e29b-41d4-a716-446655440000',
        turnstileToken: 'test_token',
        consentCaptured: true,
        _hp: 'spam_field_value', // bot triggered honeypot
      },
    } as unknown as VercelRequest;

    let statusCode: number | null = null;
    let responseBody: any = null;

    const res = {
      status: (code: number) => {
        statusCode = code;
        return {
          json: (body: any) => {
            responseBody = body;
          },
        };
      },
      setHeader: () => {},
    } as unknown as VercelResponse;

    await contactHandler(req, res);

    expect(statusCode).toBe(200);
    expect(responseBody.category).toBe('SUCCESS');
    // Ensure no database insertion occurred
    expect(mockInsert).not.toHaveBeenCalled();
  });

  test('POST /api/quote handles valid request pipeline', async () => {
    const req = {
      method: 'POST',
      headers: {
        origin: 'https://maasitaudhyog.com',
        'content-type': 'application/json',
        'x-real-ip': '127.0.0.1',
      },
      body: {
        name: 'Genuine Builder',
        phone: '+919999888877',
        email: 'builder@build.com',
        company: 'Apex Infra',
        projectLocation: 'Noida Sector 62',
        estimatedQty: '10000',
        qtyUnit: 'pieces',
        brickVariant: 'traditional-red-clay',
        submissionId: '550e8400-e29b-41d4-a716-446655440001',
        turnstileToken: 'valid_token',
        consentCaptured: true,
      },
    } as unknown as VercelRequest;

    let statusCode: number | null = null;
    let responseBody: any = null;

    const res = {
      status: (code: number) => {
        statusCode = code;
        return {
          json: (body: any) => {
            responseBody = body;
          },
        };
      },
      setHeader: () => {},
    } as unknown as VercelResponse;

    // Mock idempotency search as returning no matches
    mockSingle.mockResolvedValueOnce({ data: null, error: null });
    mockInsert.mockResolvedValueOnce({ error: null });

    await quoteHandler(req, res);

    expect(statusCode).toBe(200);
    expect(responseBody.category).toBe('SUCCESS');
    expect(mockInsert).toHaveBeenCalled();
  });
});
