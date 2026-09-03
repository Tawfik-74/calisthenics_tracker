import type { HTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[10px] bg-[var(--color-raised)] p-4 shadow-[0_1px_2px_rgba(20,24,26,0.06),0_8px_24px_-12px_rgba(20,24,26,0.12)]',
        className,
      )}
      {...rest}
    />
  );
}
