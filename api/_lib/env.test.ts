import { describe, test, expect, afterEach } from 'vitest';
import { getEnv, isProduction, _resetEnvCache } from './env.js';

describe('Server Environment Configuration Validator', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    // Restore original env variables after each test
    process.env = { ...originalEnv };
    _resetEnvCache();
  });

  test('isProduction reflects NODE_ENV value', () => {
    process.env.NODE_ENV = 'production';
    expect(isProduction()).toBe(true);

    process.env.NODE_ENV = 'development';
    expect(isProduction()).toBe(false);
  });

  test('fails closed in production if mandatory secrets are missing', () => {
    process.env.NODE_ENV = 'production';
    process.env.SUPABASE_URL = 'http://test.supabase.co';
    // Deliberately omit SUPABASE_SERVICE_ROLE_KEY and IP_HASH_SECRET
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    delete process.env.IP_HASH_SECRET;
    delete process.env.TURNSTILE_SECRET_KEY;

    expect(() => getEnv()).toThrow(/SUPABASE_SERVICE_ROLE_KEY/);
  });

  test('fails closed in production if secret lengths are below limits', () => {
    process.env.NODE_ENV = 'production';
    process.env.SUPABASE_URL = 'http://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid_role_key';
    process.env.TURNSTILE_SECRET_KEY = 'valid_turnstile';
    process.env.IP_HASH_SECRET = 'short'; // < 32 characters

    expect(() => getEnv()).toThrow(/cryptographic safety/);
  });

  test('prohibits turnstile development bypass in production mode', () => {
    process.env.NODE_ENV = 'production';
    process.env.SUPABASE_URL = 'http://test.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'valid_role_key_long_string';
    process.env.IP_HASH_SECRET = 'a_very_long_cryptographic_secret_key_32_chars';
    process.env.TURNSTILE_SECRET_KEY = 'valid_turnstile';
    process.env.BOT_PROTECTION_MODE = 'development_bypass'; // prohibited in prod

    expect(() => getEnv()).toThrow(/BOT_PROTECTION_MODE/);
  });
});
