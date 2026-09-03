import { asId, type ExerciseId } from '@/shared/types/ids';
import type { FitnessLevel } from '@/features/auth';
import type { Exercise } from '../model/plan.types';

export type MuscleGroup = 'push' | 'pull' | 'legs' | 'core';

/**
 * A movement in the library. Single source of truth: the DB-shaped `Exercise`
 * exports below are derived from this, so stats grouping and `exerciseName`
 * keep resolving against the same ids and slugs.
 */
export interface Move {
  id: ExerciseId;
  /** Stable key for i18n AND stats grouping. */
  slug: string;
  /** `plan:exercise.${slug}` */
  nameKey: string;
  muscleGroup: MuscleGroup;
  /** Reps vs. a static hold — changes how you log and how you total. */
  measure: 'reps' | 'hold';
  /** Inherent difficulty — the lowest tier that should attempt it. */
  difficulty: FitnessLevel;
  defaultSets: number;
  defaultReps: number | null;
  defaultHoldSeconds: number | null;
  restSeconds: number;
  /** Three coaching cues: `plan:cue.${slug}.${0|1|2}` */
  cueKeys: readonly [string, string, string];
  regressionOf: ExerciseId | null;
}

const id = (n: number): ExerciseId =>
  asId<'ExerciseId'>(`00000000-0000-4000-9000-0000000000${String(n).padStart(2, '0')}`);

const cues = (slug: string): readonly [string, string, string] => [
  `plan:cue.${slug}.0`,
  `plan:cue.${slug}.1`,
  `plan:cue.${slug}.2`,
];

interface MoveSeed {
  n: number;
  slug: string;
  muscleGroup: MuscleGroup;
  measure: 'reps' | 'hold';
  difficulty: FitnessLevel;
  sets: number;
  reps: number | null;
  hold: number | null;
  rest: number;
  regressionOf: number | null;
}

const SEEDS: MoveSeed[] = [
  // ── Push ────────────────────────────────────────────────
  { n: 1, slug: 'push_up', muscleGroup: 'push', measure: 'reps', difficulty: 'beginner', sets: 4, reps: 12, hold: null, rest: 90, regressionOf: null },
  { n: 2, slug: 'incline_push_up', muscleGroup: 'push', measure: 'reps', difficulty: 'beginner', sets: 3, reps: 8, hold: null, rest: 90, regressionOf: 1 },
  { n: 3, slug: 'pike_push_up', muscleGroup: 'push', measure: 'reps', difficulty: 'intermediate', sets: 3, reps: 8, hold: null, rest: 90, regressionOf: 1 },
  { n: 4, slug: 'dip', muscleGroup: 'push', measure: 'reps', difficulty: 'intermediate', sets: 3, reps: 10, hold: null, rest: 120, regressionOf: 1 },
  { n: 5, slug: 'pseudo_planche_push_up', muscleGroup: 'push', measure: 'reps', difficulty: 'advanced', sets: 4, reps: 8, hold: null, rest: 120, regressionOf: 3 },
  { n: 6, slug: 'decline_push_up', muscleGroup: 'push', measure: 'reps', difficulty: 'intermediate', sets: 3, reps: 10, hold: null, rest: 90, regressionOf: 1 },

  // ── Pull ────────────────────────────────────────────────
  { n: 10, slug: 'australian_row', muscleGroup: 'pull', measure: 'reps', difficulty: 'beginner', sets: 3, reps: 10, hold: null, rest: 90, regressionOf: null },
  { n: 11, slug: 'pull_up', muscleGroup: 'pull', measure: 'reps', difficulty: 'intermediate', sets: 4, reps: 6, hold: null, rest: 120, regressionOf: 10 },
  { n: 12, slug: 'chin_up', muscleGroup: 'pull', measure: 'reps', difficulty: 'intermediate', sets: 3, reps: 10, hold: null, rest: 120, regressionOf: 10 },
  { n: 13, slug: 'archer_pull_up', muscleGroup: 'pull', measure: 'reps', difficulty: 'advanced', sets: 4, reps: 5, hold: null, rest: 150, regressionOf: 11 },

  // ── Legs ────────────────────────────────────────────────
  { n: 20, slug: 'bodyweight_squat', muscleGroup: 'legs', measure: 'reps', difficulty: 'beginner', sets: 3, reps: 12, hold: null, rest: 90, regressionOf: null },
  { n: 21, slug: 'split_squat', muscleGroup: 'legs', measure: 'reps', difficulty: 'beginner', sets: 3, reps: 10, hold: null, rest: 90, regressionOf: 20 },
  { n: 22, slug: 'shrimp_squat', muscleGroup: 'legs', measure: 'reps', difficulty: 'intermediate', sets: 3, reps: 6, hold: null, rest: 90, regressionOf: 21 },
  { n: 23, slug: 'pistol_squat', muscleGroup: 'legs', measure: 'reps', difficulty: 'advanced', sets: 4, reps: 6, hold: null, rest: 120, regressionOf: 22 },
  { n: 24, slug: 'nordic_curl', muscleGroup: 'legs', measure: 'reps', difficulty: 'advanced', sets: 3, reps: 5, hold: null, rest: 120, regressionOf: 21 },

  // ── Core ────────────────────────────────────────────────
  { n: 30, slug: 'plank', muscleGroup: 'core', measure: 'hold', difficulty: 'beginner', sets: 3, reps: null, hold: 30, rest: 60, regressionOf: null },
  { n: 31, slug: 'hollow_hold', muscleGroup: 'core', measure: 'hold', difficulty: 'beginner', sets: 3, reps: null, hold: 25, rest: 60, regressionOf: 30 },
  { n: 32, slug: 'hanging_knee_raise', muscleGroup: 'core', measure: 'reps', difficulty: 'intermediate', sets: 3, reps: 10, hold: null, rest: 75, regressionOf: 30 },
  { n: 33, slug: 'l_sit', muscleGroup: 'core', measure: 'hold', difficulty: 'intermediate', sets: 3, reps: null, hold: 15, rest: 75, regressionOf: 31 },
  { n: 34, slug: 'front_lever_tuck', muscleGroup: 'core', measure: 'hold', difficulty: 'advanced', sets: 4, reps: null, hold: 12, rest: 120, regressionOf: 33 },
];

export const MOVES: readonly Move[] = SEEDS.map((s) => ({
  id: id(s.n),
  slug: s.slug,
  nameKey: `plan:exercise.${s.slug}`,
  muscleGroup: s.muscleGroup,
  measure: s.measure,
  difficulty: s.difficulty,
  defaultSets: s.sets,
  defaultReps: s.reps,
  defaultHoldSeconds: s.hold,
  restSeconds: s.rest,
  cueKeys: cues(s.slug),
  regressionOf: s.regressionOf === null ? null : id(s.regressionOf),
}));

export const moveById = new Map<ExerciseId, Move>(MOVES.map((m) => [m.id, m]));
export const moveBySlug = new Map<string, Move>(MOVES.map((m) => [m.slug, m]));

/** Backward-compatible catalog. In production this lives in the `exercises` table. */
export const EXERCISES: Exercise[] = MOVES.map((m) => ({
  id: m.id,
  slug: m.slug,
  pattern: m.muscleGroup,
  measure: m.measure,
  minLevel: m.difficulty,
  regressionOf: m.regressionOf,
}));

export const exerciseById = new Map(EXERCISES.map((e) => [e.id, e]));
export const exerciseBySlug = new Map(EXERCISES.map((e) => [e.slug, e]));
