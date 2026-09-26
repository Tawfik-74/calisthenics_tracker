export type Sex = 'male' | 'female';

export type ActivityLevel =
  | 'sedentary'
  | 'lightly_active'
  | 'moderately_active'
  | 'very_active';

export type NutritionGoal = 'lean_bulk' | 'recomposition' | 'fat_loss' | 'maintenance';

export type EquipmentType =
  | 'pull_up_bar'
  | 'floor_bar'
  | 'dip_bars'
  | 'dumbbells'
  | 'barbell'
  | 'bench'
  | 'resistance_bands'
  | 'backpack';

export interface NutritionProfile {
  heightCm: number;
  weightKg: number;
  age: number;
  sex: Sex;
  activityLevel: ActivityLevel;
  nutritionGoal: NutritionGoal;
}
