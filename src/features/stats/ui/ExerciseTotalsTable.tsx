import { useTranslation } from 'react-i18next';
import { formatNumber, formatPercent } from '@/shared/lib/formatters';
import { cn } from '@/shared/lib/cn';
import { exerciseName } from '@/features/plan';
import type { ExerciseId } from '@/shared/types/ids';
import type { ExerciseMonthlyTotal } from '../model/stats.types';

export function ExerciseTotalsTable({ rows }: { rows: ExerciseMonthlyTotal[] }) {
  const { t, i18n } = useTranslation(['stats', 'plan']);
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en';

  if (rows.length === 0) {
    return <p className="text-sm text-[var(--color-steel)]">{t('stats:empty')}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[24rem] text-sm">
        <thead>
          <tr className="eyebrow text-start">
            <th className="py-2 pe-3 text-start">{t('stats:col.exercise')}</th>
            <th className="px-3 py-2 text-end">{t('stats:col.volume')}</th>
            <th className="px-3 py-2 text-end">{t('stats:col.sets')}</th>
            <th className="px-3 py-2 text-end">{t('stats:col.best')}</th>
            <th className="ps-3 py-2 text-end">{t('stats:col.change')}</th>
          </tr>
        </thead>
        <tbody className="font-numeric tabular-nums">
          {rows.map((r) => (
            <tr key={r.exerciseId} className="border-t border-[var(--color-line)]">
              <td className="py-2 pe-3 font-body font-medium">
                {exerciseName(t, r.exerciseId as ExerciseId)}
              </td>
              <td className="px-3 py-2 text-end">
                {r.measure === 'reps'
                  ? formatNumber(r.totalReps, locale)
                  : `${formatNumber(r.totalHoldSeconds, locale)}${t('plan:unit.sec')}`}
              </td>
              <td className="px-3 py-2 text-end">{formatNumber(r.totalSets, locale)}</td>
              <td className="px-3 py-2 text-end">
                {r.measure === 'reps' ? formatNumber(r.bestSetReps, locale) : '—'}
              </td>
              <td
                className={cn(
                  'ps-3 py-2 text-end',
                  r.changeVsPrevMonth != null && r.changeVsPrevMonth >= 0
                    ? 'text-[var(--color-banked)]'
                    : 'text-[var(--color-danger)]',
                )}
              >
                {r.changeVsPrevMonth == null ? '—' : formatPercent(r.changeVsPrevMonth, locale)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
