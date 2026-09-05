import { useTranslation } from 'react-i18next';
import { Card, Tag, Skeleton, Button } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import { formatNumber } from '@/shared/lib/formatters';
import { secondsToClock } from '@/shared/lib/dates';
import type { UserId } from '@/shared/types/ids';
import { exerciseName } from '@/features/plan';
import type { SquadMemberProfile } from '../model/memberProfile.types';

export interface MemberStatsCardProps {
  profile: SquadMemberProfile;
  /** Numbers can still be loading while the header is already painted. */
  isStatsPending?: boolean;
  onNudge?: (userId: UserId) => void;
  className?: string;
}

const TOP_EXERCISES = 3;
const RECENT_SESSIONS = 4;

/**
 * Presentational only — no hooks, no fetching. The route (or useMemberProfile)
 * assembles the data; this renders it. That keeps it trivially testable and
 * means `social` never takes a runtime dependency on how stats are fetched.
 */
export function MemberStatsCard({
  profile,
  isStatsPending,
  onNudge,
  className,
}: MemberStatsCardProps) {
  const { t, i18n } = useTranslation(['social', 'plan', 'stats', 'common']);
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en';
  const { header, summary, byExercise, recentSessions, isSelf } = profile;

  const dateFmt = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    day: 'numeric',
    month: 'short',
    numberingSystem: 'latn', // never Eastern Arabic numerals — see formatters.ts
    timeZone: header.timeZone,
  });

  return (
    <Card className={cn('flex flex-col gap-4', className)}>
      {/* Identity — logical properties throughout so RTL mirrors for free. */}
      <header className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[var(--color-effort)] text-lg font-bold text-[var(--color-on-effort)]"
        >
          {header.displayName.charAt(0)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-lg font-bold">{header.displayName}</p>
          <p className="eyebrow">{t(`plan:level.${header.level}`)}</p>
        </div>
        {header.role === 'owner' && <Tag tone="squad">{t('social:owner')}</Tag>}
      </header>

      {/* Month totals — the numbers are the content, so they get the weight. */}
      {isStatsPending ? (
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : (
        <dl className="grid grid-cols-3 gap-3">
          <Stat label={t('stats:kpi.sessions')} value={formatNumber(summary.totalSessions, locale)} />
          <Stat label={t('stats:kpi.active_days')} value={formatNumber(summary.activeDays, locale)} />
          <Stat
            label={t('stats:kpi.volume')}
            value={
              summary.totalHoldSeconds > summary.totalReps
                ? secondsToClock(summary.totalHoldSeconds)
                : formatNumber(summary.totalReps, locale)
            }
          />
        </dl>
      )}

      {/* Recent workouts */}
      <section className="flex flex-col gap-2">
        <h3 className="eyebrow">{t('social:member.recent')}</h3>
        {recentSessions.length === 0 ? (
          <p className="text-sm text-[var(--color-steel)]">{t('social:member.no_sessions')}</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {recentSessions.slice(0, RECENT_SESSIONS).map((s) => (
              <li key={s.sessionId} className="flex items-center gap-3 text-sm">
                <Tag tone="effort">{t(`plan:split.${s.split}`)}</Tag>
                <span className="text-[var(--color-steel)]">{dateFmt.format(new Date(s.finishedAt))}</span>
                <span className="ms-auto font-numeric font-semibold tabular-nums">
                  {s.totalReps > 0
                    ? `${formatNumber(s.totalReps, locale)} ${t('social:member.reps')}`
                    : `${formatNumber(s.totalHoldSeconds, locale)}${t('plan:unit.sec')}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Top exercises. Names resolve from the slug via plan's catalog — the DB
          stores exercise_id, never a display string, so this works in both locales. */}
      {byExercise.length > 0 && (
        <section className="flex flex-col gap-2">
          <h3 className="eyebrow">{t('social:member.top_exercises')}</h3>
          <ul className="flex flex-col gap-1">
            {byExercise.slice(0, TOP_EXERCISES).map((e) => (
              <li key={e.exerciseId} className="flex items-baseline justify-between gap-3 text-sm">
                <span className="truncate font-medium">{exerciseName(t, e.exerciseId)}</span>
                <span className="font-numeric font-semibold tabular-nums text-[var(--color-banked)]">
                  {e.measure === 'reps'
                    ? formatNumber(e.totalReps, locale)
                    : `${formatNumber(e.totalHoldSeconds, locale)}${t('plan:unit.sec')}`}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {!isSelf && onNudge && (
        <Button
          size="lg"
          block
          onClick={() => onNudge(header.userId)}
          className="bg-[var(--color-squad)] text-[var(--color-ink)] hover:brightness-95"
        >
          {t('social:action.nudge')}
        </Button>
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <dd className="font-numeric text-xl font-semibold tabular-nums text-[var(--color-banked)]">
        {value}
      </dd>
      <dt className="eyebrow">{label}</dt>
    </div>
  );
}

export function MemberStatsCardSkeleton() {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-14" />
        ))}
      </div>
      <Skeleton className="h-24" />
    </Card>
  );
}
