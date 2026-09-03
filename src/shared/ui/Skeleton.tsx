import { cn } from '@/shared/lib/cn';

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-[10px] bg-black/[0.06]', className)}
      aria-hidden="true"
    />
  );
}
