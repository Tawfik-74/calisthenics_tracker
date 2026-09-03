import { cn } from '@/shared/lib/cn';

export interface NumberStepperProps {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label: string;
  suffix?: string;
}

/** The most-tapped control in the app. 56px targets, type="button" throughout. */
export function NumberStepper({
  value,
  onChange,
  min = 0,
  max = 999,
  step = 1,
  label,
  suffix,
}: NumberStepperProps) {
  const clamp = (n: number) => Math.min(max, Math.max(min, n));
  const dec = () => onChange(clamp(value - step));
  const inc = () => onChange(clamp(value + step));

  return (
    <div
      className="flex items-center justify-between gap-2 rounded-full border border-[var(--color-line)] bg-[var(--color-raised)] p-1"
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        onClick={dec}
        disabled={value <= min}
        aria-label={`${label} −`}
        className={btn}
      >
        −
      </button>
      <div className="flex min-w-[4ch] items-baseline justify-center gap-1">
        <span className="font-numeric text-xl font-semibold tabular-nums">{value}</span>
        {suffix && <span className="text-xs text-[var(--color-steel)]">{suffix}</span>}
      </div>
      <button
        type="button"
        onClick={inc}
        disabled={value >= max}
        aria-label={`${label} +`}
        className={btn}
      >
        +
      </button>
    </div>
  );
}

const btn = cn(
  'grid h-14 w-14 place-items-center rounded-full text-2xl font-semibold',
  'text-[var(--color-ink)] hover:bg-black/5 disabled:opacity-30 disabled:pointer-events-none',
);
