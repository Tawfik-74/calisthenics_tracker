import type { ExerciseId, MonthKey, UserId } from '@/shared/types/ids';

export interface ExerciseMonthlyTotal {
  exerciseId: ExerciseId;
  slug: string;
  measure: 'reps' | 'hold';
  totalReps: number;
  totalHoldSeconds: number;
  totalSets: number;
  sessionCount: number;
  bestSetReps: number;
  /** vs. previous month, as a ratio. null when there is no previous month. */
  changeVsPrevMonth: number | null;
}

export interface MonthlyStats {
  userId: UserId;
  month: MonthKey;
  totalSessions: number;
  totalReps: number;
  totalHoldSeconds: number;
  /** Distinct calendar days trained — the honest "consistency" number. */
  activeDays: number;
  byExercise: ExerciseMonthlyTotal[];
}
