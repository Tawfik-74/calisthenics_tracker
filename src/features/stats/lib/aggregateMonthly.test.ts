import { describe, expect, it } from 'vitest';
import { asId } from '@/shared/types/ids';
import type { FinishSessionInput } from '@/features/workouts';
import { aggregateMonthly } from './aggregateMonthly';

const userId = asId<'UserId'>('00000000-0000-4000-8000-000000000001');
const PUSH_UP = '00000000-0000-4000-9000-000000000001';

function session(finishedAt: string, reps: number[]): FinishSessionInput {
  return {
    sessionId: crypto.randomUUID(),
    planId: crypto.randomUUID(),
    planDayIndex: 0,
    split: 'push',
    startedAt: finishedAt,
    finishedAt,
    notes: null,
    exercises: [
      {
        exerciseId: PUSH_UP,
        sets: reps.map((r, i) => ({
          exerciseId: PUSH_UP,
          setNumber: i + 1,
          measure: 'reps' as const,
          reps: r,
          holdSeconds: null,
          effort: null,
          completedAt: finishedAt,
        })),
      },
    ],
  };
}

describe('aggregateMonthly', () => {
  const sessions = [
    session('2026-09-02T18:30:00.000Z', [12, 10, 8]),
    session('2026-09-09T18:30:00.000Z', [12, 12, 10]),
    session('2026-08-20T18:30:00.000Z', [10, 10]),
  ];

  it('sums reps only within the target month', () => {
    const stats = aggregateMonthly(sessions, { userId, month: '2026-09' as never });
    expect(stats.totalReps).toBe(12 + 10 + 8 + 12 + 12 + 10);
    expect(stats.totalSessions).toBe(2);
    expect(stats.activeDays).toBe(2);
  });

  it('computes change vs previous month as a ratio', () => {
    const stats = aggregateMonthly(sessions, { userId, month: '2026-09' as never });
    const pushUp = stats.byExercise.find((e) => e.slug === 'push_up');
    // Sept 64 reps vs Aug 20 reps -> (64-20)/20 = 2.2
    expect(pushUp?.changeVsPrevMonth).toBeCloseTo(2.2);
  });

  it('returns null change when there is no previous month', () => {
    const stats = aggregateMonthly(sessions, { userId, month: '2026-08' as never });
    expect(stats.byExercise[0]?.changeVsPrevMonth).toBeNull();
  });

  it('tracks the best single set', () => {
    const stats = aggregateMonthly(sessions, { userId, month: '2026-09' as never });
    expect(stats.byExercise[0]?.bestSetReps).toBe(12);
  });
});
