import { useTranslation } from 'react-i18next';
import { Card, Tag } from '@/shared/ui';
import { formatNumber } from '@/shared/lib/formatters';
import type { PlanDay } from '../model/plan.types';
import { exerciseName } from '../lib/exerciseName';
import { moveById } from '../lib/moves';

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
          {day.exercises.map((ex) => {
            const move = moveById.get(ex.exerciseId);
            return (
              <li key={ex.exerciseId} className="flex items-start justify-between gap-3 text-sm">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-medium">{exerciseName(t, ex.exerciseId)}</span>
                  {move?.equipment.map((item) => (
                    <Tag key={item} tone="neutral">{t(`plan:equipment.${item}`)}</Tag>
                  ))}
                  {ex.tempo && <Tag tone="neutral">{ex.tempo}</Tag>}
                  {ex.noteKey === 'plan:cue.progressed' && <Tag tone="banked">{t('plan:progression.up')}</Tag>}
                </div>
                <span className="font-numeric shrink-0 text-[var(--color-steel)] tabular-nums">
                  {formatNumber(ex.sets, locale)}×
                  {ex.targetReps != null
                    ? formatNumber(ex.targetReps, locale)
                    : `${formatNumber(ex.targetHoldSeconds ?? 0, locale)}${t('plan:unit.sec')}`}
                </span>
              </li>
            );
          })}
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
