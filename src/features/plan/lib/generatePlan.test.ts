import { describe, expect, it } from 'vitest';
import { asId } from '@/shared/types/ids';
import { generatePlan } from './generatePlan';

const userId = asId<'UserId'>('00000000-0000-4000-8000-000000000001');
const fixedNow = () => '2026-09-01T05:30:00.000Z';

describe('generatePlan', () => {
  it('always produces exactly 7 days', () => {
    for (const days of [3, 4, 5, 6] as const) {
      const plan = generatePlan({ userId, level: 'beginner', daysPerWeek: days, now: fixedNow });
      expect(plan.days).toHaveLength(7);
    }
  });

  it('training days match the requested count', () => {
    const plan = generatePlan({ userId, level: 'intermediate', daysPerWeek: 4, now: fixedNow });
    const trainingDays = plan.days.filter((d) => d.split !== 'rest');
    expect(trainingDays).toHaveLength(4);
  });

  it('rest days carry no exercises', () => {
    const plan = generatePlan({ userId, level: 'advanced', daysPerWeek: 3, now: fixedNow });
    for (const day of plan.days) {
      if (day.split === 'rest') expect(day.exercises).toHaveLength(0);
      else expect(day.exercises.length).toBeGreaterThan(0);
    }
  });

  it('is deterministic given a fixed clock and planId', () => {
    const a = generatePlan({ userId, level: 'beginner', daysPerWeek: 5, now: fixedNow, planId: 'p1' });
    const b = generatePlan({ userId, level: 'beginner', daysPerWeek: 5, now: fixedNow, planId: 'p1' });
    expect(a).toEqual(b);
  });

  it('hold-based exercises have null targetReps', () => {
    const plan = generatePlan({ userId, level: 'beginner', daysPerWeek: 6, now: fixedNow });
    const core = plan.days.find((d) => d.split === 'core');
    expect(core?.exercises.some((e) => e.targetHoldSeconds !== null && e.targetReps === null)).toBe(true);
  });
});
