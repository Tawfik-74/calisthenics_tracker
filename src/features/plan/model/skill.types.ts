import type { FitnessLevel } from '@/features/auth';
import type { MuscleGroup } from '../lib/moves';
import type { Split } from './plan.types';

/** Stable id for a target skill — also its i18n + grouping key. */
export type SkillId =
  | 'handstand'
  | 'muscle_up'
  | 'pistol_squat'
  | 'planche'
  | 'front_lever'
  | 'human_flag'
  | 'dragon_flag';

/**
 * A stability demand the skill places on a joint or line. String keys resolve
 * to `plan:skill.stability.${key}`.
 */
export type StabilityKey =
  | 'wrist'
  | 'shoulder_overhead'
  | 'scapular'
  | 'straight_arm'
  | 'false_grip'
  | 'anterior_core'
  | 'balance_line'
  | 'ankle_dorsiflexion'
  | 'single_leg_balance';

/**
 * One rung on the road to a skill. When `moveSlug` is set the step maps to a
 * catalog {@link import('../lib/moves').Move} and can be injected into a plan;
 * when it is `null` the step is a drill shown on the roadmap only.
 */
export interface SkillStep {
  /** Stable key: `plan:skill.step.${slug}` / `plan:skill.step_hint.${slug}`. */
  slug: string;
  /** Catalog move backing this step, or `null` for a roadmap-only drill. */
  moveSlug: string | null;
  sets: number;
  reps: number | null;
  holdSeconds: number | null;
}

/** A recommended training session inside the weekly routine for a skill. */
export interface SkillSession {
  /** `plan:skill.session.${skillId}.${slug}` */
  slug: string;
  /** Steps (by {@link SkillStep.slug}) trained in this session. */
  stepSlugs: string[];
}

/** The full prerequisite breakdown + roadmap for one target skill. */
export interface SkillProgression {
  id: SkillId;
  /** Lowest tier that should start chasing this skill. */
  difficulty: FitnessLevel;
  /** Plan day the prerequisites belong on. */
  primarySplit: Exclude<Split, 'rest' | 'core'>;
  /** Muscle groups the skill demands. */
  muscleGroups: MuscleGroup[];
  /** Stability requirements. */
  stability: StabilityKey[];
  /** Ordered training progression, easiest first. */
  steps: SkillStep[];
  /** Recommended weekly routine to unlock the skill. */
  weeklySessions: SkillSession[];
}
