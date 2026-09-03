import { Skeleton } from '@/shared/ui';
import type { PlanDay } from '../model/plan.types';
import { usePlan } from '../lib/usePlan';
import { PlanDayCard } from './PlanDayCard';

export function PlanWeekView({ onStartDay }: { onStartDay?: (day: PlanDay) => void }) {
  const { data: plan, isPending } = usePlan();

  if (isPending || !plan) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-40" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {plan.days.map((day) => (
        <PlanDayCard key={day.dayIndex} day={day} onStart={onStartDay} />
      ))}
    </div>
  );
}
