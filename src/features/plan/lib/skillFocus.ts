import type { PlanDay, PlannedExercise } from '../model/plan.types';
import type { SkillId } from '../model/skill.types';
import { injectableExercises, skillById } from './skillTree';

/** Marks an exercise that leads its day because of a target-skill focus. */
export const SKILL_FOCUS_NOTE = 'plan:skill.focus_note';

/**
 * Rewrites a generated week so the target skill leads its primary training day.
 *
 * The skill's catalog-backed prerequisites are prepended — explosive power and
 * technique work belong at the front of the session while the athlete is fresh —
 * each tagged with {@link SKILL_FOCUS_NOTE}. Pre-existing accessory volume on
 * that day is trimmed by one set per exercise to keep total load in check.
 *
 * If the split template has no day matching the skill's `primarySplit`, the
 * focus block is placed on the first training day instead.
 */
export function applySkillFocus(days: PlanDay[], skillTarget: SkillId): PlanDay[] {
  const skill = skillById.get(skillTarget);
  if (!skill) return days;

  const focus: PlannedExercise[] = injectableExercises(skill).map((ex) => ({
    ...ex,
    noteKey: SKILL_FOCUS_NOTE,
  }));
  if (focus.length === 0) return days;

  const focusIds = new Set(focus.map((f) => f.exerciseId));
  const matchingIdx = days.flatMap((d, i) => (d.split === skill.primarySplit ? [i] : []));
  const targetIdx = matchingIdx.length
    ? matchingIdx
    : days.flatMap((d, i) => (d.split !== 'rest' ? [i] : [])).slice(0, 1);
  const targets = new Set(targetIdx);

  return days.map((day, i) => {
    if (!targets.has(i)) return day;
    const trimmed = day.exercises
      .filter((ex) => !focusIds.has(ex.exerciseId))
      .map((ex) => ({ ...ex, sets: Math.max(1, ex.sets - 1) }));
    return { ...day, exercises: [...focus, ...trimmed] };
  });
}
