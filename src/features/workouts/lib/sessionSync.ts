import { useEffect } from 'react';
import { toast } from '@/shared/ui';
import { useSessionStore } from '../model/sessionStore';
import { sessionApi } from '../api/sessionApi';

/**
 * Flushes queued sets to the server whenever we regain connectivity. The queue
 * is idempotent (client UUIDs), so a double-flush is harmless.
 */
export function useSessionSync() {
  const pending = useSessionStore((s) => s.pendingSets);
  const sessionId = useSessionStore((s) => s.session?.id ?? null);
  const clearPending = useSessionStore((s) => s.clearPending);

  useEffect(() => {
    if (!sessionId || pending.length === 0) return;

    async function flush() {
      try {
        await sessionApi.appendSets(sessionId!, pending);
        clearPending();
      } catch {
        toast({ message: 'workouts.error.sync_retry', tone: 'default' });
      }
    }

    if (navigator.onLine) void flush();
    window.addEventListener('online', flush);
    return () => window.removeEventListener('online', flush);
  }, [pending, sessionId, clearPending]);
}
