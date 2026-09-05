import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import type { SkillId } from '../model/skill.types';
import { SKILL_TREE } from '../lib/skillTree';

export function SkillTargetGrid({
  value,
  onChange,
}: {
  value: SkillId | null;
  onChange: (next: SkillId | null) => void;
}) {
  const { t } = useTranslation('plan');

  return (
    <div role="radiogroup" aria-label={t('wizard.skill_target')} className="grid gap-2 sm:grid-cols-2">
      {SKILL_TREE.map((skill) => {
        const active = skill.id === value;
        return (
          <button
            key={skill.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(active ? null : skill.id)}
            className={cn(
              'flex min-h-[64px] flex-col justify-center rounded-[12px] border px-4 py-3 text-start transition-colors',
              active
                ? 'border-[var(--color-effort)] bg-[var(--color-effort)]/10'
                : 'border-[var(--color-line)] hover:bg-[var(--color-hover)]',
            )}
          >
            <span
              className={cn(
                'text-sm font-bold',
                active ? 'text-[var(--color-effort-ink)]' : 'text-[var(--color-ink)]',
              )}
            >
              {t(`skill.name.${skill.id}`)}
            </span>
            <span className="mt-0.5 text-xs text-[var(--color-steel)]">
              {t(`difficulty.${skill.difficulty}`)} ·{' '}
              {skill.muscleGroups.map((g) => t(`muscle.${g}`)).join(' / ')}
            </span>
          </button>
        );
      })}
    </div>
  );
}
