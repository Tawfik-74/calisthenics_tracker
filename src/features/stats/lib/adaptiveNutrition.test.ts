import { describe, expect, it } from 'vitest';
import { checkWeightProgression, type WeighIn } from './adaptiveNutrition';

const series = (weights: number[]): WeighIn[] =>
  weights.map((weightKg, day) => ({
    date: new Date(Date.UTC(2026, 8, day + 1)).toISOString(),
    weightKg,
  }));

describe('checkWeightProgression', () => {
  it('waits for enough measurements across both weeks', () => {
    expect(checkWeightProgression(series([80, 80, 80]), 'lean_bulk').reason).toBe('insufficient_data');
  });

  it('suggests calories when a bulk is flat', () => {
    const result = checkWeightProgression(series(Array.from({ length: 14 }, () => 80)), 'lean_bulk');
    expect(result).toMatchObject({ needsAdjustment: true, suggestedDeltaCalories: 200, reason: 'gain_stalled' });
  });

  it('does not penalize fat loss that is on track', () => {
    const result = checkWeightProgression(
      series([80, 80, 80, 80, 80, 80, 80, 79.5, 79.5, 79.5, 79.5, 79.5, 79.5, 79.5]),
      'fat_loss',
    );
    expect(result.needsAdjustment).toBe(false);
    expect(result.reason).toBe('on_track');
  });
});
