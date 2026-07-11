import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getEnv } from './env.js';

let cachedClient: SupabaseClient | null = null;

/**
 * Lazy-loaded Supabase administrative client singleton.
 * Uses the service_role key to bypass Row Level Security where authorized.
 * Initializes only when called, preventing load-time crashes when env is settling.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const env = getEnv();
  
  // Strict check: fails closed if client parameters are not resolved
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('[SupabaseAdmin] Incomplete credentials. Unable to initialize lazy client.');
  }

  cachedClient = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}
