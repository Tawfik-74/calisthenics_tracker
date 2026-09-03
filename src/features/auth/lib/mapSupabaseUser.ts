import type { User as SupabaseUser } from '@supabase/supabase-js';
import { asId, type IsoDateTime } from '@/shared/types/ids';
import type { FitnessLevel, Locale, User } from '../model/auth.types';

/** Supabase auth user + our `profiles` row -> domain User. */
export function mapSupabaseUser(
  authUser: SupabaseUser,
  profile: Record<string, unknown> | null,
): User {
  const p = profile ?? {};
  return {
    id: asId(authUser.id),
    email: authUser.email ?? '',
    displayName: (p.display_name as string) ?? authUser.email?.split('@')[0] ?? 'Athlete',
    avatarUrl: (p.avatar_url as string) ?? null,
    level: (p.level as FitnessLevel) ?? 'beginner',
    daysPerWeek: (p.days_per_week as 3 | 4 | 5 | 6) ?? 3,
    locale: (p.locale as Locale) ?? 'en',
    timeZone: (p.time_zone as string) ?? Intl.DateTimeFormat().resolvedOptions().timeZone,
    scheduledWorkoutTime: (p.scheduled_workout_time as string) ?? '18:30',
    squadId: p.squad_id ? asId(p.squad_id as string) : null,
    createdAt: (authUser.created_at ?? new Date().toISOString()) as IsoDateTime,
  };
}
