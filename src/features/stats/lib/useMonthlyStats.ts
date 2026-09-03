import { useQuery } from '@tanstack/react-query';
import type { MonthKey, UserId } from '@/shared/types/ids';
import { queryKeys } from '@/shared/config/queryKeys';
import { useAuthStore } from '@/features/auth';
import { statsApi } from '../api/statsApi';

/**
 * Monthly totals for `userId`, defaulting to the signed-in user.
 *
 * Passing a userId is what lets the squad-member profile reuse this instead of
 * cloning it. The server still decides what you may see — the RPC raises
 * NOT_SQUADMATE for anyone outside your squad.
 */
export function useMonthlyStats(month: MonthKey, userId?: UserId) {
  const me = useAuthStore((s) => s.session?.user ?? null);
  const targetId = userId ?? me?.id;
  const isSelf = !userId || userId === me?.id;
  // Aggregates are bucketed server-side in the target's own zone; the fallback
  // only matters for the offline mock path.
  const timeZone = isSelf ? me?.timeZone : undefined;

  return useQuery({
    queryKey: queryKeys.stats.month(targetId ?? 'anon', month),
    enabled: Boolean(targetId),
    queryFn: () => statsApi.month(targetId!, month, timeZone, isSelf),
  });
}
