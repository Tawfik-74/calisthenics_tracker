import { supabase } from '@/shared/lib/supabase';
import { asId, type MonthKey, type UserId } from '@/shared/types/ids';
import {
  memberProfileRowSchema,
  memberSessionsResponseSchema,
} from '../model/memberProfile.schema';
import type { MemberProfileHeader, MemberRecentSession } from '../model/memberProfile.types';
import { squadApi } from './squadApi';

const MOCK_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

/** Deterministic demo data so the profile is explorable without a backend. */
function mockSessions(userId: UserId, month: MonthKey): MemberRecentSession[] {
  const seed = userId.charCodeAt(userId.length - 1);
  const splits = ['push', 'pull', 'legs', 'core'] as const;
  return Array.from({ length: 3 + (seed % 3) }, (_, i) => {
    const day = String(2 + i * 4).padStart(2, '0');
    return {
      sessionId: asId(`${month}-${userId.slice(-4)}-${i}`),
      split: splits[(seed + i) % 4],
      finishedAt: `${month}-${day}T18:30:00.000Z` as MemberRecentSession['finishedAt'],
      totalReps: 24 + ((seed + i * 7) % 30),
      totalHoldSeconds: 0,
      totalSets: 3 + (i % 2),
    };
  });
}

export const memberApi = {
  async header(userId: UserId): Promise<MemberProfileHeader> {
    if (!supabase) {
      const squad = await squadApi.mine();
      const m = squad?.members.find((x) => x.userId === userId);
      const seed = userId.charCodeAt(userId.length - 1);
      return {
        userId,
        displayName: m?.displayName ?? 'Athlete',
        avatarUrl: m?.avatarUrl ?? null,
        role: m?.role ?? 'member',
        level: MOCK_LEVELS[seed % 3],
        timeZone: 'Europe/Istanbul',
        joinedAt: m?.joinedAt ?? ('2026-02-01T08:00:00.000Z' as MemberProfileHeader['joinedAt']),
      };
    }

    // Readable thanks to the profiles_squadmates policy.
    const { data, error } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url, level, time_zone, created_at')
      .eq('id', userId)
      .single();
    if (error) throw new Error('social:error.member_unavailable');

    const row = memberProfileRowSchema.parse(data);
    return {
      userId: asId(row.id),
      displayName: row.display_name,
      avatarUrl: row.avatar_url,
      role: 'member',
      level: row.level,
      timeZone: row.time_zone,
      joinedAt: row.created_at as MemberProfileHeader['joinedAt'],
    };
  },

  async monthSessions(userId: UserId, month: MonthKey): Promise<MemberRecentSession[]> {
    if (!supabase) return mockSessions(userId, month);

    const { data, error } = await supabase.rpc('member_month_sessions', {
      p_user: userId,
      p_month: month,
    });
    // 42501 -> the caller is not a squadmate. Surfaced as a locked state, not a crash.
    if (error) throw new Error('social:error.member_forbidden');

    return memberSessionsResponseSchema.parse(data).map((r) => ({
      sessionId: asId(r.session_id),
      split: r.split,
      finishedAt: r.finished_at as MemberRecentSession['finishedAt'],
      totalReps: r.total_reps,
      totalHoldSeconds: r.total_hold_seconds,
      totalSets: r.total_sets,
    }));
  },
};
