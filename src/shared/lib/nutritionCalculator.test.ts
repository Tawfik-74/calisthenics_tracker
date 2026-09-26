import { describe, expect, it } from 'vitest';
import { applyCalorieAdjustment, calculateBmr, calculateDailyTargets, calculateTdee } from './nutritionCalculator';

describe('nutrition calculator', () => {
  it('calculates Mifflin-St Jeor estimates for both equation sexes', () => {
    expect(calculateBmr({ weightKg: 73, heightCm: 178, age: 28, sex: 'male' })).toBe(1708);
    expect(calculateBmr({ weightKg: 60, heightCm: 165, age: 30, sex: 'female' })).toBe(1320);
  });

  it('applies activity and goal adjustments', () => {
    expect(calculateTdee(1708, 'moderately_active')).toBe(2647);
    expect(
      calculateDailyTargets({
        weightKg: 73,
        heightCm: 178,
        age: 28,
        sex: 'male',
        activityLevel: 'moderately_active',
        nutritionGoal: 'lean_bulk',
      }),
    ).toEqual({ calories: 2965, protein: 146, carbs: 447, fats: 66 });
  });

  it('never returns negative carbohydrates', () => {
    const result = calculateDailyTargets({
      weightKg: 250,
      heightCm: 120,
      age: 100,
      sex: 'female',
      activityLevel: 'sedentary',
      nutritionGoal: 'fat_loss',
    });
    expect(result.carbs).toBe(0);
    expect(result.calories).toBe(result.protein * 4 + result.fats * 9);
  });

  it('puts manual calorie adjustments into carbohydrates', () => {
    expect(applyCalorieAdjustment({ calories: 2000, protein: 150, carbs: 200, fats: 67 }, 200))
      .toEqual({ calories: 2200, protein: 150, carbs: 250, fats: 67 });
  });
});
