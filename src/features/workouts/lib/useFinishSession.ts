import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/config/queryKeys';
import { useAuthStore } from '@/features/auth';
import { sessionApi } from '../api/sessionApi';
import type { FinishSessionInput } from '../model/session.schema';

export function useFinishSession() {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id ?? null);

  return useMutation({
    mutationFn: (input: FinishSessionInput) => sessionApi.finish(input),
    onSuccess: () => {
      // Prefix invalidation: every month for this user. A finished session
      // moves the current month AND the next month's "vs last month" ratio,
      // so invalidating a single month key would leave stale comparisons.
      if (userId) qc.invalidateQueries({ queryKey: queryKeys.stats.all(userId) });
      qc.invalidateQueries({ queryKey: queryKeys.sessions.list() });
    },
  });
}
