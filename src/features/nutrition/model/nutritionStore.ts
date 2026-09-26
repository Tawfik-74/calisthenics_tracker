import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { z } from 'zod';
import { nutritionApi } from '../api/nutritionApi';
import type { LoggedMeal, NutritionEntryInput, Recipe } from './nutrition.types';

interface NutritionState {
  calorieAdjustment: number;
  recipes: Recipe[];
  meals: LoggedMeal[];
  hydrate: (userId: string) => Promise<void>;
  setCalorieAdjustment: (calories: number, userId?: string) => void;
  addRecipe: (input: NutritionEntryInput, userId?: string) => void;
  logMeal: (input: NutritionEntryInput, date: string, userId?: string) => void;
  removeMeal: (id: string, userId?: string) => void;
}

const macros = {
  calories: z.number().int().min(0).max(10000),
  protein: z.number().min(0).max(1000),
  carbs: z.number().min(0).max(2000),
  fats: z.number().min(0).max(1000),
};
const recipeSchema = z.object({ id: z.string().uuid(), name: z.string().min(1).max(80), ...macros });
const persistedSchema = z.object({
  calorieAdjustment: z.number().int().min(-500).max(500),
  recipes: z.array(recipeSchema),
  meals: z.array(recipeSchema.extend({ date: z.string().date() })),
});

export const useNutritionStore = create<NutritionState>()(
  persist(
    (set) => ({
      calorieAdjustment: 0,
      recipes: [],
      meals: [],
      hydrate: async (userId) => {
        try {
          const remote = await nutritionApi.load(userId);
          if (remote) set(remote);
        } catch {
          // Keep the persisted offline copy and retry next mount.
        }
      },
      setCalorieAdjustment: (calories, userId) => {
        const calorieAdjustment = Math.max(-500, Math.min(500, Math.round(calories)));
        set({ calorieAdjustment });
        if (userId) void nutritionApi.saveAdjustment(userId, calorieAdjustment).catch(() => undefined);
      },
      addRecipe: (input, userId) => {
        const recipe = { ...input, id: crypto.randomUUID() };
        set((state) => ({ recipes: [...state.recipes, recipe] }));
        if (userId) void nutritionApi.saveRecipe(userId, recipe).catch(() => undefined);
      },
      logMeal: (input, date, userId) => {
        const meal = { ...input, id: crypto.randomUUID(), date };
        set((state) => ({ meals: [meal, ...state.meals].slice(0, 500) }));
        if (userId) void nutritionApi.saveMeal(userId, meal).catch(() => undefined);
      },
      removeMeal: (id, userId) => {
        set((state) => ({ meals: state.meals.filter((meal) => meal.id !== id) }));
        if (userId) void nutritionApi.deleteMeal(userId, id).catch(() => undefined);
      },
    }),
    {
      name: 'ct.nutrition',
      storage: createJSONStorage(() => localStorage),
      partialize: ({ calorieAdjustment, recipes, meals }) => ({ calorieAdjustment, recipes, meals }),
      merge: (persisted, current) => {
        const parsed = persistedSchema.safeParse(persisted);
        return parsed.success ? { ...current, ...parsed.data } : current;
      },
    },
  ),
);
