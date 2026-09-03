import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, toast } from '@/shared/ui';
import { asId, type MonthKey, type UserId } from '@/shared/types/ids';
import { currentMonthKey } from '@/shared/lib/dates';
import { MonthPicker } from '@/features/stats';
import {
  MemberStatsCard,
  MemberStatsCardSkeleton,
  useMemberProfile,
  useSendNudge,
  useSquad,
} from '@/features/social';

/**
 * Composition point: social (roster + profile) + stats (MonthPicker, totals).
 * Neither feature imports the other's internals — they meet here.
 */
export function MemberRoute() {
  const { t } = useTranslation(['social', 'common']);
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [month, setMonth] = useState<MonthKey>(currentMonthKey());

  const { data: squad } = useSquad();
  const nudge = useSendNudge();

  const target: UserId | null = userId ? asId(userId) : null;
  const { profile, isPending, isStatsPending, error } = useMemberProfile(target, month);

  function handleNudge() {
    if (!squad) return;
    nudge.mutate(
      { squadId: squad.id, messageKey: 'nudge.workout_time' },
      {
        onSuccess: (r) => toast({ message: t('social:nudge_sent', { count: r.deliveredTo }), tone: 'squad' }),
        onError: () => toast({ message: t('social:error.nudge_failed'), tone: 'danger' }),
      },
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Button variant="quiet" className="self-start" onClick={() => navigate('/squad')}>
        {t('social:member.back')}
      </Button>

      <MonthPicker month={month} onChange={setMonth} />

      {error && (
        <p role="alert" className="text-sm font-medium text-[var(--color-danger)]">
          {t(error instanceof Error ? error.message : 'social:error.member_unavailable')}
        </p>
      )}

      {isPending || !profile ? (
        <MemberStatsCardSkeleton />
      ) : (
        <MemberStatsCard
          profile={profile}
          isStatsPending={isStatsPending}
          onNudge={handleNudge}
        />
      )}
    </div>
  );
}
