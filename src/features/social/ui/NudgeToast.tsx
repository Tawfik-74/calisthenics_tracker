import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, toast } from '@/shared/ui';
import { alertsEnabled, enableAlerts, pushSupport } from '../lib/pushSubscription';

/**
 * Quiet "enable alerts" affordance. Never nags — the Realtime toast already
 * works without notification permission. Offline it stores the preference and
 * fires one demo nudge so the effect is visible.
 */
export function NudgeAlertsPrompt() {
  const { t } = useTranslation('social');
  const [enabled, setEnabled] = useState(() => alertsEnabled());
  const [busy, setBusy] = useState(false);

  if (enabled || pushSupport() === 'unsupported') return null;

  async function onEnable() {
    setBusy(true);
    const outcome = await enableAlerts();
    setBusy(false);

    if (outcome === 'denied') {
      toast({ message: t('alerts.blocked'), tone: 'danger' });
      return;
    }

    setEnabled(true);
    toast({ message: t('alerts.enabled'), tone: 'banked' });

    // Show what a squad nudge looks like once, so enabling has a visible payoff.
    window.setTimeout(() => {
      toast({
        tone: 'squad',
        message: t('nudge.workout_time', { name: t('alerts.demo_name') }),
      });
    }, 1200);
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-[10px] border border-[var(--color-line)] p-3 text-sm">
      <span className="text-[var(--color-steel)]">{t('alerts.pitch')}</span>
      <Button variant="quiet" disabled={busy} onClick={() => void onEnable()}>
        {t('alerts.enable')}
      </Button>
    </div>
  );
}
