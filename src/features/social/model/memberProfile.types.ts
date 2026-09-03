import type { IsoDateTime, MonthKey, SessionId, UserId } from '@/shared/types/ids';
import type { FitnessLevel } from '@/features/auth';
import type { Split } from '@/features/plan';
import type { ExerciseMonthlyTotal } from '@/features/stats';

/**
 * One completed session, as a squadmate is allowed to see it.
 * Deliberately NOT `WorkoutSession`: no notes, no per-set RPE, no raw sets.
 * The shape difference IS the privacy boundary — if this reused the owner's
 * type, widening that type later would silently leak fields to squadmates.
 */
export interface MemberRecentSession {
  sessionId: SessionId;
  split: Exclude<Split, 'rest'>;
  finishedAt: IsoDateTime;
  totalReps: number;
  totalHoldSeconds: number;
  totalSets: number;
}

/** Cheap half of the profile — already in memory from `useSquad()`. */
export interface MemberProfileHeader {
  userId: UserId;
  displayName: string;
  avatarUrl: string | null;
  role: 'owner' | 'member';
  level: FitnessLevel;
  /** IANA zone. Needed to bucket "active days" by the member's own calendar. */
  timeZone: string;
  joinedAt: IsoDateTime;
}

/** Derived client-side from the session list — see deriveMonthSummary. */
export interface MemberMonthSummary {
  totalSessions: number;
  totalReps: number;
  totalHoldSeconds: number;
  /** Distinct calendar days trained in the MEMBER's time zone. */
  activeDays: number;
}

export interface SquadMemberProfile {
  header: MemberProfileHeader;
  month: MonthKey;
  summary: MemberMonthSummary;
  byExercise: ExerciseMonthlyTotal[];
  recentSessions: MemberRecentSession[];
  /** You don't nudge yourself; the card hides the action. */
  isSelf: boolean;
}
