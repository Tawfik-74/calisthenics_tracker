import { describe, expect, it } from 'vitest';
import { asId, type UserId } from '@/shared/types/ids';
import type { WorkoutPlan } from '../model/plan.types';
import { applyProgressiveOverload } from './progressiveOverload';

const exerciseId = asId<'ExerciseId'>('00000000-0000-4000-9000-000000000001');
const plan: WorkoutPlan = {
  id: asId('00000000-0000-4000-9000-000000000099'),
  userId: asId('00000000-0000-4000-8000-000000000001') as UserId,
  level: 'beginner', daysPerWeek: 3, generatedAt: '2026-09-01T00:00:00.000Z' as never, archivedAt: null,
  days: Array.from({ length: 7 }, (_, dayIndex) => ({
    dayIndex: dayIndex as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    split: dayIndex === 0 ? 'push' as const : 'rest' as const,
    exercises: dayIndex === 0 ? [{ exerciseId, sets: 2, targetReps: 8, targetHoldSeconds: null, restSeconds: 60 }] : [],
  })),
};

describe('applyProgressiveOverload', () => {
  it('adds one rep after two successful attempts', () => {
    const session = (date: string) => ({ finishedAt: date, exercises: [{ exerciseId, sets: [
      { reps: 8, holdSeconds: null, effort: 8 }, { reps: 8, holdSeconds: null, effort: 8 },
    ] }] });
    const result = applyProgressiveOverload(plan, [session('2026-09-02'), session('2026-09-04')]);
    expect(result.days[0].exercises[0]).toMatchObject({ targetReps: 9, noteKey: 'plan:cue.progressed' });
  });

  it('keeps the target when an attempt misses', () => {
    const sessions = [7, 8].map((reps, index) => ({ finishedAt: `2026-09-0${index + 2}`, exercises: [{ exerciseId, sets: [
      { reps, holdSeconds: null, effort: 8 }, { reps, holdSeconds: null, effort: 8 },
    ] }] }));
    expect(applyProgressiveOverload(plan, sessions).days[0].exercises[0].targetReps).toBe(8);
  });
});
