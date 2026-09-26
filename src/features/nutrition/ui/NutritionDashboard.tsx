import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, TextInput } from '@/shared/ui';
import type { MacroTargets } from '@/shared/lib/nutritionCalculator';
import { sumMacros, type NutritionEntryInput } from '../model/nutrition.types';
import { useNutritionStore } from '../model/nutritionStore';

const emptyEntry = (): NutritionEntryInput => ({ name: '', calories: 0, protein: 0, carbs: 0, fats: 0 });

function tone(consumed: number, target: number) {
  const ratio = target > 0 ? consumed / target : 0;
  if (ratio < 0.6 || ratio > 1.1) return 'var(--color-danger)';
  if (ratio < 0.9 || ratio > 1.05) return '#D97706';
  return '#16A34A';
}

function MacroGauge({ label, consumed, target, unit = 'g' }: { label: string; consumed: number; target: number; unit?: string }) {
  const progress = Math.min(100, Math.round((consumed / Math.max(1, target)) * 100));
  const color = tone(consumed, target);
  return (
    <div className="flex flex-col items-center gap-2 text-center">
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={consumed}
        aria-valuemax={target}
        className="grid h-24 w-24 place-items-center rounded-full"
        style={{ background: `conic-gradient(${color} ${progress}%, var(--color-line) 0)` }}
      >
        <div className="grid h-20 w-20 place-items-center rounded-full bg-[var(--color-raised)]">
          <span className="font-numeric text-sm font-bold">{Math.round(consumed)}/{Math.round(target)}{unit}</span>
        </div>
      </div>
      <span className="text-sm font-semibold">{label}</span>
    </div>
  );
}

export function NutritionDashboard({ userId, targets }: { userId: string; targets: MacroTargets }) {
  const { t } = useTranslation('nutrition');
  const recipes = useNutritionStore((state) => state.recipes);
  const meals = useNutritionStore((state) => state.meals);
  const hydrate = useNutritionStore((state) => state.hydrate);
  const addRecipe = useNutritionStore((state) => state.addRecipe);
  const logMeal = useNutritionStore((state) => state.logMeal);
  const removeMeal = useNutritionStore((state) => state.removeMeal);
  const [meal, setMeal] = useState(emptyEntry);
  const [recipe, setRecipe] = useState(emptyEntry);
  const today = new Date().toISOString().slice(0, 10);
  const todayMeals = useMemo(() => meals.filter((entry) => entry.date === today), [meals, today]);
  const consumed = useMemo(() => sumMacros(todayMeals), [todayMeals]);

  useEffect(() => { void hydrate(userId); }, [hydrate, userId]);

  const fields = ['calories', 'protein', 'carbs', 'fats'] as const;
  const inputs = (value: NutritionEntryInput, setValue: (entry: NutritionEntryInput) => void) => (
    <div className="grid gap-2 sm:grid-cols-5">
      <label className="flex flex-col gap-1 text-xs text-[var(--color-steel)]">
        {t('name')}
        <TextInput value={value.name} onChange={(event) => setValue({ ...value, name: event.target.value })} />
      </label>
      {fields.map((field) => (
        <label key={field} className="flex flex-col gap-1 text-xs text-[var(--color-steel)]">
          {t(field)}
          <TextInput type="number" min={0} max={field === 'calories' ? 10000 : 2000} value={value[field]} onChange={(event) => setValue({ ...value, [field]: Math.max(0, event.target.valueAsNumber || 0) })} />
        </label>
      ))}
    </div>
  );

  function submitMeal(event: FormEvent) {
    event.preventDefault();
    if (!meal.name.trim()) return;
    logMeal({ ...meal, name: meal.name.trim() }, today, userId);
    setMeal(emptyEntry());
  }

  function submitRecipe(event: FormEvent) {
    event.preventDefault();
    if (!recipe.name.trim()) return;
    addRecipe({ ...recipe, name: recipe.name.trim() }, userId);
    setRecipe(emptyEntry());
  }

  return (
    <Card className="flex flex-col gap-5">
      <div>
        <h2 className="font-display text-xl font-bold">{t('title')}</h2>
        <p className="text-sm text-[var(--color-steel)]">{t('subtitle')}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MacroGauge label={t('calories')} consumed={consumed.calories} target={targets.calories} unit="" />
        <MacroGauge label={t('protein')} consumed={consumed.protein} target={targets.protein} />
        <MacroGauge label={t('carbs')} consumed={consumed.carbs} target={targets.carbs} />
        <MacroGauge label={t('fats')} consumed={consumed.fats} target={targets.fats} />
      </div>

      <details>
        <summary className="cursor-pointer font-semibold">{t('quick_log')}</summary>
        <form className="mt-3 flex flex-col gap-3" onSubmit={submitMeal}>
          {inputs(meal, setMeal)}
          <Button type="submit" disabled={!meal.name.trim()}>{t('log')}</Button>
        </form>
      </details>

      <details>
        <summary className="cursor-pointer font-semibold">{t('recipes')}</summary>
        <form className="mt-3 flex flex-col gap-3" onSubmit={submitRecipe}>
          {inputs(recipe, setRecipe)}
          <Button type="submit" variant="quiet" disabled={!recipe.name.trim()}>{t('save_recipe')}</Button>
        </form>
        <ul className="mt-3 flex flex-col gap-2">
          {recipes.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <span>{item.name} · {item.calories} kcal</span>
              <Button size="md" variant="quiet" onClick={() => logMeal(item, today, userId)}>{t('log')}</Button>
            </li>
          ))}
        </ul>
      </details>

      <div>
        <h3 className="font-semibold">{t('today')}</h3>
        {todayMeals.length === 0 ? <p className="mt-2 text-sm text-[var(--color-steel)]">{t('empty')}</p> : (
          <ul className="mt-2 flex flex-col gap-2">
            {todayMeals.map((item) => (
              <li key={item.id} className="flex items-center justify-between gap-3 text-sm">
                <span>{item.name} · {item.calories} kcal · {item.protein}g P</span>
                <button className="text-xs text-[var(--color-danger)]" onClick={() => removeMeal(item.id, userId)}>{t('remove')}</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}
