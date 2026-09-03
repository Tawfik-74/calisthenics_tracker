import { useTranslation } from 'react-i18next';
import { Button, Card, Tag } from '@/shared/ui';
import { formatNumber } from '@/shared/lib/formatters';
import type { Move } from '../lib/moves';

export function MoveCard({ move, onPick }: { move: Move; onPick?: (m: Move) => void }) {
  const { t, i18n } = useTranslation('plan');
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en';

  const prescription =
    move.measure === 'reps'
      ? `${formatNumber(move.defaultSets, locale)}×${formatNumber(move.defaultReps ?? 0, locale)}`
      : `${formatNumber(move.defaultSets, locale)}×${formatNumber(
          move.defaultHoldSeconds ?? 0,
          locale,
        )}${t('unit.sec')}`;

  return (
    <Card className="flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium">{t(move.nameKey)}</span>
        <span className="font-numeric text-sm text-[var(--color-steel)]">{prescription}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Tag tone="neutral">{t(`muscle.${move.muscleGroup}`)}</Tag>
        <Tag tone="neutral">{t(`difficulty.${move.difficulty}`)}</Tag>
      </div>
      <ul className="flex flex-col gap-1 text-xs text-[var(--color-steel)]">
        {move.cueKeys.map((key) => (
          <li key={key}>• {t(key)}</li>
        ))}
      </ul>
      {onPick && (
        <Button size="md" variant="quiet" onClick={() => onPick(move)}>
          {t('library.choose')}
        </Button>
      )}
    </Card>
  );
}
