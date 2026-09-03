import { describe, expect, it } from 'vitest';
import { asId, type UserId } from '@/shared/types/ids';
import { planDaySchema } from '../model/plan.schema';
import type { Assessment, TrainingGoal } from '../model/assessment.types';
import { moveById } from './moves';
import {
  assess,
  assessTier,
  benchmarkScore,
  bmiCategory,
  computeBmi,
  generatePlan,
  planFromProfile,
} from './planGenerator';

const userId: UserId = asId('00000000-0000-4000-8000-000000000001');
const fixedNow = () => '2026-09-01T05:30:00.000Z';

const assessment = (over: Partial<Assessment> = {}): Assessment => ({
  goal: 'strength',
  weightKg: 80,
  heightCm: 180,
  pushUps: 20,
  pullUps: 8,
  dips: 12,
  takenAt: '2026-09-01T00:00:00.000Z' as Assessment['takenAt'],
  ...over,
});

describe('computeBmi / bmiCategory', () => {
  it('computes BMI to one decimal', () => {
    expect(computeBmi(80, 180)).toBeCloseTo(24.7);
    expect(computeBmi(60, 170)).toBeCloseTo(20.8);
  });

  it('categorises at the standard boundaries', () => {
    expect(bmiCategory(18.4)).toBe('underweight');
    expect(bmiCategory(18.5)).toBe('normal');
    expect(bmiCategory(24.9)).toBe('normal');
    expect(bmiCategory(25)).toBe('overweight');
    expect(bmiCategory(29.9)).toBe('overweight');
    expect(bmiCategory(30)).toBe('obese');
  });
});

describe('benchmarkScore / assessTier', () => {
  it('weights pull-ups x2 and dips x1.5', () => {
    expect(benchmarkScore({ pushUps: 10, pullUps: 3, dips: 4 })).toBe(22);
  });

  it('maps score to a tier', () => {
    const t = (pushUps: number) => assessTier({ pushUps, pullUps: 0, dips: 0 });
    expect(t(19)).toBe('beginner');
    expect(t(20)).toBe('intermediate');
    expect(t(55)).toBe('intermediate');
    expect(t(56)).toBe('advanced');
  });
});

describe('assess', () => {
  it('bundles the derived metrics', () => {
    const r = assess(assessment({ goal: 'hypertrophy' }));
    expect(r.bmi).toBeCloseTo(24.7);
    expect(r.bmiCategory).toBe('normal');
    expect(r.tier).toBe('intermediate');
    expect(r.daysPerWeek).toBe(5);
  });
});

describe('generatePlan', () => {
  it('produces 7 days with the goal-derived frequency', () => {
    const plan = generatePlan({ userId, assessment: assessment({ goal: 'strength' }), now: fixedNow, planId: 'p1' });
    expect(plan.days).toHaveLength(7);
    expect(plan.daysPerWeek).toBe(4);
    expect(plan.generatedAt).toBe('2026-09-01T05:30:00.000Z');
    expect(plan.days.filter((d) => d.split !== 'rest')).toHaveLength(4);
  });

  it('every non-rest day is schema-valid with at least one exercise', () => {
    for (const goal of ['strength', 'hypertrophy', 'mastery', 'fat_loss'] as TrainingGoal[]) {
      const plan = generatePlan({ userId, assessment: assessment({ goal }), now: fixedNow, planId: 'p1' });
      for (const day of plan.days) {
        expect(planDaySchema.safeParse(day).success).toBe(true);
        if (day.split !== 'rest') expect(day.exercises.length).toBeGreaterThan(0);
      }
    }
  });

  it('strength trims reps and lengthens rest versus hypertrophy', () => {
    const base = assessment();
    const strength = generatePlan({ userId, assessment: { ...base, goal: 'strength' }, now: fixedNow, planId: 'p1' });
    const hyper = generatePlan({ userId, assessment: { ...base, goal: 'hypertrophy' }, now: fixedNow, planId: 'p1' });
    const first = (p: typeof strength) => p.days.find((d) => d.split !== 'rest')!.exercises[0];
    expect(first(strength).targetReps!).toBeLessThan(first(hyper).targetReps!);
    expect(first(strength).restSeconds).toBeGreaterThan(first(hyper).restSeconds);
  });

  it('fat_loss adds a core finisher to a non-core day', () => {
    const plan = generatePlan({ userId, assessment: assessment({ goal: 'fat_loss' }), now: fixedNow, planId: 'p1' });
    const pushDay = plan.days.find((d) => d.split === 'push')!;
    const hasCore = pushDay.exercises.some(
      (e) => moveById.get(e.exerciseId)?.muscleGroup === 'core',
    );
    expect(hasCore).toBe(true);
  });

  it('caps reps for an obese athlete', () => {
    const plan = generatePlan({
      userId,
      assessment: assessment({ goal: 'hypertrophy', weightKg: 110, heightCm: 170 }),
      now: fixedNow,
      planId: 'p1',
    });
    for (const day of plan.days) {
      for (const ex of day.exercises) {
        if (ex.targetReps != null) expect(ex.targetReps).toBeLessThanOrEqual(20);
      }
    }
  });

  it('is deterministic given a fixed clock and planId', () => {
    const a = generatePlan({ userId, assessment: assessment(), now: fixedNow, planId: 'p1' });
    const b = generatePlan({ userId, assessment: assessment(), now: fixedNow, planId: 'p1' });
    expect(a).toEqual(b);
  });
});

describe('planFromProfile', () => {
  it('builds a neutral plan from level + frequency', () => {
    const plan = planFromProfile({ userId, level: 'beginner', daysPerWeek: 3, now: fixedNow, planId: 'p1' });
    expect(plan.days).toHaveLength(7);
    expect(plan.days.filter((d) => d.split !== 'rest')).toHaveLength(3);
  });
});
