import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/shared/lib/supabase';
import { toast } from '@/shared/ui';
import type { SquadId } from '@/shared/types/ids';
import { nudgePayloadSchema } from '../model/squad.schema';

/** Realtime path — fires while the app is foregrounded. Web Push covers closed. */
export function useNudgeChannel(squadId: SquadId | null) {
  const { t } = useTranslation('social');
  const seen = useRef(new Set<string>());

  useEffect(() => {
    const sb = supabase;
    if (!squadId || !sb) return;

    const channel = sb
      .channel(`squad:${squadId}`)
      .on('broadcast', { event: 'nudge' }, ({ payload }) => {
        const parsed = nudgePayloadSchema.safeParse(payload);
        if (!parsed.success) return;
        if (seen.current.has(parsed.data.id)) return; // already got it via push
        seen.current.add(parsed.data.id);
        toast({
          tone: 'squad',
          message: t(parsed.data.messageKey, { name: parsed.data.senderName }),
        });
      })
      .subscribe();

    return () => {
      void sb.removeChannel(channel);
    };
  }, [squadId, t]);
}
