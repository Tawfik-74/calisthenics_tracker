import { describe, expect, it } from 'vitest';
import { sumMacros } from './nutrition.types';

describe('sumMacros', () => {
  it('totals logged nutrition', () => {
    expect(sumMacros([
      { calories: 500, protein: 30, carbs: 60, fats: 15 },
      { calories: 250, protein: 20, carbs: 25, fats: 8 },
    ])).toEqual({ calories: 750, protein: 50, carbs: 85, fats: 23 });
  });
});
