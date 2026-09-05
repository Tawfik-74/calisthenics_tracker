import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type TagTone = 'neutral' | 'effort' | 'squad' | 'banked';

const tones: Record<TagTone, string> = {
  neutral: 'bg-[var(--color-hover)] text-[var(--color-steel)]',
  effort: 'bg-[var(--color-effort)]/15 text-[var(--color-effort-ink)]',
  squad: 'bg-[var(--color-squad)]/15 text-[var(--color-ink)]',
  banked: 'bg-[var(--color-banked)]/15 text-[var(--color-effort-ink)]',
};

export function Tag({
  tone = 'neutral',
  className,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: TagTone }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
        tones[tone],
        className,
      )}
      {...rest}
    />
  );
}
