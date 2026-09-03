import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/config/queryKeys';
import { useAuthStore } from '@/features/auth';
import { planApi } from '../api/planApi';

export function usePlan() {
  const user = useAuthStore((s) => s.session?.user ?? null);
  return useQuery({
    queryKey: queryKeys.plan.current(user?.id ?? 'anon'),
    enabled: Boolean(user),
    queryFn: () => planApi.getCurrent(user!.id, user!.level, user!.daysPerWeek),
  });
}
