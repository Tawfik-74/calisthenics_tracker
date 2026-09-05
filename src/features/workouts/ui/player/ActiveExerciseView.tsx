import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import type { PlayerStep } from '../../model/player.types';
import { ExerciseMedia } from './ExerciseMedia';
import { ProgressRing } from './ProgressRing';

export interface ActiveExerciseViewProps {
  step: PlayerStep;
  activeRemainingMs: number;
  activeTotalMs: number;
  paused: boolean;
  onComplete: () => void;
  onRestart: () => void;
  onInfo: () => void;
}

export function ActiveExerciseView({
  step,
  activeRemainingMs,
  activeTotalMs,
  paused,
  onComplete,
  onRestart,
  onInfo,
}: ActiveExerciseViewProps) {
  const { t } = useTranslation(['workouts', 'plan']);
  const name = t(step.nameKey, { defaultValue: step.slug.replace(/_/g, ' ') });
  const isHold = step.measure === 'hold';
  const secondsLeft = Math.ceil(activeRemainingMs / 1000);
  const holdProgress = activeTotalMs > 0 ? 1 - activeRemainingMs / activeTotalMs : 0;

  return (
    <div className="absolute inset-0">
      <ExerciseMedia slug={step.slug} paused={paused} dim />

      {/* Bottom gradient for text legibility */}
      <div className="absolute inset-x-0 bottom-0 h-3/4 bg-gradient-to-t from-black via-black/85 to-transparent" />

      {/* Centre action */}
      <div className="absolute inset-0 flex items-center justify-center">
        {isHold ? (
          <ProgressRing progress={holdProgress} size={180} stroke={5}>
            <span dir="ltr" className="font-numeric text-5xl font-extrabold tabular-nums text-white">
              {secondsLeft}
            </span>
          </ProgressRing>
        ) : (
          <button
            type="button"
            onClick={onComplete}
            aria-label={t('player.done')}
            className="grid h-24 w-24 place-items-center rounded-full border-2 border-white/70 bg-black/30 backdrop-blur-sm transition-transform active:scale-95"
          >
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M5 13l4 4L19 7"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Bottom-left exercise block */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-2 px-5 pb-28">
        {isHold ? (
          <>
            <div className="flex items-end justify-between">
              <div className="flex flex-col">
                <span
                  dir="ltr"
                  className="font-numeric text-6xl font-extrabold leading-none tabular-nums"
                  style={{ color: 'var(--player-accent)' }}
                >
                  {secondsLeft}
                </span>
                <span
                  className="mt-1 text-xs font-bold uppercase tracking-[0.2em]"
                  style={{ color: 'var(--player-accent)' }}
                >
                  {t('player.seconds')}
                </span>
              </div>
              <button
                type="button"
                onClick={onRestart}
                className="flex items-center gap-1.5 text-sm font-semibold"
                style={{ color: 'var(--player-accent)' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M12 5V1L7 6l5 5V7a6 6 0 11-6 6H4a8 8 0 108-8z" />
                </svg>
                {t('player.restart')}
              </button>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/15">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.min(100, Math.max(0, holdProgress * 100))}%`,
                  backgroundColor: 'var(--player-accent)',
                  transition: 'width 240ms linear',
                }}
              />
            </div>
          </>
        ) : (
          <span dir="ltr" className="font-numeric text-5xl font-extrabold leading-none tabular-nums">
            <span style={{ color: 'var(--player-accent)' }}>{step.targetReps}</span>{' '}
            <span className="text-3xl" style={{ color: 'var(--player-accent)' }}>
              {t('player.reps')}
            </span>
          </span>
        )}

        <h2 className="text-2xl font-bold text-white">{name}</h2>

        <div className="flex items-center gap-3 text-sm">
          <span className="text-[#8E8E93]">
            {t('player.set', { current: step.setNumber, total: step.totalSets })}
          </span>
          <button
            type="button"
            onClick={onInfo}
            className="flex items-center gap-1 font-semibold"
            style={{ color: 'var(--player-accent)' }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z" />
            </svg>
            {t('player.exercise_info')}
          </button>
        </div>

        {!isHold && step.setNumber === 1 && (
          <p className={cn('text-xs text-white/40', paused && 'opacity-0')}>
            {t('player.tap_when_done')}
          </p>
        )}
      </div>
    </div>
  );
}
