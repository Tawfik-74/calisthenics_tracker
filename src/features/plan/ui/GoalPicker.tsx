import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import type { TrainingGoal } from '../model/assessment.types';

const GOALS: TrainingGoal[] = ['strength', 'hypertrophy', 'mastery', 'fat_loss'];

export function GoalPicker({
  value,
  onChange,
}: {
  value: TrainingGoal;
  onChange: (goal: TrainingGoal) => void;
}) {
  const { t } = useTranslation('plan');
  return (
    <div role="radiogroup" aria-label={t('goal.label')} className="grid gap-2 sm:grid-cols-2">
      {GOALS.map((goal) => (
        <button
          key={goal}
          type="button"
          role="radio"
          aria-checked={value === goal}
          onClick={() => onChange(goal)}
          className={cn(
            'min-h-[48px] rounded-[10px] border px-4 py-2 text-start text-sm font-semibold',
            value === goal
              ? 'border-[var(--color-effort)] bg-[var(--color-effort)]/10 text-[var(--color-effort-ink)]'
              : 'border-[var(--color-line)] text-[var(--color-ink)]',
          )}
        >
          <span className="block">{t(`goal.${goal}`)}</span>
          <span className="block text-xs font-normal text-[var(--color-steel)]">
            {t(`goal.${goal}_hint`)}
          </span>
        </button>
      ))}
    </div>
  );
}
