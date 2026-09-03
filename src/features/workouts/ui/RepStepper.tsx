import { NumberStepper } from '@/shared/ui';
import { useTranslation } from 'react-i18next';

export function RepStepper({
  measure,
  value,
  onChange,
}: {
  measure: 'reps' | 'hold';
  value: number;
  onChange: (n: number) => void;
}) {
  const { t } = useTranslation('workouts');
  return (
    <NumberStepper
      label={measure === 'reps' ? t('label.reps') : t('label.hold')}
      value={value}
      onChange={onChange}
      min={0}
      max={measure === 'reps' ? 100 : 300}
      step={measure === 'reps' ? 1 : 5}
      suffix={measure === 'reps' ? t('unit.reps') : t('unit.sec')}
    />
  );
}
