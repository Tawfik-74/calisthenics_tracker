export interface ProgressRingProps {
  /** 0–1. */
  progress: number;
  size?: number;
  stroke?: number;
  className?: string;
  trackColor?: string;
  color?: string;
  children?: React.ReactNode;
}

/** A circular progress track with centred content. Sweeps clockwise from 12 o'clock. */
export function ProgressRing({
  progress,
  size = 240,
  stroke = 6,
  className,
  trackColor = 'rgba(255,255,255,0.14)',
  color = 'var(--player-accent)',
  children,
}: ProgressRingProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.min(1, Math.max(0, progress));

  return (
    <div className={className} style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamped)}
          style={{ transition: 'stroke-dashoffset 240ms linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
