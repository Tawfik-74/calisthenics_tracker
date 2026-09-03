import { asId } from '@/shared/types/ids';
import type { Exercise } from '../model/plan.types';

const id = (n: number) =>
  asId<'ExerciseId'>(`00000000-0000-4000-9000-0000000000${String(n).padStart(2, '0')}`);

/** Seeded catalog. In production this lives in the `exercises` table. */
export const EXERCISES: Exercise[] = [
  { id: id(1), slug: 'push_up', pattern: 'push', measure: 'reps', minLevel: 'beginner', regressionOf: null },
  { id: id(2), slug: 'incline_push_up', pattern: 'push', measure: 'reps', minLevel: 'beginner', regressionOf: id(1) },
  { id: id(3), slug: 'pike_push_up', pattern: 'push', measure: 'reps', minLevel: 'intermediate', regressionOf: id(1) },
  { id: id(4), slug: 'dip', pattern: 'push', measure: 'reps', minLevel: 'intermediate', regressionOf: id(1) },
  { id: id(5), slug: 'pseudo_planche_push_up', pattern: 'push', measure: 'reps', minLevel: 'advanced', regressionOf: id(3) },

  { id: id(10), slug: 'australian_row', pattern: 'pull', measure: 'reps', minLevel: 'beginner', regressionOf: null },
  { id: id(11), slug: 'pull_up', pattern: 'pull', measure: 'reps', minLevel: 'intermediate', regressionOf: id(10) },
  { id: id(12), slug: 'chin_up', pattern: 'pull', measure: 'reps', minLevel: 'intermediate', regressionOf: id(10) },
  { id: id(13), slug: 'archer_pull_up', pattern: 'pull', measure: 'reps', minLevel: 'advanced', regressionOf: id(11) },

  { id: id(20), slug: 'bodyweight_squat', pattern: 'legs', measure: 'reps', minLevel: 'beginner', regressionOf: null },
  { id: id(21), slug: 'split_squat', pattern: 'legs', measure: 'reps', minLevel: 'beginner', regressionOf: id(20) },
  { id: id(22), slug: 'shrimp_squat', pattern: 'legs', measure: 'reps', minLevel: 'intermediate', regressionOf: id(21) },
  { id: id(23), slug: 'pistol_squat', pattern: 'legs', measure: 'reps', minLevel: 'advanced', regressionOf: id(22) },
  { id: id(24), slug: 'nordic_curl', pattern: 'legs', measure: 'reps', minLevel: 'advanced', regressionOf: id(21) },

  { id: id(30), slug: 'plank', pattern: 'core', measure: 'hold', minLevel: 'beginner', regressionOf: null },
  { id: id(31), slug: 'hollow_hold', pattern: 'core', measure: 'hold', minLevel: 'beginner', regressionOf: id(30) },
  { id: id(32), slug: 'hanging_knee_raise', pattern: 'core', measure: 'reps', minLevel: 'intermediate', regressionOf: id(30) },
  { id: id(33), slug: 'l_sit', pattern: 'core', measure: 'hold', minLevel: 'intermediate', regressionOf: id(31) },
  { id: id(34), slug: 'front_lever_tuck', pattern: 'core', measure: 'hold', minLevel: 'advanced', regressionOf: id(33) },
];

export const exerciseById = new Map(EXERCISES.map((e) => [e.id, e]));
export const exerciseBySlug = new Map(EXERCISES.map((e) => [e.slug, e]));
