import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';
import { useAuthStore } from '@/features/auth';
import {
  BmiCard,
  PlanEditor,
  PlanGeneratorForm,
  PlanLibraryButton,
  PlanWeekView,
  useAssessment,
  usePlan,
  type PlanDay,
} from '@/features/plan';
import { useSessionStore } from '@/features/workouts';
import { SquadBar } from '@/features/social';

/** Composition happens HERE: plan + workouts + social. */
export function TodayRoute() {
  const { t } = useTranslation(['plan', 'common']);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.session!.user);
  const { assessment, result, clear } = useAssessment();
  const { data: plan } = usePlan();
  const start = useSessionStore((s) => s.start);
  const active = useSessionStore((s) => s.session);
  const [editing, setEditing] = useState(false);

  function startDay(day: PlanDay) {
    if (!plan) return;
    start(plan, day, user.id);
    navigate('/session');
  }

  if (!assessment || !result) {
    return (
      <div className="flex flex-col gap-6">
        <PlanGeneratorForm />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {active && (
        <button
          onClick={() => navigate('/session')}
          className="rounded-[10px] bg-[var(--color-effort)] p-4 text-start text-white"
        >
          <p className="eyebrow text-white/80">{t('common:nav.session')}</p>
          <p className="font-display text-lg font-bold">
            {t(`plan:split.${active.split}`)} — {t('plan:action.resume')}
          </p>
        </button>
      )}

      <BmiCard
        assessment={assessment}
        result={result}
        onRetake={() => {
          clear();
          setEditing(false);
        }}
      />

      <section className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-display text-xl font-bold">{t('plan:title')}</h1>
          <div className="flex gap-2">
            <PlanLibraryButton />
            {plan && (
              <Button variant="quiet" size="md" onClick={() => setEditing((v) => !v)}>
                {editing ? t('common:action.close') : t('plan:editor.title')}
              </Button>
            )}
          </div>
        </div>

        {editing && plan ? (
          <PlanEditor plan={plan} onDone={() => setEditing(false)} />
        ) : (
          <PlanWeekView onStartDay={startDay} />
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold">{t('common:nav.squad')}</h2>
        <SquadBar />
      </section>
    </div>
  );
}
