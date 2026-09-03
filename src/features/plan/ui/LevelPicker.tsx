import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import type { FitnessLevel } from '@/features/auth';

const LEVELS: FitnessLevel[] = ['beginner', 'intermediate', 'advanced'];

export function LevelPicker({
  value,
  onChange,
}: {
  value: FitnessLevel;
  onChange: (level: FitnessLevel) => void;
}) {
  const { t } = useTranslation('plan');
  return (
    <div role="radiogroup" aria-label={t('level.label')} className="flex flex-col gap-2">
      {LEVELS.map((level) => (
        <button
          key={level}
          type="button"
          role="radio"
          aria-checked={value === level}
          onClick={() => onChange(level)}
          className={cn(
            'min-h-[48px] rounded-[10px] border px-4 text-start text-sm font-semibold',
            value === level
              ? 'border-[var(--color-effort)] bg-[var(--color-effort)]/10 text-[var(--color-effort-ink)]'
              : 'border-[var(--color-line)] text-[var(--color-ink)]',
          )}
        >
          {t(`level.${level}`)}
        </button>
      ))}
    </div>
  );
}
