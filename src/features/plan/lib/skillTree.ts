import type { ExerciseId } from '@/shared/types/ids';
import type { PlannedExercise } from '../model/plan.types';
import type { SkillId, SkillProgression, SkillStep } from '../model/skill.types';
import { moveBySlug } from './moves';

// ── Schema-safe ranges (mirror model/plan.schema.ts) ─────────
const RANGES = {
  sets: [1, 10],
  reps: [1, 100],
  hold: [3, 300],
  rest: [15, 300],
} as const;

const clamp = (n: number, [lo, hi]: readonly [number, number]) =>
  Math.min(hi, Math.max(lo, Math.round(n)));

const step = (
  slug: string,
  moveSlug: string | null,
  sets: number,
  reps: number | null,
  holdSeconds: number | null,
): SkillStep => ({ slug, moveSlug, sets, reps, holdSeconds });

/**
 * The movement skill tree. Each entry breaks an advanced target skill into its
 * muscle + stability demands, an ordered training progression, and a weekly
 * routine. Steps that map to a catalog `moveSlug` can be injected straight into
 * a user's plan via {@link injectableExercises}.
 */
export const SKILL_TREE: readonly SkillProgression[] = [
  {
    id: 'handstand',
    difficulty: 'intermediate',
    primarySplit: 'push',
    muscleGroups: ['push', 'core'],
    stability: ['wrist', 'shoulder_overhead', 'balance_line'],
    steps: [
      step('wall_walk', null, 3, 4, null),
      step('shoulder_taps', null, 3, 10, null),
      step('pike_push_up', 'pike_push_up', 3, 8, null),
      step('chest_to_wall_hold', null, 4, null, 30),
      step('decline_push_up', 'decline_push_up', 3, 10, null),
      step('hollow_hold', 'hollow_hold', 3, null, 30),
      step('freestanding_balance', null, 5, null, 15),
    ],
    weeklySessions: [
      { slug: 'balance', stepSlugs: ['wall_walk', 'chest_to_wall_hold', 'freestanding_balance'] },
      { slug: 'strength', stepSlugs: ['pike_push_up', 'decline_push_up', 'shoulder_taps'] },
      { slug: 'line', stepSlugs: ['hollow_hold', 'chest_to_wall_hold'] },
    ],
  },
  {
    id: 'muscle_up',
    difficulty: 'intermediate',
    primarySplit: 'pull',
    muscleGroups: ['pull', 'push', 'core'],
    stability: ['scapular', 'false_grip', 'straight_arm'],
    steps: [
      step('australian_row', 'australian_row', 3, 12, null),
      step('explosive_pull_up', 'pull_up', 5, 5, null),
      step('chest_to_bar', 'chin_up', 4, 6, null),
      step('straight_bar_dip', 'dip', 4, 8, null),
      step('hollow_hold', 'hollow_hold', 3, null, 25),
      step('transition_negative', null, 4, 3, null),
      step('full_muscle_up', null, 5, 3, null),
    ],
    weeklySessions: [
      { slug: 'power', stepSlugs: ['explosive_pull_up', 'chest_to_bar'] },
      { slug: 'transition', stepSlugs: ['straight_bar_dip', 'transition_negative', 'full_muscle_up'] },
      { slug: 'base', stepSlugs: ['australian_row', 'hollow_hold'] },
    ],
  },
  {
    id: 'pistol_squat',
    difficulty: 'beginner',
    primarySplit: 'legs',
    muscleGroups: ['legs', 'core'],
    stability: ['ankle_dorsiflexion', 'single_leg_balance', 'anterior_core'],
    steps: [
      step('bodyweight_squat', 'bodyweight_squat', 3, 15, null),
      step('box_squat', null, 4, 8, null),
      step('split_squat', 'split_squat', 3, 10, null),
      step('assisted_pistol', null, 3, 6, null),
      step('shrimp_squat', 'shrimp_squat', 3, 6, null),
      step('nordic_curl', 'nordic_curl', 3, 5, null),
      step('full_pistol', 'pistol_squat', 4, 5, null),
    ],
    weeklySessions: [
      { slug: 'unilateral', stepSlugs: ['split_squat', 'assisted_pistol', 'full_pistol'] },
      { slug: 'control', stepSlugs: ['box_squat', 'shrimp_squat'] },
      { slug: 'posterior', stepSlugs: ['bodyweight_squat', 'nordic_curl'] },
    ],
  },
  {
    id: 'planche',
    difficulty: 'advanced',
    primarySplit: 'push',
    muscleGroups: ['push', 'core'],
    stability: ['wrist', 'scapular', 'straight_arm'],
    steps: [
      step('planche_lean', null, 4, null, 20),
      step('pseudo_planche_push_up', 'pseudo_planche_push_up', 4, 8, null),
      step('pike_push_up', 'pike_push_up', 3, 10, null),
      step('l_sit', 'l_sit', 4, null, 15),
      step('tuck_planche_hold', null, 5, null, 15),
      step('advanced_tuck_planche', null, 5, null, 10),
      step('straddle_planche', null, 5, null, 8),
    ],
    weeklySessions: [
      { slug: 'lean', stepSlugs: ['planche_lean', 'pseudo_planche_push_up'] },
      { slug: 'hold', stepSlugs: ['tuck_planche_hold', 'advanced_tuck_planche', 'straddle_planche'] },
      { slug: 'compression', stepSlugs: ['l_sit', 'pike_push_up'] },
    ],
  },
  {
    id: 'front_lever',
    difficulty: 'advanced',
    primarySplit: 'pull',
    muscleGroups: ['pull', 'core'],
    stability: ['scapular', 'straight_arm', 'anterior_core'],
    steps: [
      step('australian_row', 'australian_row', 3, 12, null),
      step('hanging_knee_raise', 'hanging_knee_raise', 3, 10, null),
      step('tuck_front_lever', 'front_lever_tuck', 4, null, 12),
      step('advanced_tuck_front_lever', null, 5, null, 10),
      step('straight_arm_pull_down', null, 4, 8, null),
      step('single_leg_front_lever', null, 5, null, 8),
      step('straddle_front_lever', null, 5, null, 6),
    ],
    weeklySessions: [
      { slug: 'holds', stepSlugs: ['tuck_front_lever', 'advanced_tuck_front_lever', 'single_leg_front_lever'] },
      { slug: 'pull', stepSlugs: ['straight_arm_pull_down', 'australian_row'] },
      { slug: 'core', stepSlugs: ['hanging_knee_raise', 'straddle_front_lever'] },
    ],
  },
  {
    id: 'human_flag',
    difficulty: 'advanced',
    primarySplit: 'pull',
    muscleGroups: ['pull', 'push', 'core'],
    stability: ['scapular', 'straight_arm', 'anterior_core'],
    steps: [
      step('australian_row', 'australian_row', 3, 12, null),
      step('pull_up', 'pull_up', 4, 6, null),
      step('hanging_knee_raise', 'hanging_knee_raise', 3, 10, null),
      step('hollow_hold', 'hollow_hold', 3, null, 30),
      step('vertical_flag_pull', null, 4, 6, null),
      step('support_flag_hold', null, 5, null, 10),
      step('tuck_flag', null, 5, null, 8),
      step('straddle_flag', null, 5, null, 6),
    ],
    weeklySessions: [
      { slug: 'press_pull', stepSlugs: ['pull_up', 'vertical_flag_pull', 'australian_row'] },
      { slug: 'flag_holds', stepSlugs: ['support_flag_hold', 'tuck_flag', 'straddle_flag'] },
      { slug: 'lateral_core', stepSlugs: ['hanging_knee_raise', 'hollow_hold'] },
    ],
  },
  {
    id: 'dragon_flag',
    difficulty: 'intermediate',
    primarySplit: 'pull',
    muscleGroups: ['core', 'pull'],
    stability: ['anterior_core', 'scapular', 'straight_arm'],
    steps: [
      step('hollow_hold', 'hollow_hold', 4, null, 30),
      step('hanging_knee_raise', 'hanging_knee_raise', 3, 12, null),
      step('australian_row', 'australian_row', 3, 12, null),
      step('dragon_negative', null, 4, 4, null),
      step('tuck_dragon_flag', null, 4, 6, null),
      step('straddle_dragon_flag', null, 4, 5, null),
      step('full_dragon_flag', null, 5, 4, null),
    ],
    weeklySessions: [
      { slug: 'eccentric', stepSlugs: ['dragon_negative', 'tuck_dragon_flag'] },
      { slug: 'progression', stepSlugs: ['straddle_dragon_flag', 'full_dragon_flag'] },
      { slug: 'foundation', stepSlugs: ['hollow_hold', 'hanging_knee_raise', 'australian_row'] },
    ],
  },
];

export const skillById = new Map<SkillId, SkillProgression>(
  SKILL_TREE.map((s) => [s.id, s]),
);

const stepBySlug = (progression: SkillProgression) =>
  new Map(progression.steps.map((s) => [s.slug, s]));

/** Steps that map to a catalog move — the ones that can enter a plan. */
export function injectableSteps(progression: SkillProgression): SkillStep[] {
  return progression.steps.filter((s) => s.moveSlug !== null && moveBySlug.has(s.moveSlug));
}

/**
 * Build the {@link PlannedExercise} rows for a skill's catalog-backed steps,
 * deduped by exercise and clamped to the plan schema ranges. Every row carries
 * `noteKey` so the plan editor can show why it was added.
 */
export function injectableExercises(progression: SkillProgression): PlannedExercise[] {
  const seen = new Set<ExerciseId>();
  const rows: PlannedExercise[] = [];

  for (const s of injectableSteps(progression)) {
    const move = moveBySlug.get(s.moveSlug as string);
    if (!move || seen.has(move.id)) continue;
    seen.add(move.id);

    const isHold = move.measure === 'hold';
    rows.push({
      exerciseId: move.id,
      sets: clamp(s.sets, RANGES.sets),
      targetReps: isHold ? null : clamp(s.reps ?? move.defaultReps ?? 8, RANGES.reps),
      targetHoldSeconds: isHold
        ? clamp(s.holdSeconds ?? move.defaultHoldSeconds ?? 15, RANGES.hold)
        : null,
      restSeconds: clamp(move.restSeconds, RANGES.rest),
      noteKey: `plan:skill.injected_note`,
    });
  }

  return rows;
}

/** Resolve a session's step slugs back to their {@link SkillStep} records. */
export function sessionSteps(
  progression: SkillProgression,
  sessionSlug: string,
): SkillStep[] {
  const lookup = stepBySlug(progression);
  const session = progression.weeklySessions.find((x) => x.slug === sessionSlug);
  if (!session) return [];
  return session.stepSlugs.map((slug) => lookup.get(slug)).filter((s): s is SkillStep => Boolean(s));
}
