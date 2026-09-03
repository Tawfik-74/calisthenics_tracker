import { supabase } from '@/shared/lib/supabase';
import type { UserId } from '@/shared/types/ids';
import type { FitnessLevel } from '@/features/auth';
import type { WorkoutPlan } from '../model/plan.types';
import { workoutPlanSchema } from '../model/plan.schema';
import type { Assessment } from '../model/assessment.types';
import { persistedAssessmentSchema } from '../model/assessment.schema';
import { generatePlan, planFromProfile } from '../lib/planGenerator';

const STORE_KEY = 'ct.plan';
const ASSESSMENT_KEY = 'ct.assessment';

/** Reads the persisted assessment without importing the React store. */
function readAssessment(): Assessment | null {
  try {
    const raw = localStorage.getItem(ASSESSMENT_KEY);
    if (!raw) return null;
    const state = (JSON.parse(raw) as { state?: unknown })?.state;
    const parsed = persistedAssessmentSchema.safeParse(state);
    return parsed.success ? (parsed.data.assessment as Assessment | null) : null;
  } catch {
    return null;
  }
}

/** Assessment-driven plan when one exists, otherwise a neutral profile plan. */
function localPlan(userId: UserId, level: FitnessLevel, daysPerWeek: 3 | 4 | 5 | 6): WorkoutPlan {
  const assessment = readAssessment();
  return assessment
    ? generatePlan({ userId, assessment })
    : planFromProfile({ userId, level, daysPerWeek });
}

export const planApi = {
  async getCurrent(
    userId: UserId,
    level: FitnessLevel,
    daysPerWeek: 3 | 4 | 5 | 6,
  ): Promise<WorkoutPlan> {
    if (!supabase) {
      const cached = localStorage.getItem(STORE_KEY);
      if (cached) {
        const parsed = workoutPlanSchema.safeParse(JSON.parse(cached));
        if (parsed.success) return parsed.data as unknown as WorkoutPlan;
      }
      const plan = localPlan(userId, level, daysPerWeek);
      localStorage.setItem(STORE_KEY, JSON.stringify(plan));
      return plan;
    }

    const { data } = await supabase
      .from('workout_plans')
      .select('*')
      .eq('user_id', userId)
      .is('archived_at', null)
      .maybeSingle();

    if (data) {
      const parsed = workoutPlanSchema.safeParse(data);
      if (parsed.success) return parsed.data as unknown as WorkoutPlan;
    }
    return planApi.regenerate(userId, level, daysPerWeek);
  },

  async regenerate(
    userId: UserId,
    level: FitnessLevel,
    daysPerWeek: 3 | 4 | 5 | 6,
  ): Promise<WorkoutPlan> {
    const plan = localPlan(userId, level, daysPerWeek);
    if (!supabase) {
      localStorage.setItem(STORE_KEY, JSON.stringify(plan));
      return plan;
    }
    await supabase
      .from('workout_plans')
      .update({ archived_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('archived_at', null);
    await supabase.from('workout_plans').insert(plan);
    return plan;
  },

  /** Persists a user-edited plan in place. */
  async savePlan(userId: UserId, plan: WorkoutPlan): Promise<WorkoutPlan> {
    if (!supabase) {
      localStorage.setItem(STORE_KEY, JSON.stringify(plan));
      return plan;
    }
    await supabase
      .from('workout_plans')
      .update({ days: plan.days })
      .eq('id', plan.id)
      .eq('user_id', userId);
    return plan;
  },
};
