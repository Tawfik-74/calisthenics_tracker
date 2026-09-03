import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button, Sheet } from '@/shared/ui';
import { SquadBar, SquadManager, InviteForm, NudgeAlertsPrompt, useSquad } from '@/features/social';

export function SquadRoute() {
  const { t } = useTranslation(['social', 'common']);
  const { data: squad } = useSquad();
  const navigate = useNavigate();
  const [inviteOpen, setInviteOpen] = useState(false);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-bold">{t('social:title')}</h1>
      <NudgeAlertsPrompt />
      <SquadBar onSelectMember={(userId) => navigate(`/squad/${userId}`)} />
      <SquadManager />

      {squad && (
        <>
          <Button variant="quiet" size="lg" block onClick={() => setInviteOpen(true)}>
            {t('social:action.send_invites')}
          </Button>
          <Sheet open={inviteOpen} onClose={() => setInviteOpen(false)} title={t('social:action.send_invites')}>
            <InviteForm squadId={squad.id} onDone={() => setInviteOpen(false)} />
          </Sheet>
        </>
      )}
    </div>
  );
}
