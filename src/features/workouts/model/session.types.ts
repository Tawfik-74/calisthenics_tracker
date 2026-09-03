import type { IsoDateTime, ExerciseId, PlanId, SessionId, UserId } from '@/shared/types/ids';
import type { PlanDay, Split } from '@/features/plan';

export interface LoggedSet {
  /** Client-generated UUID -> idempotent sync. */
  id: string;
  setNumber: number;
  reps: number | null;
  holdSeconds: number | null;
  /** 1–10 RPE, optional */
  effort: number | null;
  completedAt: IsoDateTime;
}

export interface LoggedExercise {
  exerciseId: ExerciseId;
  sets: LoggedSet[];
}

export type SessionStatus = 'active' | 'completed' | 'abandoned';

export interface WorkoutSession {
  id: SessionId;
  userId: UserId;
  planId: PlanId;
  planDayIndex: PlanDay['dayIndex'];
  split: Split;
  status: SessionStatus;
  startedAt: IsoDateTime;
  finishedAt: IsoDateTime | null;
  exercises: LoggedExercise[];
  notes: string | null;
}
