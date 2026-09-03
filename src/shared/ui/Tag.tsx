import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type TagTone = 'neutral' | 'effort' | 'squad' | 'banked';

const tones: Record<TagTone, string> = {
  neutral: 'bg-black/5 text-[var(--color-steel)]',
  effort: 'bg-[var(--color-effort)]/10 text-[var(--color-effort-ink)]',
  squad: 'bg-[var(--color-squad)]/15 text-[var(--color-ink)]',
  banked: 'bg-[var(--color-banked)]/10 text-[var(--color-banked)]',
};

export function Tag({
  tone = 'neutral',
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: TagTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[2px] px-2 py-0.5 text-xs font-semibold uppercase tracking-wide',
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
