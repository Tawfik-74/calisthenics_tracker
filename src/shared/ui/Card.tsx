import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[12px] border border-[var(--color-line)] bg-[var(--color-raised)] p-4',
        className,
      )}
      {...rest}
    />
  );
}
