import { useTranslation } from 'react-i18next';
import { Card, Tag } from '@/shared/ui';
import { formatNumber } from '@/shared/lib/formatters';
import type { PlanDay } from '../model/plan.types';
import { exerciseName } from '../lib/exerciseName';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function PlanDayCard({ day, onStart }: { day: PlanDay; onStart?: (day: PlanDay) => void }) {
  const { t, i18n } = useTranslation(['plan', 'common']);
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en';
  const isRest = day.split === 'rest';

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="eyebrow">{DAY_LABELS[day.dayIndex]}</span>
        <Tag tone={isRest ? 'neutral' : 'effort'}>{t(`plan:split.${day.split}`)}</Tag>
      </div>

      {isRest ? (
        <p className="text-sm text-[var(--color-steel)]">{t('plan:rest_day')}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {day.exercises.map((ex) => (
            <li key={ex.exerciseId} className="flex items-baseline justify-between gap-3 text-sm">
              <span className="font-medium">{exerciseName(t, ex.exerciseId)}</span>
              <span className="font-numeric text-[var(--color-steel)] tabular-nums">
                {formatNumber(ex.sets, locale)}×
                {ex.targetReps != null
                  ? formatNumber(ex.targetReps, locale)
                  : `${formatNumber(ex.targetHoldSeconds ?? 0, locale)}${t('plan:unit.sec')}`}
              </span>
            </li>
          ))}
        </ul>
      )}

      {!isRest && onStart && (
        <button
          type="button"
          onClick={() => onStart(day)}
          className="mt-1 min-h-[48px] rounded-[12px] bg-[var(--color-effort)] text-sm font-bold text-[var(--color-on-effort)]"
        >
          {t('plan:action.start_day')}
        </button>
      )}
    </Card>
  );
}
