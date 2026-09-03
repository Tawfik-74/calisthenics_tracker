import type { IsoDateTime } from '@/shared/types/ids';
import type { FitnessLevel } from '@/features/auth';

/** What the athlete is training for — drives volume, rest, and weekly frequency. */
export type TrainingGoal = 'strength' | 'hypertrophy' | 'mastery' | 'fat_loss';

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

/** Raw onboarding input plus the timestamp it was captured. */
export interface Assessment {
  goal: TrainingGoal;
  weightKg: number;
  heightCm: number;
  /** Max reps in a single all-out set. */
  pushUps: number;
  pullUps: number;
  dips: number;
  takenAt: IsoDateTime;
}

/** Everything derived from an {@link Assessment}. Pure function of the input. */
export interface AssessmentResult {
  /** Rounded to one decimal. */
  bmi: number;
  bmiCategory: BmiCategory;
  tier: FitnessLevel;
  /** Weighted benchmark total — surfaced for transparency. */
  benchmarkScore: number;
  /** Weekly training frequency chosen for the goal. */
  daysPerWeek: 3 | 4 | 5 | 6;
}
