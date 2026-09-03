import { supabase } from '@/shared/lib/supabase';
import { useToastStore } from '@/shared/ui';
import { i18n } from '@/shared/i18n';
import type { SendNudgeInput } from '../model/squad.schema';

/**
 * The client never notifies anyone — it asks the server to. The Edge Function
 * holds the VAPID private key, checks squad membership, rate-limits, and honors
 * each recipient's quiet hours.
 */
export const nudgeApi = {
  async send(input: SendNudgeInput): Promise<{ deliveredTo: number }> {
    if (!supabase) {
      // Demo: echo the nudge straight back into our own toast.
      useToastStore.getState().toast({
        message: i18n.t(input.messageKey, { ns: 'social', name: i18n.t('social:you') }),
        tone: 'squad',
      });
      return { deliveredTo: 0 };
    }

    const { data, error } = await supabase.functions.invoke<{ deliveredTo: number }>('send-nudge', {
      body: input,
    });
    if (error) throw new Error('social.error.nudge_failed');
    return data ?? { deliveredTo: 0 };
  },
};
