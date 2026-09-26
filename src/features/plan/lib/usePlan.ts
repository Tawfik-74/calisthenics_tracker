import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/config/queryKeys';
import { useAuthStore } from '@/features/auth';
import { planApi } from '../api/planApi';
import { sessionApi } from '@/features/workouts';
import { applyProgressiveOverload } from './progressiveOverload';

export function usePlan() {
  const user = useAuthStore((s) => s.session?.user ?? null);
  return useQuery({
    queryKey: queryKeys.plan.current(user?.id ?? 'anon'),
    enabled: Boolean(user),
    queryFn: async () => {
      const [plan, sessions] = await Promise.all([
        planApi.getCurrent(user!.id, user!.level, user!.daysPerWeek),
        sessionApi.list(),
      ]);
      return applyProgressiveOverload(plan, sessions);
    },
  });
}
