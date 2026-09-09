import type { PlanDay } from '@/features/plan';
import { moveById } from '@/features/plan';
import type { PlayerStep, SetMeasure } from '../model/player.types';

/** Renumbers `setNumber`, `totalSets` and `isLast` after any structural change. */
export function normalizeSteps(steps: PlayerStep[]): PlayerStep[] {
  const perExercise = new Map<number, number>();
  for (const s of steps) perExercise.set(s.exerciseIndex, (perExercise.get(s.exerciseIndex) ?? 0) + 1);

  const seen = new Map<number, number>();
  return steps.map((s, i) => {
    const n = (seen.get(s.exerciseIndex) ?? 0) + 1;
    seen.set(s.exerciseIndex, n);
    return {
      ...s,
      setNumber: n,
      totalSets: perExercise.get(s.exerciseIndex) ?? n,
      isLast: i === steps.length - 1,
    };
  });
}

/**
 * Flattens a plan day into an ordered list of sets. Each planned exercise
 * contributes `sets` steps; measure/name/cues come from the movement catalog.
 */
export function buildSteps(day: Pick<PlanDay, 'exercises'>): PlayerStep[] {
  const steps: PlayerStep[] = [];

  day.exercises.forEach((planned, exerciseIndex) => {
    const move = moveById.get(planned.exerciseId);
    const measure: SetMeasure = move?.measure ?? (planned.targetHoldSeconds != null ? 'hold' : 'reps');
    const slug = move?.slug ?? 'unknown';

    for (let i = 0; i < Math.max(1, planned.sets); i += 1) {
      steps.push({
        exerciseId: planned.exerciseId,
        slug,
        nameKey: move?.nameKey ?? `plan:exercise.${slug}`,
        cueKeys: [
          ...(move?.cueKeys ?? [
            `plan:cue.${slug}.0`,
            `plan:cue.${slug}.1`,
            `plan:cue.${slug}.2`,
          ]),
        ],
        measure,
        targetReps: measure === 'reps' ? (planned.targetReps ?? move?.defaultReps ?? 8) : null,
        targetHoldSeconds:
          measure === 'hold' ? (planned.targetHoldSeconds ?? move?.defaultHoldSeconds ?? 20) : null,
        restSeconds: planned.restSeconds,
        exerciseIndex,
        setNumber: i + 1,
        totalSets: Math.max(1, planned.sets),
        isLast: false,
      });
    }
  });

  return normalizeSteps(steps);
}
