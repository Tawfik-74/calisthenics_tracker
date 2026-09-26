import type { ActivityLevel, NutritionGoal, NutritionProfile } from '@/shared/types/profile';

export interface MacroTargets {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
};

const GOAL_MULTIPLIERS: Record<NutritionGoal, number> = {
  lean_bulk: 1.12,
  recomposition: 1,
  fat_loss: 0.82,
  maintenance: 1,
};

/** Mifflin-St Jeor estimate for adults. */
export function calculateBmr(
  profile: Pick<NutritionProfile, 'heightCm' | 'weightKg' | 'age' | 'sex'>,
): number {
  const sexOffset = profile.sex === 'male' ? 5 : -161;
  return Math.round(10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age + sexOffset);
}

export function calculateTdee(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_MULTIPLIERS[activityLevel]);
}

export function calculateDailyTargets(profile: NutritionProfile): MacroTargets {
  const estimatedCalories = Math.round(
    calculateTdee(calculateBmr(profile), profile.activityLevel) * GOAL_MULTIPLIERS[profile.nutritionGoal],
  );
  const protein = Math.round(profile.weightKg * 2);
  const fats = Math.max(
    Math.round(profile.weightKg * 0.9),
    Math.ceil((estimatedCalories * 0.2) / 9),
  );
  const macroMinimum = protein * 4 + fats * 9;
  const calories = Math.max(estimatedCalories, macroMinimum);
  const carbs = Math.max(0, Math.round((calories - macroMinimum) / 4));

  return { calories, protein, carbs, fats };
}

export function applyCalorieAdjustment(targets: MacroTargets, adjustment: number): MacroTargets {
  return {
    ...targets,
    calories: Math.max(targets.protein * 4 + targets.fats * 9, targets.calories + adjustment),
    carbs: Math.max(0, targets.carbs + Math.round(adjustment / 4)),
  };
}
