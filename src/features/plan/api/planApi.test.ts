import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/lib/supabase', () => ({
  supabase: null,
  requireSupabase: () => {
    throw new Error('not configured');
  },
}));

import { asId, type UserId } from '@/shared/types/ids';
import { assessTier } from '../lib/planGenerator';
import { planApi } from './planApi';

const userId: UserId = asId('00000000-0000-4000-8000-000000000001');

const assessment = {
  goal: 'strength' as const,
  weightKg: 80,
  heightCm: 180,
  pushUps: 20,
  pullUps: 8,
  dips: 12,
  takenAt: '2026-09-01T00:00:00.000Z',
};

function writeAssessment() {
  localStorage.setItem('ct.assessment', JSON.stringify({ state: { assessment }, version: 1 }));
}

describe('planApi (mock mode)', () => {
  beforeEach(() => localStorage.clear());

  it('generates and caches a profile plan when nothing is stored', async () => {
    const plan = await planApi.getCurrent(userId, 'beginner', 3);
    expect(plan.days).toHaveLength(7);
    expect(localStorage.getItem('ct.plan')).not.toBeNull();
  });

  it('regenerate honours a stored assessment', async () => {
    writeAssessment();
    localStorage.removeItem('ct.plan');
    const plan = await planApi.regenerate(userId, 'beginner', 3);
    expect(plan.daysPerWeek).toBe(4); // strength → 4
    expect(plan.level).toBe(assessTier(assessment));
  });

  it('savePlan persists an edited plan that getCurrent then returns verbatim', async () => {
    const plan = await planApi.getCurrent(userId, 'beginner', 3);
    const edited = { ...plan, days: plan.days.map((d) => ({ ...d, exercises: [] })) };
    const saved = await planApi.savePlan(userId, edited);
    expect(saved).toEqual(edited);
    const next = await planApi.getCurrent(userId, 'beginner', 3);
    expect(next.days.every((d) => d.exercises.length === 0)).toBe(true);
  });
});
