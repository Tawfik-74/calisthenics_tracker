import { useCallback, useEffect, useRef, useState } from 'react';

/** Countdown rest timer. Wall-clock based so it survives a backgrounded tab. */
export function useRestTimer() {
  const [remaining, setRemaining] = useState(0);
  const deadlineRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);

  const tick = useCallback(() => {
    if (deadlineRef.current == null) return;
    const left = Math.max(0, Math.round((deadlineRef.current - Date.now()) / 1000));
    setRemaining(left);
    if (left > 0) {
      rafRef.current = window.setTimeout(tick, 250);
    } else {
      deadlineRef.current = null;
    }
  }, []);

  const startRest = useCallback(
    (seconds: number) => {
      deadlineRef.current = Date.now() + seconds * 1000;
      setRemaining(seconds);
      if (rafRef.current) clearTimeout(rafRef.current);
      tick();
    },
    [tick],
  );

  const stopRest = useCallback(() => {
    deadlineRef.current = null;
    if (rafRef.current) clearTimeout(rafRef.current);
    setRemaining(0);
  }, []);

  useEffect(() => () => void (rafRef.current && clearTimeout(rafRef.current)), []);

  return { remaining, isResting: remaining > 0, startRest, stopRest };
}
