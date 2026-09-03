import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, NumberStepper, Tag, toast } from '@/shared/ui';
import { formatNumber } from '@/shared/lib/formatters';
import type { ExerciseId } from '@/shared/types/ids';
import type { WorkoutPlan } from '../model/plan.types';
import { moveById, type Move, type MuscleGroup } from '../lib/moves';
import { exerciseName } from '../lib/exerciseName';
import { usePlanEditor } from '../lib/usePlanEditor';
import { ExerciseLibrarySheet } from './ExerciseLibrarySheet';

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type SheetTarget =
  | { mode: 'swap'; dayIndex: number; exerciseId: ExerciseId; group: MuscleGroup }
  | { mode: 'add'; dayIndex: number }
  | null;

export function PlanEditor({ plan, onDone }: { plan: WorkoutPlan; onDone: () => void }) {
  const { t, i18n } = useTranslation(['plan', 'common']);
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en';
  const editor = usePlanEditor(plan);
  const [target, setTarget] = useState<SheetTarget>(null);

  const onPick = (move: Move) => {
    if (!target) return;
    if (target.mode === 'swap') editor.swapExercise(target.dayIndex, target.exerciseId, move);
    else editor.addExercise(target.dayIndex, move);
    setTarget(null);
  };

  return (
    <div className="flex flex-col gap-3">
      {editor.draft.days.map((day) => {
        const isRest = day.split === 'rest';
        return (
          <Card key={day.dayIndex} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="eyebrow">{DAY_LABELS[day.dayIndex]}</span>
              <Tag tone={isRest ? 'neutral' : 'effort'}>{t(`plan:split.${day.split}`)}</Tag>
            </div>

            {isRest ? (
              <p className="text-sm text-[var(--color-steel)]">{t('plan:rest_day')}</p>
            ) : (
              <>
                <ul className="flex flex-col gap-3">
                  {day.exercises.map((ex) => {
                    const move = moveById.get(ex.exerciseId);
                    return (
                      <li
                        key={ex.exerciseId}
                        className="flex flex-col gap-2 border-s-2 border-[var(--color-line)] ps-3"
                      >
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-medium">{exerciseName(t, ex.exerciseId)}</span>
                          <span className="font-numeric text-sm text-[var(--color-steel)]">
                            {ex.targetReps != null
                              ? `${formatNumber(ex.targetReps, locale)} ${t('plan:editor.reps')}`
                              : `${formatNumber(ex.targetHoldSeconds ?? 0, locale)}${t('plan:unit.sec')}`}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="w-36">
                            <NumberStepper
                              label={t('plan:editor.sets')}
                              value={ex.sets}
                              min={1}
                              max={10}
                              onChange={(n) => editor.setSets(day.dayIndex, ex.exerciseId, n)}
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              move &&
                              setTarget({
                                mode: 'swap',
                                dayIndex: day.dayIndex,
                                exerciseId: ex.exerciseId,
                                group: move.muscleGroup,
                              })
                            }
                            className="min-h-[36px] rounded-full border border-[var(--color-line)] px-3 text-xs font-semibold text-[var(--color-steel)]"
                          >
                            {t('plan:editor.swap')}
                          </button>
                          <button
                            type="button"
                            onClick={() => editor.removeExercise(day.dayIndex, ex.exerciseId)}
                            className="min-h-[36px] rounded-full px-3 text-xs font-semibold text-[var(--color-danger)]"
                          >
                            {t('plan:editor.remove')}
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <button
                  type="button"
                  onClick={() => setTarget({ mode: 'add', dayIndex: day.dayIndex })}
                  className="min-h-[40px] rounded-[10px] border border-dashed border-[var(--color-line)] text-sm font-semibold text-[var(--color-steel)]"
                >
                  {t('plan:editor.add')}
                </button>
              </>
            )}
          </Card>
        );
      })}

      <div className="flex gap-2 pt-1">
        <Button
          block
          disabled={!editor.isDirty}
          onClick={async () => {
            await editor.save();
            toast({ message: t('plan:toast.plan_saved'), tone: 'banked' });
            onDone();
          }}
        >
          {t('plan:editor.save')}
        </Button>
        <Button
          variant="quiet"
          onClick={() => {
            editor.reset();
            onDone();
          }}
        >
          {t('plan:editor.discard')}
        </Button>
      </div>

      <ExerciseLibrarySheet
        open={target !== null}
        onClose={() => setTarget(null)}
        onPick={onPick}
        lockGroup={target?.mode === 'swap' ? target.group : undefined}
      />
    </div>
  );
}
