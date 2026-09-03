import { supabase } from '@/shared/lib/supabase';
import type { UserId } from '@/shared/types/ids';
import type { FitnessLevel } from '@/features/auth';
import type { WorkoutPlan } from '../model/plan.types';
import { workoutPlanSchema } from '../model/plan.schema';
import { generatePlan } from '../lib/generatePlan';

const STORE_KEY = 'ct.plan';

export const planApi = {
  async getCurrent(userId: UserId, level: FitnessLevel, daysPerWeek: 3 | 4 | 5 | 6): Promise<WorkoutPlan> {
    if (!supabase) {
      const cached = localStorage.getItem(STORE_KEY);
      if (cached) {
        const parsed = workoutPlanSchema.safeParse(JSON.parse(cached));
        if (parsed.success) return parsed.data as unknown as WorkoutPlan;
      }
      const plan = generatePlan({ userId, level, daysPerWeek });
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

  async regenerate(userId: UserId, level: FitnessLevel, daysPerWeek: 3 | 4 | 5 | 6): Promise<WorkoutPlan> {
    const plan = generatePlan({ userId, level, daysPerWeek });
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
};
