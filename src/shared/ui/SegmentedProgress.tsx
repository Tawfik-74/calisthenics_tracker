import { cn } from '@/shared/lib/cn';

export interface SegmentedProgressProps {
  /** Total number of steps. */
  total: number;
  /** 1-based index of the current step. Steps below it render as complete. */
  current: number;
  /** Accessible label for the progress group. */
  label: string;
  className?: string;
}

/**
 * The onboarding-style row of `h-1` segments: filled green up to and including
 * the current step, muted for the rest.
 */
export function SegmentedProgress({ total, current, label, className }: SegmentedProgressProps) {
  const steps = Array.from({ length: Math.max(1, total) }, (_, i) => i + 1);
  const clamped = Math.min(Math.max(current, 1), steps.length);

  return (
    <div
      className={cn('flex items-center gap-1.5', className)}
      role="progressbar"
      aria-label={label}
      aria-valuemin={1}
      aria-valuemax={steps.length}
      aria-valuenow={clamped}
    >
      {steps.map((step) => (
        <span
          key={step}
          className={cn(
            'h-1 flex-1 rounded-full transition-colors',
            step <= clamped ? 'bg-[var(--color-effort)]' : 'bg-[var(--color-line)]',
          )}
        />
      ))}
    </div>
  );
}
