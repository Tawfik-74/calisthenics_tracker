import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { MonthKey } from '@/shared/types/ids';
import { Card, Skeleton } from '@/shared/ui';
import { formatNumber } from '@/shared/lib/formatters';
import { secondsToClock } from '@/shared/lib/dates';
import { currentMonthKey } from '@/shared/lib/dates';
import { useMonthlyStats } from '../lib/useMonthlyStats';
import { MonthPicker } from './MonthPicker';
import { ExerciseTotalsTable } from './ExerciseTotalsTable';

export function MonthlyDashboard() {
  const { t, i18n } = useTranslation('stats');
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en';
  const [month, setMonth] = useState<MonthKey>(currentMonthKey());
  const { data, isPending } = useMonthlyStats(month);

  return (
    <div className="flex flex-col gap-4">
      <MonthPicker month={month} onChange={setMonth} />

      {isPending || !data ? (
        <Skeleton className="h-24" />
      ) : (
        <div className="grid grid-cols-3 gap-3">
          <Kpi label={t('kpi.sessions')} value={formatNumber(data.totalSessions, locale)} />
          <Kpi label={t('kpi.active_days')} value={formatNumber(data.activeDays, locale)} />
          <Kpi
            label={t('kpi.volume')}
            value={
              data.totalHoldSeconds > data.totalReps
                ? secondsToClock(data.totalHoldSeconds)
                : formatNumber(data.totalReps, locale)
            }
          />
        </div>
      )}

      <Card>
        <h2 className="mb-3 font-display text-lg font-bold">{t('by_exercise')}</h2>
        {isPending || !data ? (
          <Skeleton className="h-40" />
        ) : (
          <ExerciseTotalsTable rows={data.byExercise} />
        )}
      </Card>
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="font-numeric text-xl font-semibold tabular-nums text-[var(--color-banked)]">
        {value}
      </span>
      <span className="eyebrow">{label}</span>
    </Card>
  );
}
