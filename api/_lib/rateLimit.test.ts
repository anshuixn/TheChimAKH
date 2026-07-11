import { describe, test, expect, beforeAll } from 'vitest';
import { derivePseudonymousIdentity } from './rateLimit';

describe('Pseudonymous Identity Derivation', () => {
  beforeAll(() => {
    // Setup env vars for tests
    process.env.IP_HASH_SECRET = 'test_secret_key_must_be_32_characters_long_or_more';
    process.env.SUPABASE_URL = 'http://localhost:54321';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'dev_key';
  });

  test('derives stable pseudonymous identity using HMAC-SHA256', () => {
    const ip = '192.168.1.100';
    const id1 = derivePseudonymousIdentity(ip);
    const id2 = derivePseudonymousIdentity(ip);
    
    // Identity must be stable/deterministic
    expect(id1).toBe(id2);
    expect(id1).toMatch(/^[0-9a-f]{64}$/); // 64 hex characters (SHA-256)
  });

  test('different IPs yield different identities', () => {
    const id1 = derivePseudonymousIdentity('192.168.1.1');
    const id2 = derivePseudonymousIdentity('192.168.1.2');
    expect(id1).not.toBe(id2);
  });
});
