import type { ExerciseId, IsoDateTime, PlanId, UserId } from '@/shared/types/ids';
import type { FitnessLevel } from '@/features/auth';

export type Split = 'push' | 'pull' | 'legs' | 'core' | 'rest';

/** Catalog entry. Seeded, not user-created. */
export interface Exercise {
  id: ExerciseId;
  /** Stable key for i18n AND stats grouping: "pull_up", "pike_push_up" */
  slug: string;
  pattern: Exclude<Split, 'rest'>;
  /** Reps vs. a static hold — changes how you log AND how you total. */
  measure: 'reps' | 'hold';
  minLevel: FitnessLevel;
  regressionOf: ExerciseId | null;
}

export interface PlannedExercise {
  exerciseId: ExerciseId;
  sets: number;
  targetReps: number | null;
  targetHoldSeconds: number | null;
  restSeconds: number;
  noteKey?: string;
}

export interface PlanDay {
  /** 0 = Monday … 6 = Sunday */
  dayIndex: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  split: Split;
  exercises: PlannedExercise[];
}

export interface WorkoutPlan {
  id: PlanId;
  userId: UserId;
  level: FitnessLevel;
  daysPerWeek: 3 | 4 | 5 | 6;
  generatedAt: IsoDateTime;
  /** Set when a new plan supersedes this one. Never delete plans. */
  archivedAt: IsoDateTime | null;
  days: PlanDay[];
}
