import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/shared/config/env';

/**
 * `null` when the backend isn't configured. Every api/ module must handle that
 * case with a mock path so the app is fully usable in a workshop without a
 * Supabase project.
 */
export const supabase: SupabaseClient | null = env.isBackendConfigured
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  : null;

export function requireSupabase(): SupabaseClient {
  if (!supabase) {
    throw new Error('Supabase is not configured (set VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).');
  }
  return supabase;
}
