import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { formatElapsed } from '../../lib/usePlayerClock';

export interface PlayerTopBarProps {
  elapsedMs: number;
  totalSteps: number;
  completedSteps: number;
  /** Index of the step in progress (its segment pulses). */
  activeIndex: number;
  paused: boolean;
  onTogglePause: () => void;
}

export function PlayerTopBar({
  elapsedMs,
  totalSteps,
  completedSteps,
  activeIndex,
  paused,
  onTogglePause,
}: PlayerTopBarProps) {
  const { t } = useTranslation('workouts');

  return (
    <div className="pointer-events-none px-4 pt-3">
      <div className="flex gap-1">
        {Array.from({ length: Math.max(1, totalSteps) }, (_, i) => {
          const done = i < completedSteps;
          const current = i === activeIndex && !done;
          return (
            <span
              key={i}
              className={cn('h-1 flex-1 rounded-full transition-colors', current && !paused && 'animate-pulse')}
              style={{
                backgroundColor:
                  done || current ? 'var(--player-accent)' : 'rgba(255,255,255,0.16)',
              }}
            />
          );
        })}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <span dir="ltr" className="font-numeric text-xl font-bold tabular-nums text-white">
          {formatElapsed(elapsedMs)}
        </span>
        <button
          type="button"
          onClick={onTogglePause}
          aria-label={paused ? t('player.resume') : t('player.paused')}
          className="pointer-events-auto grid h-10 w-10 place-items-center rounded-full text-white/90 hover:bg-white/10"
        >
          {paused ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M6 5h4v14H6zM14 5h4v14h-4z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
