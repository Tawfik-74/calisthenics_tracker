import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/features/auth';
import { PlanWeekView, usePlan, type PlanDay } from '@/features/plan';
import { useSessionStore } from '@/features/workouts';
import { SquadBar } from '@/features/social';

/** Composition happens HERE: plan + workouts + social. */
export function TodayRoute() {
  const { t } = useTranslation(['plan', 'common']);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.session!.user);
  const { data: plan } = usePlan();
  const start = useSessionStore((s) => s.start);
  const active = useSessionStore((s) => s.session);

  function startDay(day: PlanDay) {
    if (!plan) return;
    start(plan, day, user.id);
    navigate('/session');
  }

  return (
    <div className="flex flex-col gap-6">
      {active && (
        <button
          onClick={() => navigate('/session')}
          className="rounded-[10px] bg-[var(--color-effort)] p-4 text-start text-white"
        >
          <p className="eyebrow text-white/80">{t('common:nav.session')}</p>
          <p className="font-display text-lg font-bold">{t(`plan:split.${active.split}`)} — resume</p>
        </button>
      )}

      <section className="flex flex-col gap-3">
        <h1 className="font-display text-xl font-bold">{t('plan:title')}</h1>
        <PlanWeekView onStartDay={startDay} />
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="font-display text-xl font-bold">{t('common:nav.squad')}</h2>
        <SquadBar />
      </section>
    </div>
  );
}
