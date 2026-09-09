import type { ExerciseId } from '@/shared/types/ids';

/** Where the player is in its lifecycle. */
export type PlayerStatus = 'idle' | 'active' | 'resting' | 'paused' | 'completed';

/** How a set is measured — reps you count, or a hold you time. */
export type SetMeasure = 'reps' | 'hold';

/**
 * One flattened unit of work: a single set of a single exercise. The whole day
 * is `steps: PlayerStep[]`; the player walks it front to back, inserting a rest
 * phase after every step except the last.
 */
export interface PlayerStep {
  exerciseId: ExerciseId;
  /** Stable catalog slug — drives media lookup + i18n. */
  slug: string;
  /** `plan:exercise.${slug}` */
  nameKey: string;
  /** Three coaching cues: `plan:cue.${slug}.${0|1|2}` */
  cueKeys: string[];
  measure: SetMeasure;
  targetReps: number | null;
  targetHoldSeconds: number | null;
  /** Rest taken *after* this set, in seconds. */
  restSeconds: number;
  /** 0-based position of the parent exercise in the day. */
  exerciseIndex: number;
  /** 1-based set number within the parent exercise. */
  setNumber: number;
  /** Total sets in the parent exercise (recomputed when a set is added). */
  totalSets: number;
  /** True for the final step of the whole workout. */
  isLast: boolean;
}

/** Emitted by the store every time a set is completed, for the host to log. */
export interface CompletedSet {
  /** Unique per completion — use as an effect key to log exactly once. */
  key: string;
  exerciseId: ExerciseId;
  setNumber: number;
  measure: SetMeasure;
  reps: number | null;
  holdSeconds: number | null;
}
