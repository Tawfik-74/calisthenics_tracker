import type { ExerciseId, MonthKey, UserId } from '@/shared/types/ids';
import { monthKeyOf } from '@/shared/lib/dates';
import { exerciseById } from '@/features/plan';
import type { FinishSessionInput } from '@/features/workouts';
import type { ExerciseMonthlyTotal, MonthlyStats } from '../model/stats.types';

export interface AggregateOptions {
  userId: UserId;
  month: MonthKey;
  /** IANA zone for bucketing; omit to bucket by UTC month. */
  timeZone?: string;
}

/**
 * Pure client-side fallback for the Postgres `monthly_exercise_totals` RPC.
 * Trivially unit-testable — no IO.
 */
export function aggregateMonthly(
  sessions: FinishSessionInput[],
  { userId, month, timeZone }: AggregateOptions,
): MonthlyStats {
  const inMonth = (s: FinishSessionInput) => monthKeyOf(s.finishedAt, timeZone) === month;
  const prevMonth = shift(month, -1);
  const inPrev = (s: FinishSessionInput) => monthKeyOf(s.finishedAt, timeZone) === prevMonth;

  const current = sessions.filter(inMonth);
  const previous = sessions.filter(inPrev);

  const prevReps = repsByExercise(previous);
  const byExercise = buildTotals(current, prevReps);

  return {
    userId,
    month,
    totalSessions: current.length,
    totalReps: byExercise.reduce((a, e) => a + e.totalReps, 0),
    totalHoldSeconds: byExercise.reduce((a, e) => a + e.totalHoldSeconds, 0),
    activeDays: new Set(current.map((s) => s.finishedAt.slice(0, 10))).size,
    byExercise,
  };
}

function repsByExercise(sessions: FinishSessionInput[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of sessions) {
    for (const ex of s.exercises) {
      const reps = ex.sets.reduce((a, x) => a + (x.reps ?? 0), 0);
      m.set(ex.exerciseId, (m.get(ex.exerciseId) ?? 0) + reps);
    }
  }
  return m;
}

function buildTotals(
  sessions: FinishSessionInput[],
  prevReps: Map<string, number>,
): ExerciseMonthlyTotal[] {
  const acc = new Map<string, ExerciseMonthlyTotal & { _sessions: Set<string> }>();

  for (const s of sessions) {
    for (const ex of s.exercises) {
      const meta = exerciseById.get(ex.exerciseId as ExerciseId);
      const key = ex.exerciseId;
      const entry =
        acc.get(key) ??
        acc
          .set(key, {
            exerciseId: ex.exerciseId as ExerciseId,
            slug: meta?.slug ?? 'unknown',
            measure: meta?.measure ?? 'reps',
            totalReps: 0,
            totalHoldSeconds: 0,
            totalSets: 0,
            sessionCount: 0,
            bestSetReps: 0,
            changeVsPrevMonth: null,
            _sessions: new Set<string>(),
          })
          .get(key)!;

      for (const set of ex.sets) {
        entry.totalReps += set.reps ?? 0;
        entry.totalHoldSeconds += set.holdSeconds ?? 0;
        entry.totalSets += 1;
        entry.bestSetReps = Math.max(entry.bestSetReps, set.reps ?? 0);
      }
      entry._sessions.add(s.sessionId);
    }
  }

  return [...acc.values()]
    .map(({ _sessions, ...e }) => {
      const prev = prevReps.get(e.exerciseId) ?? 0;
      return {
        ...e,
        sessionCount: _sessions.size,
        changeVsPrevMonth: prev > 0 ? (e.totalReps - prev) / prev : null,
      };
    })
    .sort((a, b) => b.totalReps - a.totalReps || b.totalHoldSeconds - a.totalHoldSeconds);
}

function shift(key: MonthKey, delta: number): MonthKey {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}` as MonthKey;
}
