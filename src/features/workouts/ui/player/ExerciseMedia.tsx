import { useEffect, useRef, useState } from 'react';
import { cn } from '@/shared/lib/cn';

/**
 * Looping demo clips per exercise. Drop files in `public/exercise-media/` named
 * `<slug>.mp4`; a missing or failed clip falls back to the animated placeholder,
 * so this can be populated later with no code change.
 */
const CLIPS: Partial<Record<string, string>> = {
  // push_up: '/exercise-media/push_up.mp4',
};

export interface ExerciseMediaProps {
  slug: string;
  /** `full` fills the player behind the overlays; `thumb` is a small still. */
  variant?: 'full' | 'thumb';
  /** Pause the clip (e.g. player is paused or resting). */
  paused?: boolean;
  /** Dim the media so foreground text stays readable. */
  dim?: boolean;
  className?: string;
}

export function ExerciseMedia({
  slug,
  variant = 'full',
  paused = false,
  dim = false,
  className,
}: ExerciseMediaProps) {
  const clip = CLIPS[slug];
  const [broken, setBroken] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (paused || variant === 'thumb') el.pause();
    else void el.play().catch(() => undefined);
  }, [paused, variant, clip]);

  const showVideo = Boolean(clip) && !broken && variant === 'full';

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-black',
        variant === 'thumb' ? 'h-14 w-14 shrink-0 rounded-xl' : 'h-full w-full',
        className,
      )}
    >
      {showVideo ? (
        <video
          ref={videoRef}
          src={clip}
          muted
          loop
          playsInline
          preload="auto"
          onError={() => setBroken(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <Placeholder animated={variant === 'full' && !paused} />
      )}

      {dim && <div className="absolute inset-0 bg-black/55" />}
    </div>
  );
}

function Placeholder({ animated }: { animated: boolean }) {
  return (
    <div className="absolute inset-0 bg-[radial-gradient(120%_90%_at_50%_18%,#1c1c1c_0%,#0a0a0a_60%,#000_100%)]">
      <div className="absolute inset-0 opacity-[0.5]">
        <svg width="100%" height="100%" preserveAspectRatio="none" aria-hidden>
          <defs>
            <pattern id="player-grid" width="44" height="44" patternUnits="userSpaceOnUse">
              <path d="M44 0H0V44" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#player-grid)" />
        </svg>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={cn(
            'block h-24 w-24 rounded-full border-2',
            animated && 'animate-ping',
          )}
          style={{ borderColor: 'color-mix(in srgb, var(--player-accent) 45%, transparent)' }}
        />
        <span
          className="absolute h-3 w-3 rounded-full"
          style={{ backgroundColor: 'var(--player-accent)' }}
        />
      </div>
    </div>
  );
}
