import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, TextInput } from '@/shared/ui';
import type { NutritionGoal } from '@/shared/types/profile';
import { checkWeightProgression } from '../lib/adaptiveNutrition';
import { useWeightStore } from '../model/weightStore';

export function WeightCheckInCard({
  goal,
  userId,
  defaultWeight,
  calorieAdjustment,
  onApplyAdjustment,
}: {
  goal: NutritionGoal;
  userId: string;
  defaultWeight: number;
  calorieAdjustment: number;
  onApplyAdjustment: (calories: number) => void;
}) {
  const { t } = useTranslation('stats');
  const weighIns = useWeightStore((state) => state.weighIns);
  const add = useWeightStore((state) => state.add);
  const hydrate = useWeightStore((state) => state.hydrate);
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [weight, setWeight] = useState(defaultWeight);
  const result = useMemo(() => checkWeightProgression(weighIns, goal), [goal, weighIns]);
  useEffect(() => { void hydrate(userId); }, [hydrate, userId]);

  return (
    <Card className="flex flex-col gap-4">
      <div>
        <h2 className="font-display text-lg font-bold">{t('weight.title')}</h2>
        <p className="text-sm text-[var(--color-steel)]">{t('weight.subtitle')}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
        <TextInput aria-label={t('weight.date')} type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        <TextInput
          aria-label={t('weight.kg')}
          type="number"
          inputMode="decimal"
          min={30}
          max={250}
          step="0.1"
          value={weight}
          onChange={(event) => setWeight(event.target.valueAsNumber)}
        />
        <Button disabled={!date || !Number.isFinite(weight) || weight < 30 || weight > 250} onClick={() => add({ date, weightKg: weight }, userId)}>
          {t('weight.save')}
        </Button>
      </div>
      <p className="text-sm text-[var(--color-steel)]">
        {t(`weight.result.${result.reason}`, { change: result.weeklyChangePercent ?? 0 })}
      </p>
      {result.needsAdjustment && calorieAdjustment !== result.suggestedDeltaCalories && (
        <Button onClick={() => onApplyAdjustment(result.suggestedDeltaCalories)}>
          {t('weight.apply', { calories: result.suggestedDeltaCalories })}
        </Button>
      )}
      {calorieAdjustment !== 0 && (
        <p className="text-xs text-[var(--color-steel)]">
          {t('weight.active_adjustment', { calories: calorieAdjustment })}
        </p>
      )}
    </Card>
  );
}
