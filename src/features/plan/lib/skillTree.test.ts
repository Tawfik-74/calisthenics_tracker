import { describe, expect, it } from 'vitest';
import { planDaySchema } from '../model/plan.schema';
import { moveBySlug } from './moves';
import {
  SKILL_TREE,
  injectableExercises,
  injectableSteps,
  sessionSteps,
  skillById,
} from './skillTree';

describe('skill tree', () => {
  it('has seven target skills with unique ids', () => {
    expect(SKILL_TREE).toHaveLength(7);
    expect(new Set(SKILL_TREE.map((s) => s.id)).size).toBe(7);
  });

  it('every catalog-backed step points at a known move', () => {
    for (const skill of SKILL_TREE) {
      for (const step of skill.steps) {
        if (step.moveSlug !== null) expect(moveBySlug.has(step.moveSlug)).toBe(true);
      }
    }
  });

  it('every weekly-session step slug exists on the skill', () => {
    for (const skill of SKILL_TREE) {
      const known = new Set(skill.steps.map((s) => s.slug));
      for (const session of skill.weeklySessions) {
        for (const slug of session.stepSlugs) expect(known.has(slug)).toBe(true);
        expect(sessionSteps(skill, session.slug)).toHaveLength(session.stepSlugs.length);
      }
    }
  });

  it('injectable exercises are deduped and pass the plan-day schema', () => {
    for (const skill of SKILL_TREE) {
      const rows = injectableExercises(skill);
      expect(rows.length).toBeGreaterThan(0);
      expect(rows.length).toBeLessThanOrEqual(injectableSteps(skill).length);
      expect(new Set(rows.map((r) => r.exerciseId)).size).toBe(rows.length);

      const day = planDaySchema.safeParse({
        dayIndex: 0,
        split: skill.primarySplit,
        exercises: rows,
      });
      expect(day.success).toBe(true);

      for (const row of rows) {
        expect(row.targetReps === null || row.targetHoldSeconds === null).toBe(true);
        expect(row.noteKey).toBe('plan:skill.injected_note');
      }
    }
  });

  it('resolves every skill through skillById', () => {
    for (const skill of SKILL_TREE) expect(skillById.get(skill.id)).toBe(skill);
  });
});
