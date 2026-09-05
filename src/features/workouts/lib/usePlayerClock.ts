import { useEffect } from 'react';
import { usePlayerStore } from '../model/playerStore';

/**
 * Drives the player state machine forward. One interval for the whole player;
 * `tick()` itself is a no-op unless the machine is active or resting. Also ticks
 * immediately when the tab returns to the foreground so a backgrounded rest
 * catches up at once.
 */
export function usePlayerClock(): void {
  useEffect(() => {
    const tick = usePlayerStore.getState().tick;
    const id = window.setInterval(tick, 200);
    const onVisible = () => {
      if (document.visibilityState === 'visible') tick();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);
}

/** `M:SS` — the rest countdown. */
export function formatCountdown(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** `H:MM:SS` — the elapsed total. */
export function formatElapsed(ms: number): string {
  const total = Math.floor(ms / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}
