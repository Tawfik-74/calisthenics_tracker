import { describe, expect, it } from 'vitest';
import { asId, type UserId } from '@/shared/types/ids';
import { planDaySchema } from '../model/plan.schema';
import type { Assessment } from '../model/assessment.types';
import { skillById, injectableExercises } from './skillTree';
import { SKILL_FOCUS_NOTE, applySkillFocus } from './skillFocus';
import { assess, generatePlan, legEnduranceBand } from './planGenerator';

const userId: UserId = asId('00000000-0000-4000-8000-000000000001');
const fixedNow = () => '2026-09-01T05:30:00.000Z';

const assessment = (over: Partial<Assessment> = {}): Assessment => ({
  goal: 'mastery',
  weightKg: 78,
  heightCm: 178,
  pushUps: 25,
  pullUps: 10,
  dips: 15,
  takenAt: '2026-09-01T00:00:00.000Z' as Assessment['takenAt'],
  ...over,
});

describe('applySkillFocus', () => {
  it('prepends the skill progression onto its primary day, tagged as focus', () => {
    const base = generatePlan({ userId, assessment: assessment(), now: fixedNow, planId: 'p1' });
    const focused = applySkillFocus(base.days, 'muscle_up');

    const skill = skillById.get('muscle_up')!;
    const day = focused.find((d) => d.split === skill.primarySplit)!;
    const lead = injectableExercises(skill);

    expect(day.exercises.slice(0, lead.length).map((e) => e.exerciseId)).toEqual(
      lead.map((e) => e.exerciseId),
    );
    for (const ex of day.exercises.slice(0, lead.length)) {
      expect(ex.noteKey).toBe(SKILL_FOCUS_NOTE);
    }
  });

  it('keeps every day schema-valid', () => {
    for (const skill of skillById.values()) {
      const base = generatePlan({ userId, assessment: assessment(), now: fixedNow, planId: 'p1' });
      for (const day of applySkillFocus(base.days, skill.id)) {
        expect(planDaySchema.safeParse(day).success).toBe(true);
      }
    }
  });

  it('does not mutate the input days', () => {
    const base = generatePlan({ userId, assessment: assessment(), now: fixedNow, planId: 'p1' });
    const snapshot = JSON.stringify(base.days);
    applySkillFocus(base.days, 'front_lever');
    expect(JSON.stringify(base.days)).toBe(snapshot);
  });
});

describe('generatePlan with a skill target', () => {
  it('folds the target skill into the plan and leaves the generic path untouched without one', () => {
    const withSkill = generatePlan({
      userId,
      assessment: assessment({ skillTarget: 'planche' }),
      now: fixedNow,
      planId: 'p1',
    });
    const withoutSkill = generatePlan({
      userId,
      assessment: assessment({ skillTarget: null }),
      now: fixedNow,
      planId: 'p1',
    });

    const skill = skillById.get('planche')!;
    const pushDay = withSkill.days.find((d) => d.split === skill.primarySplit)!;
    expect(pushDay.exercises.some((e) => e.noteKey === SKILL_FOCUS_NOTE)).toBe(true);
    expect(
      withoutSkill.days.every((d) => d.exercises.every((e) => e.noteKey !== SKILL_FOCUS_NOTE)),
    ).toBe(true);
  });

  it('squat baseline nudges the lead legs exercise volume', () => {
    const strong = generatePlan({
      userId,
      assessment: assessment({ goal: 'strength', squats: 60 }),
      now: fixedNow,
      planId: 'p1',
    });
    const weak = generatePlan({
      userId,
      assessment: assessment({ goal: 'strength', squats: 5 }),
      now: fixedNow,
      planId: 'p1',
    });
    const legLead = (p: typeof strong) =>
      p.days.find((d) => d.split === 'legs')!.exercises[0].sets;
    expect(legLead(strong)).toBeGreaterThan(legLead(weak));
  });

  it('assess() reports the derived skill target and leg-endurance band', () => {
    expect(legEnduranceBand(undefined)).toBeNull();
    expect(legEnduranceBand(10)).toBe('low');
    expect(legEnduranceBand(30)).toBe('moderate');
    expect(legEnduranceBand(50)).toBe('high');

    const r = assess(assessment({ skillTarget: 'human_flag', squats: 45 }));
    expect(r.skillTarget).toBe('human_flag');
    expect(r.legEndurance).toBe('high');

    const none = assess(assessment({ skillTarget: null }));
    expect(none.skillTarget).toBeNull();
    expect(none.legEndurance).toBeNull();
  });
});
