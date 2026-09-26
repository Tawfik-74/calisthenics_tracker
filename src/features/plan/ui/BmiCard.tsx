import { useTranslation } from 'react-i18next';
import { Button, Card, Tag } from '@/shared/ui';
import type { Assessment, AssessmentResult, BmiCategory } from '../model/assessment.types';
import { applyCalorieAdjustment, calculateBmr, calculateDailyTargets, calculateTdee } from '@/shared/lib/nutritionCalculator';

const CATEGORY_TONE: Record<BmiCategory, 'neutral' | 'banked'> = {
  underweight: 'neutral',
  normal: 'banked',
  overweight: 'neutral',
  obese: 'neutral',
};

export function BmiCard({
  assessment,
  result,
  onRetake,
  calorieAdjustment = 0,
}: {
  assessment: Assessment;
  result: AssessmentResult;
  onRetake: () => void;
  calorieAdjustment?: number;
}) {
  const { t, i18n } = useTranslation('plan');
  const nf = new Intl.NumberFormat(i18n.language.startsWith('ar') ? 'ar-EG' : 'en-US', {
    numberingSystem: 'latn',
    maximumFractionDigits: 1,
  });
  const int = new Intl.NumberFormat(i18n.language.startsWith('ar') ? 'ar-EG' : 'en-US', {
    numberingSystem: 'latn',
    maximumFractionDigits: 0,
  });
  const bmr = calculateBmr(assessment);
  const tdee = calculateTdee(bmr, assessment.activityLevel);
  const targets = applyCalorieAdjustment(calculateDailyTargets(assessment), calorieAdjustment);

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="eyebrow">{t('bmi.label')}</p>
          <p className="font-numeric text-xl font-bold">{nf.format(result.bmi)}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Tag tone={CATEGORY_TONE[result.bmiCategory]}>{t(`bmi.category.${result.bmiCategory}`)}</Tag>
          <Tag tone="effort">{t(`tier.${result.tier}`)}</Tag>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
        <div>
          <dt className="text-[var(--color-steel)]">{t('goal.label')}</dt>
          <dd className="font-medium">{t(`goal.${assessment.goal}`)}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-steel)]">{t('bmi.score_label')}</dt>
          <dd className="font-numeric font-medium">{int.format(result.benchmarkScore)}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-steel)]">{t('bmi.tier_label')}</dt>
          <dd className="font-medium">{t(`tier.${result.tier}`)}</dd>
        </div>
        <div>
          <dt className="text-[var(--color-steel)]">{t('assessment.frequency')}</dt>
          <dd className="font-numeric font-medium">{int.format(result.daysPerWeek)}</dd>
        </div>
      </dl>

      <div className="border-t border-[var(--color-line)] pt-3">
        <p className="eyebrow">{t('nutrition.title')}</p>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-sm sm:grid-cols-4">
          <div>
            <dt className="text-[var(--color-steel)]">{t('nutrition.calories')}</dt>
            <dd className="font-numeric font-medium">{int.format(targets.calories)} kcal</dd>
          </div>
          <div>
            <dt className="text-[var(--color-steel)]">{t('nutrition.protein')}</dt>
            <dd className="font-numeric font-medium">{int.format(targets.protein)} g</dd>
          </div>
          <div>
            <dt className="text-[var(--color-steel)]">{t('nutrition.carbs')}</dt>
            <dd className="font-numeric font-medium">{int.format(targets.carbs)} g</dd>
          </div>
          <div>
            <dt className="text-[var(--color-steel)]">{t('nutrition.fats')}</dt>
            <dd className="font-numeric font-medium">{int.format(targets.fats)} g</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-[var(--color-steel)]">
          {t('nutrition.estimate', { bmr: int.format(bmr), tdee: int.format(tdee) })}
        </p>
      </div>

      <Button variant="quiet" onClick={onRetake}>
        {t('assessment.retake')}
      </Button>
    </Card>
  );
}
