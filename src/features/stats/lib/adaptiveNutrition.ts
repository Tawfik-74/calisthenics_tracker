import type { NutritionGoal } from '@/shared/types/profile';

export interface WeighIn {
  date: string;
  weightKg: number;
}

export interface NutritionAdjustment {
  needsAdjustment: boolean;
  suggestedDeltaCalories: number;
  weeklyChangePercent: number | null;
  reason: 'insufficient_data' | 'on_track' | 'gain_stalled' | 'loss_stalled';
}

const average = (values: number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;

/** Compares two seven-day averages; returns a suggestion and never applies it. */
export function checkWeightProgression(
  weighIns: WeighIn[],
  goal: NutritionGoal,
): NutritionAdjustment {
  const valid = weighIns
    .filter((entry) => Number.isFinite(entry.weightKg) && !Number.isNaN(Date.parse(entry.date)))
    .sort((a, b) => Date.parse(a.date) - Date.parse(b.date));
  if (valid.length < 8) {
    return { needsAdjustment: false, suggestedDeltaCalories: 0, weeklyChangePercent: null, reason: 'insufficient_data' };
  }

  const lastDate = Date.parse(valid.at(-1)!.date);
  const firstDate = lastDate - 13 * 86_400_000;
  const recent = valid.filter((entry) => Date.parse(entry.date) >= firstDate);
  const firstWeek = recent.filter((entry) => Date.parse(entry.date) < firstDate + 7 * 86_400_000);
  const secondWeek = recent.filter((entry) => Date.parse(entry.date) >= firstDate + 7 * 86_400_000);
  if (firstWeek.length < 4 || secondWeek.length < 4) {
    return { needsAdjustment: false, suggestedDeltaCalories: 0, weeklyChangePercent: null, reason: 'insufficient_data' };
  }

  const baseline = average(firstWeek.map((entry) => entry.weightKg));
  const latest = average(secondWeek.map((entry) => entry.weightKg));
  const weeklyChangePercent = Math.round(((latest - baseline) / baseline) * 1000) / 10;

  if (goal === 'lean_bulk' && weeklyChangePercent < 0.25) {
    return { needsAdjustment: true, suggestedDeltaCalories: 200, weeklyChangePercent, reason: 'gain_stalled' };
  }
  if (goal === 'fat_loss' && weeklyChangePercent > -0.5) {
    return { needsAdjustment: true, suggestedDeltaCalories: -150, weeklyChangePercent, reason: 'loss_stalled' };
  }
  return { needsAdjustment: false, suggestedDeltaCalories: 0, weeklyChangePercent, reason: 'on_track' };
}
