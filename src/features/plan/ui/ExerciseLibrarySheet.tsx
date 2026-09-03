import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sheet } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import type { FitnessLevel } from '@/features/auth';
import { MOVES, type Move, type MuscleGroup } from '../lib/moves';
import { MoveCard } from './MoveCard';

const GROUPS: MuscleGroup[] = ['push', 'pull', 'legs', 'core'];
const LEVELS: FitnessLevel[] = ['beginner', 'intermediate', 'advanced'];

export function ExerciseLibrarySheet({
  open,
  onClose,
  onPick,
  lockGroup,
}: {
  open: boolean;
  onClose: () => void;
  onPick?: (move: Move) => void;
  lockGroup?: MuscleGroup;
}) {
  const { t } = useTranslation('plan');
  const [group, setGroup] = useState<MuscleGroup | 'all'>('all');
  const [level, setLevel] = useState<FitnessLevel | 'all'>('all');

  const effectiveGroup = lockGroup ?? group;
  const moves = MOVES.filter(
    (m) =>
      (effectiveGroup === 'all' || m.muscleGroup === effectiveGroup) &&
      (level === 'all' || m.difficulty === level),
  );

  return (
    <Sheet open={open} onClose={onClose} title={onPick ? t('library.swap_title') : t('library.title')}>
      <div className="flex flex-col gap-3">
        {!lockGroup && (
          <FilterRow
            label={t('library.filter.group')}
            options={['all', ...GROUPS]}
            value={group}
            onChange={(v) => setGroup(v as MuscleGroup | 'all')}
            render={(o) => (o === 'all' ? t('library.all') : t(`muscle.${o}`))}
          />
        )}
        <FilterRow
          label={t('library.filter.difficulty')}
          options={['all', ...LEVELS]}
          value={level}
          onChange={(v) => setLevel(v as FitnessLevel | 'all')}
          render={(o) => (o === 'all' ? t('library.all') : t(`difficulty.${o}`))}
        />

        <ul className="flex max-h-[52vh] flex-col gap-2 overflow-y-auto">
          {moves.map((move) => (
            <li key={move.slug}>
              <MoveCard
                move={move}
                onPick={
                  onPick
                    ? (picked) => {
                        onPick(picked);
                        onClose();
                      }
                    : undefined
                }
              />
            </li>
          ))}
          {moves.length === 0 && (
            <li className="text-sm text-[var(--color-steel)]">{t('library.empty')}</li>
          )}
        </ul>
      </div>
    </Sheet>
  );
}

function FilterRow({
  label,
  options,
  value,
  onChange,
  render,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (value: string) => void;
  render: (option: string) => string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="eyebrow">{label}</span>
      <div className="flex flex-wrap gap-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onChange(option)}
            className={cn(
              'min-h-[36px] rounded-full border px-3 text-xs font-semibold',
              value === option
                ? 'border-[var(--color-effort)] bg-[var(--color-effort)]/10 text-[var(--color-effort-ink)]'
                : 'border-[var(--color-line)] text-[var(--color-steel)]',
            )}
          >
            {render(option)}
          </button>
        ))}
      </div>
    </div>
  );
}
