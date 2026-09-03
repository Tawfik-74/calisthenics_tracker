import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';
import { enablePush, pushSupport } from '../lib/pushSubscription';

/**
 * Quiet "enable alerts" affordance. Never nags — the Realtime toast already
 * works without notification permission.
 */
export function NudgeAlertsPrompt() {
  const { t } = useTranslation('social');
  const support = pushSupport();

  if (support === 'unsupported' || support === 'granted') return null;

  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] border border-[var(--color-line)] p-3 text-sm">
      <span className="text-[var(--color-steel)]">{t('alerts.pitch')}</span>
      <Button variant="quiet" onClick={() => void enablePush()}>
        {t('alerts.enable')}
      </Button>
    </div>
  );
}
