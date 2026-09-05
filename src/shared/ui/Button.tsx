import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

type Variant = 'primary' | 'quiet' | 'danger';
type Size = 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-[12px] font-body font-bold transition-[filter,background-color,color] ' +
  'disabled:opacity-40 disabled:pointer-events-none select-none';

const variants: Record<Variant, string> = {
  primary: 'bg-[var(--color-effort)] text-[var(--color-on-effort)] hover:brightness-110',
  quiet:
    'bg-[var(--color-raised)] text-[var(--color-ink)] hover:bg-[var(--color-hover)] border border-[var(--color-line)]',
  danger: 'bg-[var(--color-danger)] text-white hover:brightness-95',
};

const sizes: Record<Size, string> = {
  md: 'min-h-[48px] px-4 py-3 text-sm', // 48px minimum touch target
  lg: 'min-h-[56px] px-6 py-4 text-base', // thumb-reachable primary action
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', block, className, type = 'button', ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(base, variants[variant], sizes[size], block && 'w-full', className)}
      {...rest}
    />
  );
});
