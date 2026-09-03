import { asId, nowIso, type UserId } from '@/shared/types/ids';
import type { FitnessLevel } from '@/features/auth';
import type { PlanDay, PlannedExercise, Split, WorkoutPlan } from '../model/plan.types';
import { PROGRESSION } from './progressionTable';
import { SPLIT_TEMPLATES } from './splitTemplates';
import { exerciseBySlug } from './exerciseCatalog';

export interface GeneratePlanArgs {
  userId: UserId;
  level: FitnessLevel;
  daysPerWeek: 3 | 4 | 5 | 6;
  /** Injectable for deterministic tests. */
  now?: () => string;
  planId?: string;
}

/** Pure: (level, daysPerWeek) => WorkoutPlan. No IO, no Date.now unless injected. */
export function generatePlan({
  userId,
  level,
  daysPerWeek,
  now = nowIso,
  planId = crypto.randomUUID(),
}: GeneratePlanArgs): WorkoutPlan {
  const template = SPLIT_TEMPLATES[daysPerWeek];

  const days: PlanDay[] = template.map((split, i) => ({
    dayIndex: i as PlanDay['dayIndex'],
    split,
    exercises: split === 'rest' ? [] : buildExercises(level, split),
  }));

  return {
    id: asId(planId),
    userId,
    level,
    daysPerWeek,
    generatedAt: now() as WorkoutPlan['generatedAt'],
    archivedAt: null,
    days,
  };
}

function buildExercises(level: FitnessLevel, split: Exclude<Split, 'rest'>): PlannedExercise[] {
  return PROGRESSION[level][split].map((entry) => {
    const exercise = exerciseBySlug.get(entry.slug);
    if (!exercise) throw new Error(`Unknown exercise slug: ${entry.slug}`);
    return {
      exerciseId: exercise.id,
      sets: entry.sets,
      targetReps: entry.reps,
      targetHoldSeconds: entry.holdSeconds,
      restSeconds: entry.restSeconds,
    };
  });
}
