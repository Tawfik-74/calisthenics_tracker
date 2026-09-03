import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { nowIso } from '@/shared/types/ids';
import { Card, Button, Tag } from '@/shared/ui';
import { formatNumber } from '@/shared/lib/formatters';
import { exerciseName, exerciseById, type PlannedExercise } from '@/features/plan';
import { useSessionStore } from '../model/sessionStore';
import { RepStepper } from './RepStepper';

export function SetLogger({
  planned,
  onLogged,
}: {
  planned: PlannedExercise;
  onLogged: (restSeconds: number) => void;
}) {
  const { t, i18n } = useTranslation(['workouts', 'plan']);
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en';
  const measure = exerciseById.get(planned.exerciseId)?.measure ?? 'reps';

  const logSet = useSessionStore((s) => s.logSet);
  const removeSet = useSessionStore((s) => s.removeSet);
  const sets = useSessionStore(
    (s) => s.session?.exercises.find((e) => e.exerciseId === planned.exerciseId)?.sets ?? [],
  );

  const [value, setValue] = useState<number>(
    measure === 'reps' ? (planned.targetReps ?? 8) : (planned.targetHoldSeconds ?? 20),
  );

  const done = sets.length;
  const complete = done >= planned.sets;

  function handleLog() {
    logSet({
      exerciseId: planned.exerciseId,
      setNumber: done + 1,
      measure,
      reps: measure === 'reps' ? value : null,
      holdSeconds: measure === 'hold' ? value : null,
      effort: null,
      completedAt: nowIso(),
    });
    onLogged(planned.restSeconds);
  }

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg font-bold">{exerciseName(t, planned.exerciseId)}</h3>
        <Tag tone={complete ? 'banked' : 'neutral'}>
          {formatNumber(done, locale)}/{formatNumber(planned.sets, locale)}
        </Tag>
      </div>

      <p className="text-xs text-[var(--color-steel)]">
        {t('target')}:{' '}
        {measure === 'reps'
          ? `${formatNumber(planned.targetReps ?? 0, locale)} ${t('unit.reps')}`
          : `${formatNumber(planned.targetHoldSeconds ?? 0, locale)} ${t('unit.sec')}`}
      </p>

      <RepStepper measure={measure} value={value} onChange={setValue} />

      <Button size="lg" block onClick={handleLog}>
        {t('action.log_set')}
      </Button>

      {done > 0 && (
        <ul className="flex flex-col gap-1 border-t border-[var(--color-line)] pt-2">
          {sets.map((s) => (
            <li key={s.id} className="flex items-center justify-between text-sm">
              <span className="text-[var(--color-steel)]">
                {t('set')} {formatNumber(s.setNumber, locale)}
              </span>
              <span className="font-numeric font-semibold tabular-nums">
                {s.reps != null
                  ? `${formatNumber(s.reps, locale)} ${t('unit.reps')}`
                  : `${formatNumber(s.holdSeconds ?? 0, locale)} ${t('unit.sec')}`}
              </span>
              <button
                type="button"
                onClick={() => removeSet(planned.exerciseId, s.id)}
                className="text-xs text-[var(--color-danger)]"
                aria-label={t('action.remove_set')}
              >
                {t('action.remove_set')}
              </button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
