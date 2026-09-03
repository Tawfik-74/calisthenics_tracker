import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, toast } from '@/shared/ui';
import type { SquadId } from '@/shared/types/ids';
import { useSendNudge } from '../lib/useSquad';
import type { NudgeMessageKey } from '../model/squad.types';

export function NudgeButton({
  squadId,
  messageKey = 'nudge.workout_time',
}: {
  squadId: SquadId;
  messageKey?: NudgeMessageKey;
}) {
  const { t } = useTranslation('social');
  const nudge = useSendNudge();
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const onCooldown = Date.now() < cooldownUntil;

  function handleClick() {
    nudge.mutate(
      { squadId, messageKey },
      {
        onSuccess: (res) => {
          toast({ message: t('nudge_sent', { count: res.deliveredTo }), tone: 'squad' });
          setCooldownUntil(Date.now() + 30 * 60_000); // mirrors the server-side limit
        },
        onError: () => toast({ message: t('error.nudge_failed'), tone: 'danger' }),
      },
    );
  }

  return (
    <Button
      variant="primary"
      size="lg"
      onClick={handleClick}
      disabled={nudge.isPending || onCooldown}
      className="bg-[var(--color-squad)] text-[var(--color-ink)] hover:brightness-95"
    >
      {onCooldown ? t('nudge_cooldown') : t('action.nudge')}
    </Button>
  );
}
