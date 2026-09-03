import { supabase } from '@/shared/lib/supabase';
import { asId, type IsoDateTime } from '@/shared/types/ids';
import type { AuthSession, User } from '../model/auth.types';
import type { LoginInput } from '../model/auth.schema';
import { mapSupabaseUser } from '../lib/mapSupabaseUser';

const MOCK_USER: User = {
  id: asId('00000000-0000-4000-8000-000000000001'),
  email: 'demo@calisthenics.app',
  displayName: 'Omer',
  avatarUrl: null,
  level: 'intermediate',
  daysPerWeek: 4,
  locale: 'en',
  timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Istanbul',
  scheduledWorkoutTime: '18:30',
  squadId: asId('00000000-0000-4000-8000-0000000000aa'),
  createdAt: '2026-01-04T09:00:00.000Z' as IsoDateTime,
};

const mockSession = (): AuthSession => ({
  user: MOCK_USER,
  accessToken: 'mock-token',
  expiresAt: new Date(Date.now() + 3600_000).toISOString() as IsoDateTime,
});

export const authApi = {
  async getSession(): Promise<AuthSession | null> {
    if (!supabase) {
      return localStorage.getItem('ct.mock-auth') ? mockSession() : null;
    }
    const { data } = await supabase.auth.getSession();
    if (!data.session) return null;
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.session.user.id)
      .maybeSingle();
    return {
      user: mapSupabaseUser(data.session.user, profile),
      accessToken: data.session.access_token,
      expiresAt: new Date((data.session.expires_at ?? 0) * 1000).toISOString() as IsoDateTime,
    };
  },

  async signIn(input: LoginInput): Promise<AuthSession> {
    if (!supabase) {
      localStorage.setItem('ct.mock-auth', '1');
      return mockSession();
    }
    const { data, error } = await supabase.auth.signInWithPassword({
      email: input.email,
      password: input.password,
    });
    if (error || !data.session) throw new Error('auth.error.sign_in_failed');
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.session.user.id)
      .maybeSingle();
    return {
      user: mapSupabaseUser(data.session.user, profile),
      accessToken: data.session.access_token,
      expiresAt: new Date((data.session.expires_at ?? 0) * 1000).toISOString() as IsoDateTime,
    };
  },

  async signOut(): Promise<void> {
    localStorage.removeItem('ct.mock-auth');
    if (supabase) await supabase.auth.signOut();
  },
};
