import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, toast } from '@/shared/ui';
import { usePlan } from '@/features/plan';
import { useSessionStore } from '../model/sessionStore';
import { useRestTimer } from '../lib/restTimer';
import { useSessionSync } from '../lib/sessionSync';
import { useFinishSession } from '../lib/useFinishSession';
import { SetLogger } from './SetLogger';
import { RestTimer } from './RestTimer';
import { RepLedger } from './RepLedger';
import { SessionSummary } from './SessionSummary';
import type { FinishSessionInput } from '../model/session.schema';

export function ActiveSession({
  onExit,
  onNoSession,
}: {
  onExit?: () => void;
  onNoSession?: () => void;
}) {
  const { t } = useTranslation(['workouts', 'plan', 'common']);
  const { data: plan } = usePlan();
  const session = useSessionStore((s) => s.session);
  const finish = useSessionStore((s) => s.finish);
  const abandon = useSessionStore((s) => s.abandon);
  const { remaining, isResting, startRest, stopRest } = useRestTimer();
  const finishMutation = useFinishSession();
  const [summary, setSummary] = useState<FinishSessionInput | null>(null);

  useSessionSync();

  if (summary) {
    return (
      <div className="flex flex-col items-center gap-6 py-8">
        <SessionSummary session={summary} />
        <Button size="lg" block onClick={onExit}>
          {t('common:action.close')}
        </Button>
      </div>
    );
  }

  if (!session) {
    return (
      <Card className="flex flex-col items-center gap-5 rounded-2xl p-8 text-center">
        <p className="text-base text-[var(--color-steel)]">
          {t('workouts:no_active')}
        </p>
        {onNoSession && (
          <Button size="lg" onClick={onNoSession}>
            {t('common:nav.today')}
          </Button>
        )}
      </Card>
    );
  }

  const day = plan?.days.find((d) => d.dayIndex === session.planDayIndex);

  function handleFinish() {
    const result = finish();
    if ('error' in result) {
      toast({ message: t(result.error), tone: 'danger' });
      return;
    }
    setSummary(result.data);
    finishMutation.mutate(result.data);
    toast({ message: t('workouts:summary.saved'), tone: 'banked' });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between rounded-xl border border-transparent bg-[var(--color-bg-elevated)] px-4 py-3 shadow-sm">
          <h1 className="font-display text-xl font-bold tracking-tight">
            {t(`plan:split.${session.split}`)}
          </h1>
          <Button
            variant="quiet"
            size="lg"
            onClick={() => {
              abandon();
              onExit?.();
            }}
          >
            {t('workouts:action.abandon')}
          </Button>
        </div>

        <div className="flex flex-col gap-4">
          {day?.exercises.map((planned) => (
            <SetLogger key={planned.exerciseId} planned={planned} onLogged={startRest} />
          ))}
        </div>

        <div className="mt-2">
          <Button size="lg" block variant="primary" onClick={handleFinish}>
            {t('workouts:action.finish')}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <RepLedger />
        <RestTimer open={isResting} remaining={remaining} onClose={stopRest} />
      </div>
    </div>
  );
}
