export interface Macros {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export interface Recipe extends Macros {
  id: string;
  name: string;
}

export interface LoggedMeal extends Recipe {
  date: string;
}

export type NutritionEntryInput = Omit<Recipe, 'id'>;
export const EMPTY_MACROS: Macros = { calories: 0, protein: 0, carbs: 0, fats: 0 };

export function sumMacros(entries: Macros[]): Macros {
  return entries.reduce(
    (total, entry) => ({
      calories: total.calories + entry.calories,
      protein: total.protein + entry.protein,
      carbs: total.carbs + entry.carbs,
      fats: total.fats + entry.fats,
    }),
    EMPTY_MACROS,
  );
}
