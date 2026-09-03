import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import type { MonthKey, UserId } from '@/shared/types/ids';
import { queryKeys } from '@/shared/config/queryKeys';
import { useAuthStore } from '@/features/auth';
import { useMonthlyStats } from '@/features/stats';
import { memberApi } from '../api/memberApi';
import { deriveMonthSummary } from './deriveMonthSummary';
import type { SquadMemberProfile } from '../model/memberProfile.types';
import { useSquad } from './useSquad';

/** A teammate's data changes a few times a day at most. Serving it stale is correct. */
const MEMBER_STALE_TIME = 5 * 60_000;

export function useMemberProfile(userId: UserId | null, month: MonthKey) {
  const me = useAuthStore((s) => s.session?.user ?? null);
  const { data: squad } = useSquad();

  // Already in memory from the roster — lets the card paint its header
  // immediately and skeleton only the numbers.
  const known = squad?.members.find((m) => m.userId === userId);

  const profileQuery = useQuery({
    queryKey: queryKeys.squad.member(userId ?? 'none', month),
    enabled: Boolean(userId),
    staleTime: MEMBER_STALE_TIME,
    queryFn: async () => {
      const [header, recentSessions] = await Promise.all([
        memberApi.header(userId!),
        memberApi.monthSessions(userId!, month),
      ]);
      return { header, recentSessions };
    },
  });

  // Reuses the stats feature rather than cloning its aggregation.
  const statsQuery = useMonthlyStats(month, userId ?? undefined);

  const header = profileQuery.data?.header;
  const profile: SquadMemberProfile | undefined =
    header && profileQuery.data
      ? {
          header: known
            ? { ...header, displayName: known.displayName, role: known.role }
            : header,
          month,
          summary: deriveMonthSummary(profileQuery.data.recentSessions, header.timeZone),
          byExercise: statsQuery.data?.byExercise ?? [],
          recentSessions: profileQuery.data.recentSessions,
          isSelf: header.userId === me?.id,
        }
      : undefined;

  return {
    profile,
    /** Header can render before the numbers land. */
    isPending: profileQuery.isPending,
    isStatsPending: statsQuery.isPending,
    error: profileQuery.error ?? statsQuery.error ?? null,
  };
}

/**
 * A squad is <= 4 people, so warming a profile on press-in is nearly free and
 * makes the transition feel instant.
 */
export function usePrefetchMember(month: MonthKey) {
  const qc = useQueryClient();
  return useCallback(
    (userId: UserId) => {
      void qc.prefetchQuery({
        queryKey: queryKeys.squad.member(userId, month),
        staleTime: MEMBER_STALE_TIME,
        queryFn: async () => {
          const [header, recentSessions] = await Promise.all([
            memberApi.header(userId),
            memberApi.monthSessions(userId, month),
          ]);
          return { header, recentSessions };
        },
      });
    },
    [qc, month],
  );
}
