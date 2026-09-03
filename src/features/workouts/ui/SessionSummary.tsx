import { useTranslation } from 'react-i18next';
import { Card } from '@/shared/ui';
import { formatNumber } from '@/shared/lib/formatters';
import { secondsToClock } from '@/shared/lib/dates';
import type { FinishSessionInput } from '../model/session.schema';

export function SessionSummary({ session }: { session: FinishSessionInput }) {
  const { t, i18n } = useTranslation('workouts');
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en';

  const allSets = session.exercises.flatMap((e) => e.sets);
  const totalReps = allSets.reduce((a, s) => a + (s.reps ?? 0), 0);
  const totalHold = allSets.reduce((a, s) => a + (s.holdSeconds ?? 0), 0);
  const durationMin = Math.round(
    (new Date(session.finishedAt).getTime() - new Date(session.startedAt).getTime()) / 60000,
  );

  return (
    <Card className="flex flex-col gap-4">
      <h2 className="font-display text-xl font-bold">{t('summary.title')}</h2>
      <div className="grid grid-cols-3 gap-3 text-center">
        <Stat label={t('summary.reps')} value={formatNumber(totalReps, locale)} />
        <Stat label={t('summary.sets')} value={formatNumber(allSets.length, locale)} />
        <Stat
          label={t('summary.time')}
          value={totalHold > 0 ? secondsToClock(totalHold) : `${formatNumber(durationMin, locale)}′`}
        />
      </div>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="font-numeric text-xl font-semibold tabular-nums text-[var(--color-banked)]">
        {value}
      </span>
      <span className="eyebrow">{label}</span>
    </div>
  );
}
