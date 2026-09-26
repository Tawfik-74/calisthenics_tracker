import type { WorkoutPlan } from '../model/plan.types';

interface PerformanceSet {
  reps: number | null;
  holdSeconds: number | null;
  effort: number | null;
}

interface PerformanceSession {
  finishedAt: string;
  exercises: { exerciseId: string; sets: PerformanceSet[] }[];
}

/** Raises a target only after the two most recent attempts both meet it. */
export function applyProgressiveOverload(
  plan: WorkoutPlan,
  sessions: PerformanceSession[],
): WorkoutPlan {
  const ordered = [...sessions].sort((a, b) => Date.parse(b.finishedAt) - Date.parse(a.finishedAt));
  return {
    ...plan,
    days: plan.days.map((day) => ({
      ...day,
      exercises: day.exercises.map((planned) => {
        const attempts = ordered
          .map((session) => session.exercises.find((exercise) => exercise.exerciseId === planned.exerciseId))
          .filter((exercise): exercise is NonNullable<typeof exercise> => Boolean(exercise))
          .slice(0, 2);
        if (attempts.length < 2 || attempts.some((attempt) => attempt.sets.length < planned.sets)) return planned;

        const successful = attempts.every((attempt) => attempt.sets.every((set) =>
          (set.effort == null || set.effort <= 8) &&
          (planned.targetReps == null || (set.reps ?? 0) >= planned.targetReps) &&
          (planned.targetHoldSeconds == null || (set.holdSeconds ?? 0) >= planned.targetHoldSeconds),
        ));
        if (!successful) return planned;

        if (planned.targetReps != null) {
          const performed = Math.min(...attempts.flatMap((attempt) => attempt.sets.map((set) => set.reps ?? 0)));
          return { ...planned, targetReps: Math.min(100, Math.max(planned.targetReps, performed) + 1), noteKey: 'plan:cue.progressed' };
        }
        if (planned.targetHoldSeconds != null) {
          const performed = Math.min(...attempts.flatMap((attempt) => attempt.sets.map((set) => set.holdSeconds ?? 0)));
          return { ...planned, targetHoldSeconds: Math.min(300, Math.max(planned.targetHoldSeconds, performed) + 5), noteKey: 'plan:cue.progressed' };
        }
        return planned;
      }),
    })),
  };
}
