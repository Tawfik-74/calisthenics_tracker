import { supabase } from '@/shared/lib/supabase';
import type { LoggedMeal, Recipe } from '../model/nutrition.types';

export const nutritionApi = {
  async load(userId: string): Promise<{ recipes: Recipe[]; meals: LoggedMeal[]; calorieAdjustment: number } | null> {
    if (!supabase) return null;
    const [{ data: recipes, error: recipeError }, { data: meals, error: mealError }, { data: settings, error: settingsError }] = await Promise.all([
      supabase.from('nutrition_recipes').select('id,name,calories,protein,carbs,fats').eq('user_id', userId),
      supabase.from('nutrition_meals').select('id,name,logged_on,calories,protein,carbs,fats').eq('user_id', userId).order('logged_on', { ascending: false }).limit(200),
      supabase.from('nutrition_settings').select('calorie_adjustment').eq('user_id', userId).maybeSingle(),
    ]);
    if (recipeError || mealError || settingsError) throw recipeError ?? mealError ?? settingsError;
    return {
      recipes: (recipes ?? []).map((row) => ({ ...row, protein: Number(row.protein), carbs: Number(row.carbs), fats: Number(row.fats) })),
      meals: (meals ?? []).map((row) => ({ id: row.id, name: row.name, date: row.logged_on, calories: row.calories, protein: Number(row.protein), carbs: Number(row.carbs), fats: Number(row.fats) })),
      calorieAdjustment: settings?.calorie_adjustment ?? 0,
    };
  },
  async saveRecipe(userId: string, recipe: Recipe) {
    if (!supabase) return;
    const { error } = await supabase.from('nutrition_recipes').upsert({ ...recipe, user_id: userId });
    if (error) throw error;
  },
  async saveMeal(userId: string, meal: LoggedMeal) {
    if (!supabase) return;
    const { date, ...rest } = meal;
    const { error } = await supabase.from('nutrition_meals').upsert({ ...rest, logged_on: date, user_id: userId });
    if (error) throw error;
  },
  async deleteMeal(userId: string, mealId: string) {
    if (!supabase) return;
    const { error } = await supabase.from('nutrition_meals').delete().eq('id', mealId).eq('user_id', userId);
    if (error) throw error;
  },
  async saveAdjustment(userId: string, calorieAdjustment: number) {
    if (!supabase) return;
    const { error } = await supabase.from('nutrition_settings').upsert({ user_id: userId, calorie_adjustment: calorieAdjustment });
    if (error) throw error;
  },
};
