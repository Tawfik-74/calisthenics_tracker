import { asId, nowIso, type UserId } from '@/shared/types/ids';
import type { FitnessLevel } from '@/features/auth';
import type { PlanDay, PlannedExercise, Split, WorkoutPlan } from '../model/plan.types';
import type {
  Assessment,
  AssessmentResult,
  BmiCategory,
  TrainingGoal,
} from '../model/assessment.types';
import { PROGRESSION } from './progressionTable';
import { SPLIT_TEMPLATES } from './splitTemplates';
import { MOVES, moveBySlug } from './moves';

// ── Tunable constants ─────────────────────────────────────
export const TIER_WEIGHTS = { pushUps: 1, pullUps: 2, dips: 1.5 } as const;
/** Weighted benchmark score below `intermediate` → beginner; `<= advanced` → intermediate. */
export const TIER_CUTOFFS = { intermediate: 20, advanced: 55 } as const;
export const GOAL_DAYS: Record<TrainingGoal, 3 | 4 | 5 | 6> = {
  strength: 4,
  hypertrophy: 5,
  mastery: 4,
  fat_loss: 5,
};

const RANGES = {
  sets: [1, 10],
  reps: [1, 100],
  hold: [3, 300],
  rest: [15, 300],
} as const;

const clamp = (n: number, [lo, hi]: readonly [number, number]) => Math.min(hi, Math.max(lo, n));
const levelRank: Record<FitnessLevel, number> = { beginner: 0, intermediate: 1, advanced: 2 };

// ── Pure metrics ─────────────────────────────────────────

/** BMI = kg / m², rounded to one decimal. */
export function computeBmi(weightKg: number, heightCm: number): number {
  const m = heightCm / 100;
  return Math.round((weightKg / (m * m)) * 10) / 10;
}

export function bmiCategory(bmi: number): BmiCategory {
  if (bmi < 18.5) return 'underweight';
  if (bmi < 25) return 'normal';
  if (bmi < 30) return 'overweight';
  return 'obese';
}

export function benchmarkScore(a: Pick<Assessment, 'pushUps' | 'pullUps' | 'dips'>): number {
  return (
    a.pushUps * TIER_WEIGHTS.pushUps +
    a.pullUps * TIER_WEIGHTS.pullUps +
    a.dips * TIER_WEIGHTS.dips
  );
}

export function assessTier(a: Pick<Assessment, 'pushUps' | 'pullUps' | 'dips'>): FitnessLevel {
  const score = benchmarkScore(a);
  if (score < TIER_CUTOFFS.intermediate) return 'beginner';
  if (score <= TIER_CUTOFFS.advanced) return 'intermediate';
  return 'advanced';
}

/** Everything derived from an assessment. Pure. */
export function assess(a: Assessment): AssessmentResult {
  const bmi = computeBmi(a.weightKg, a.heightCm);
  return {
    bmi,
    bmiCategory: bmiCategory(bmi),
    tier: assessTier(a),
    benchmarkScore: benchmarkScore(a),
    daysPerWeek: GOAL_DAYS[a.goal],
  };
}

// ── Generation ───────────────────────────────────────────

interface GoalModifier {
  setsDelta: number;
  /** Apply `setsDelta` to the first exercise of the day only. */
  firstOnly: boolean;
  repsFactor: number;
  holdFactor: number;
  restDelta: number;
  addCoreFinisher: boolean;
}

const GOAL_MODIFIERS: Record<TrainingGoal, GoalModifier> = {
  strength: { setsDelta: 1, firstOnly: true, repsFactor: 0.6, holdFactor: 1.0, restDelta: 30, addCoreFinisher: false },
  hypertrophy: { setsDelta: 1, firstOnly: false, repsFactor: 1.15, holdFactor: 1.15, restDelta: -15, addCoreFinisher: false },
  mastery: { setsDelta: 0, firstOnly: false, repsFactor: 0.8, holdFactor: 1.3, restDelta: 0, addCoreFinisher: false },
  fat_loss: { setsDelta: 0, firstOnly: false, repsFactor: 1.3, holdFactor: 1.2, restDelta: -30, addCoreFinisher: true },
};

function buildBase(level: FitnessLevel, split: Exclude<Split, 'rest'>): PlannedExercise[] {
  return PROGRESSION[level][split].map((entry) => {
    const move = moveBySlug.get(entry.slug);
    if (!move) throw new Error(`Unknown exercise slug: ${entry.slug}`);
    return {
      exerciseId: move.id,
      sets: entry.sets,
      targetReps: entry.reps,
      targetHoldSeconds: entry.holdSeconds,
      restSeconds: entry.restSeconds,
    };
  });
}

function applyGoal(exercises: PlannedExercise[], mod: GoalModifier): PlannedExercise[] {
  return exercises.map((ex, i) => {
    const setsDelta = mod.firstOnly ? (i === 0 ? mod.setsDelta : 0) : mod.setsDelta;
    return {
      ...ex,
      sets: clamp(ex.sets + setsDelta, RANGES.sets),
      targetReps:
        ex.targetReps == null ? null : clamp(Math.round(ex.targetReps * mod.repsFactor), RANGES.reps),
      targetHoldSeconds:
        ex.targetHoldSeconds == null
          ? null
          : clamp(Math.round(ex.targetHoldSeconds * mod.holdFactor), RANGES.hold),
      restSeconds: clamp(ex.restSeconds + mod.restDelta, RANGES.rest),
    };
  });
}

/** Protect joints on higher BMI; encourage mass on lower. Applied after the goal pass. */
function applyBmiNudge(
  exercises: PlannedExercise[],
  category: BmiCategory,
  split: Exclude<Split, 'rest'>,
): PlannedExercise[] {
  if (category === 'overweight' || category === 'obese') {
    return exercises.map((ex) => ({
      ...ex,
      targetReps: ex.targetReps == null ? null : Math.min(ex.targetReps, 20),
      restSeconds: clamp(ex.restSeconds + 15, RANGES.rest),
    }));
  }
  if (category === 'underweight' && split === 'pull') {
    return exercises.map((ex) => ({ ...ex, sets: clamp(ex.sets + 1, RANGES.sets) }));
  }
  return exercises;
}

function coreFinisher(tier: FitnessLevel, taken: Set<string>): PlannedExercise | null {
  const move = MOVES.filter(
    (m) => m.muscleGroup === 'core' && levelRank[m.difficulty] <= levelRank[tier] && !taken.has(m.id),
  ).sort((a, b) => levelRank[b.difficulty] - levelRank[a.difficulty])[0];
  if (!move) return null;
  return {
    exerciseId: move.id,
    sets: 2,
    targetReps: move.measure === 'reps' ? 15 : null,
    targetHoldSeconds: move.measure === 'hold' ? 30 : null,
    restSeconds: 30,
    noteKey: 'plan:cue.finisher',
  };
}

export interface GeneratePlanArgs {
  userId: UserId;
  assessment: Assessment;
  /** Injectable for deterministic tests. */
  now?: () => string;
  planId?: string;
}

/**
 * Assessment → WorkoutPlan. Derives tier + weekly frequency, runs the shared
 * progression/split tables, then applies a goal-modifier pass and a BMI nudge.
 * The output shape is identical to the legacy generator's.
 */
export function generatePlan({
  userId,
  assessment,
  now = nowIso,
  planId = crypto.randomUUID(),
}: GeneratePlanArgs): WorkoutPlan {
  const result = assess(assessment);
  const mod = GOAL_MODIFIERS[assessment.goal];
  const template = SPLIT_TEMPLATES[result.daysPerWeek];

  const days: PlanDay[] = template.map((split, i) => {
    const dayIndex = i as PlanDay['dayIndex'];
    if (split === 'rest') return { dayIndex, split, exercises: [] };

    let exercises = applyBmiNudge(
      applyGoal(buildBase(result.tier, split), mod),
      result.bmiCategory,
      split,
    );

    if (mod.addCoreFinisher && split !== 'core') {
      const finisher = coreFinisher(result.tier, new Set(exercises.map((e) => e.exerciseId)));
      if (finisher) exercises = [...exercises, finisher];
    }

    return { dayIndex, split, exercises };
  });

  return {
    id: asId(planId),
    userId,
    level: result.tier,
    daysPerWeek: result.daysPerWeek,
    generatedAt: now() as WorkoutPlan['generatedAt'],
    archivedAt: null,
    days,
  };
}

export interface PlanFromProfileArgs {
  userId: UserId;
  level: FitnessLevel;
  daysPerWeek: 3 | 4 | 5 | 6;
  now?: () => string;
  planId?: string;
}

/** Neutral fallback when no assessment exists — no goal or BMI shaping. */
export function planFromProfile({
  userId,
  level,
  daysPerWeek,
  now = nowIso,
  planId = crypto.randomUUID(),
}: PlanFromProfileArgs): WorkoutPlan {
  const template = SPLIT_TEMPLATES[daysPerWeek];
  const days: PlanDay[] = template.map((split, i) => ({
    dayIndex: i as PlanDay['dayIndex'],
    split,
    exercises: split === 'rest' ? [] : buildBase(level, split),
  }));

  return {
    id: asId(planId),
    userId,
    level,
    daysPerWeek,
    generatedAt: now() as WorkoutPlan['generatedAt'],
    archivedAt: null,
    days,
  };
}
