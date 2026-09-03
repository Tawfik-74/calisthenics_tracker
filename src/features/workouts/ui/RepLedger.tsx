import { useTranslation } from 'react-i18next';
import { formatNumber } from '@/shared/lib/formatters';
import { exerciseName } from '@/features/plan';
import { useSessionStore, selectTotalReps, selectTotalSets, selectTotalHold } from '../model/sessionStore';

/**
 * The signature element: a running tally pinned on screen. Every completed set
 * stamps a row. Everything else in the app stays quiet so this can be loud.
 */
export function RepLedger() {
  const { t, i18n } = useTranslation(['workouts', 'plan']);
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en';

  const exercises = useSessionStore((s) => s.session?.exercises ?? []);
  const totalReps = useSessionStore(selectTotalReps);
  const totalSets = useSessionStore(selectTotalSets);
  const totalHold = useSessionStore(selectTotalHold);

  const rows = exercises.flatMap((e) =>
    e.sets.map((set) => ({ key: set.id, exerciseId: e.exerciseId, set })),
  );

  return (
    <aside className="sticky top-3 flex flex-col gap-3 rounded-[10px] border border-[var(--color-line)] bg-[var(--color-raised)] p-4">
      <div className="flex items-baseline justify-between">
        <span className="eyebrow">{t('ledger.banked')}</span>
        <span className="font-numeric text-hero font-semibold leading-none tabular-nums text-[var(--color-banked)]">
          {formatNumber(totalReps, locale)}
        </span>
      </div>
      <div className="flex gap-4 text-xs text-[var(--color-steel)]">
        <span>{t('ledger.sets', { count: totalSets })}</span>
        {totalHold > 0 && <span>{formatNumber(totalHold, locale)}{t('unit.sec')} {t('ledger.hold')}</span>}
      </div>

      <ol className="flex max-h-64 flex-col gap-1 overflow-y-auto text-sm">
        {rows.length === 0 && (
          <li className="text-[var(--color-steel)]">{t('ledger.empty')}</li>
        )}
        {rows.map(({ key, exerciseId, set }) => (
          <li key={key} className="flex items-center justify-between gap-2 tabular-nums">
            <span className="truncate text-[var(--color-steel)]">{exerciseName(t, exerciseId)}</span>
            <span className="font-numeric font-semibold">
              {set.reps != null
                ? formatNumber(set.reps, locale)
                : `${formatNumber(set.holdSeconds ?? 0, locale)}${t('unit.sec')}`}
            </span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
