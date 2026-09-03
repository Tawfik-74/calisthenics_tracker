import { useTranslation } from 'react-i18next';
import { Button, Card, Tag } from '@/shared/ui';
import type { Assessment, AssessmentResult, BmiCategory } from '../model/assessment.types';

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
}: {
  assessment: Assessment;
  result: AssessmentResult;
  onRetake: () => void;
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

      <Button variant="quiet" onClick={onRetake}>
        {t('assessment.retake')}
      </Button>
    </Card>
  );
}
