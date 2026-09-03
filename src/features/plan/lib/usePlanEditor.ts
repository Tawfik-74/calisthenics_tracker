import { useCallback, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { produce } from 'immer';
import { queryKeys } from '@/shared/config/queryKeys';
import { useAuthStore } from '@/features/auth';
import type { ExerciseId } from '@/shared/types/ids';
import type { PlannedExercise, WorkoutPlan } from '../model/plan.types';
import type { Move } from './moves';
import { planApi } from '../api/planApi';

export interface UsePlanEditor {
  draft: WorkoutPlan;
  isDirty: boolean;
  swapExercise: (dayIndex: number, exerciseId: ExerciseId, next: Move) => void;
  removeExercise: (dayIndex: number, exerciseId: ExerciseId) => void;
  addExercise: (dayIndex: number, move: Move) => void;
  setSets: (dayIndex: number, exerciseId: ExerciseId, sets: number) => void;
  reset: () => void;
  save: () => Promise<void>;
}

function toPlanned(move: Move, sets?: number): PlannedExercise {
  return {
    exerciseId: move.id,
    sets: sets ?? move.defaultSets,
    targetReps: move.measure === 'reps' ? move.defaultReps : null,
    targetHoldSeconds: move.measure === 'hold' ? move.defaultHoldSeconds : null,
    restSeconds: move.restSeconds,
  };
}

/** Local editing state for the plan editor. Persists via `planApi.savePlan`. */
export function usePlanEditor(plan: WorkoutPlan): UsePlanEditor {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id ?? null);
  const [draft, setDraft] = useState<WorkoutPlan>(plan);

  const isDirty = useMemo(
    () => JSON.stringify(draft.days) !== JSON.stringify(plan.days),
    [draft, plan],
  );

  const mutateDay = useCallback(
    (dayIndex: number, fn: (exercises: PlannedExercise[]) => PlannedExercise[]) =>
      setDraft((d) =>
        produce(d, (dr) => {
          const day = dr.days.find((x) => x.dayIndex === dayIndex);
          if (day) day.exercises = fn(day.exercises);
        }),
      ),
    [],
  );

  const swapExercise = useCallback(
    (dayIndex: number, exerciseId: ExerciseId, next: Move) =>
      mutateDay(dayIndex, (list) =>
        list.map((ex) => (ex.exerciseId === exerciseId ? toPlanned(next, ex.sets) : ex)),
      ),
    [mutateDay],
  );

  const removeExercise = useCallback(
    (dayIndex: number, exerciseId: ExerciseId) =>
      mutateDay(dayIndex, (list) => list.filter((ex) => ex.exerciseId !== exerciseId)),
    [mutateDay],
  );

  const addExercise = useCallback(
    (dayIndex: number, move: Move) =>
      mutateDay(dayIndex, (list) =>
        list.some((ex) => ex.exerciseId === move.id) ? list : [...list, toPlanned(move)],
      ),
    [mutateDay],
  );

  const setSets = useCallback(
    (dayIndex: number, exerciseId: ExerciseId, sets: number) =>
      mutateDay(dayIndex, (list) =>
        list.map((ex) => (ex.exerciseId === exerciseId ? { ...ex, sets } : ex)),
      ),
    [mutateDay],
  );

  const reset = useCallback(() => setDraft(plan), [plan]);

  const save = useCallback(async () => {
    if (!userId) return;
    const saved = await planApi.savePlan(userId, draft);
    qc.setQueryData(queryKeys.plan.current(userId), saved);
  }, [draft, qc, userId]);

  return { draft, isDirty, swapExercise, removeExercise, addExercise, setSets, reset, save };
}
