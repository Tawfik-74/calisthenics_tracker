import { useTranslation } from 'react-i18next';
import type { PlayerStep } from '../../model/player.types';
import { formatCountdown } from '../../lib/usePlayerClock';
import { ExerciseMedia } from './ExerciseMedia';
import { ProgressRing } from './ProgressRing';

export interface RestTimerViewProps {
  restRemainingMs: number;
  restTotalMs: number;
  nextStep: PlayerStep;
  onAdjust: (deltaMs: number) => void;
  onSkip: () => void;
}

export function RestTimerView({
  restRemainingMs,
  restTotalMs,
  nextStep,
  onAdjust,
  onSkip,
}: RestTimerViewProps) {
  const { t } = useTranslation(['workouts', 'plan']);
  const name = t(nextStep.nameKey, { defaultValue: nextStep.slug.replace(/_/g, ' ') });
  const progress = restTotalMs > 0 ? 1 - restRemainingMs / restTotalMs : 0;
  const targetLabel =
    nextStep.measure === 'reps' ? `${nextStep.targetReps}` : `${nextStep.targetHoldSeconds}"`;

  return (
    <div className="absolute inset-0 bg-gradient-to-b from-[#7f1d1d] via-[#3f0d0d] to-black">
      <div
        className="absolute inset-x-0 top-0 h-1/2"
        style={{
          background:
            'radial-gradient(90% 60% at 50% 0%, color-mix(in srgb, var(--player-accent) 30%, transparent) 0%, transparent 70%)',
        }}
      />

      {/* Countdown */}
      <div className="absolute inset-x-0 top-[38%] flex -translate-y-1/2 items-center justify-center gap-6">
        <button
          type="button"
          onClick={() => onAdjust(-15_000)}
          aria-label="-15s"
          className="grid h-11 w-11 place-items-center rounded-full border border-white/25 text-2xl font-light text-white/90 active:scale-95"
        >
          −
        </button>

        <ProgressRing progress={progress} size={220} stroke={5} color="#ffffff">
          <span dir="ltr" className="font-numeric text-6xl font-extrabold tabular-nums text-white">
            {formatCountdown(restRemainingMs)}
          </span>
          <span className="mt-1 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
            {t('player.rest')}
          </span>
        </ProgressRing>

        <button
          type="button"
          onClick={() => onAdjust(15_000)}
          aria-label="+15s"
          className="grid h-11 w-11 place-items-center rounded-full border border-white/25 text-2xl font-light text-white/90 active:scale-95"
        >
          +
        </button>
      </div>

      <div className="absolute inset-x-0 top-[62%] flex justify-center">
        <button
          type="button"
          onClick={onSkip}
          className="rounded-full border border-white/25 px-5 py-2 text-sm font-semibold text-white/90 active:scale-95"
        >
          {t('player.skip_rest')}
        </button>
      </div>

      {/* Next-up preview */}
      <div className="absolute inset-x-0 bottom-0 px-4 pb-28">
        <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/45 p-3 backdrop-blur">
          <ExerciseMedia slug={nextStep.slug} variant="thumb" paused />
          <div className="flex min-w-0 flex-col">
            <span className="text-xs text-white/70">
              {t('player.prepare_for')}{' '}
              <span className="font-bold" style={{ color: 'var(--player-accent)' }}>
                {t('player.set', { current: nextStep.setNumber, total: nextStep.totalSets })}
              </span>
            </span>
            <span className="truncate text-sm text-white">
              <span dir="ltr" className="font-bold" style={{ color: 'var(--player-accent)' }}>
                {targetLabel}
              </span>{' '}
              {name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
