import type { FitnessLevel } from '@/features/auth';
import type { Split } from '../model/plan.types';

export interface ProgressionEntry {
  /** exercise slug */
  slug: string;
  sets: number;
  reps: number | null;
  holdSeconds: number | null;
  restSeconds: number;
}

type Ladder = Record<Exclude<Split, 'rest'>, ProgressionEntry[]>;

/** The exercise ladder per level. One entry per pattern per level. */
export const PROGRESSION: Record<FitnessLevel, Ladder> = {
  beginner: {
    push: [{ slug: 'incline_push_up', sets: 3, reps: 8, holdSeconds: null, restSeconds: 90 }],
    pull: [{ slug: 'australian_row', sets: 3, reps: 8, holdSeconds: null, restSeconds: 90 }],
    legs: [{ slug: 'bodyweight_squat', sets: 3, reps: 12, holdSeconds: null, restSeconds: 90 }],
    core: [{ slug: 'plank', sets: 3, reps: null, holdSeconds: 30, restSeconds: 60 }],
  },
  intermediate: {
    push: [
      { slug: 'push_up', sets: 4, reps: 12, holdSeconds: null, restSeconds: 90 },
      { slug: 'dip', sets: 3, reps: 8, holdSeconds: null, restSeconds: 120 },
    ],
    pull: [
      { slug: 'pull_up', sets: 4, reps: 6, holdSeconds: null, restSeconds: 120 },
      { slug: 'australian_row', sets: 3, reps: 12, holdSeconds: null, restSeconds: 90 },
    ],
    legs: [
      { slug: 'split_squat', sets: 3, reps: 10, holdSeconds: null, restSeconds: 90 },
      { slug: 'shrimp_squat', sets: 3, reps: 6, holdSeconds: null, restSeconds: 90 },
    ],
    core: [
      { slug: 'hanging_knee_raise', sets: 3, reps: 10, holdSeconds: null, restSeconds: 75 },
      { slug: 'l_sit', sets: 3, reps: null, holdSeconds: 15, restSeconds: 75 },
    ],
  },
  advanced: {
    push: [
      { slug: 'pseudo_planche_push_up', sets: 4, reps: 8, holdSeconds: null, restSeconds: 120 },
      { slug: 'dip', sets: 4, reps: 12, holdSeconds: null, restSeconds: 120 },
    ],
    pull: [
      { slug: 'archer_pull_up', sets: 4, reps: 5, holdSeconds: null, restSeconds: 150 },
      { slug: 'chin_up', sets: 3, reps: 10, holdSeconds: null, restSeconds: 120 },
    ],
    legs: [
      { slug: 'pistol_squat', sets: 4, reps: 6, holdSeconds: null, restSeconds: 120 },
      { slug: 'nordic_curl', sets: 3, reps: 5, holdSeconds: null, restSeconds: 120 },
    ],
    core: [
      { slug: 'front_lever_tuck', sets: 4, reps: null, holdSeconds: 12, restSeconds: 120 },
      { slug: 'l_sit', sets: 3, reps: null, holdSeconds: 25, restSeconds: 90 },
    ],
  },
};
