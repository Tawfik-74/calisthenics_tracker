/**
 * Central env access. The app is designed to run with mock data when Supabase
 * credentials are absent, so nothing here throws — `isBackendConfigured` gates
 * the real client.
 */
const url = import.meta.env.VITE_SUPABASE_URL ?? '';
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';

export const env = {
  supabaseUrl: url,
  supabaseAnonKey: anonKey,
  vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY ?? '',
  isBackendConfigured: Boolean(url && anonKey),
} as const;
