import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/shared/lib/cn';

export type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

/** Never used bare — always inside <Field>. */
export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'min-h-[52px] w-full rounded-[12px] border border-[var(--color-line)] bg-[var(--color-raised)] px-3.5 text-base text-[var(--color-ink)]',
        'placeholder:text-[var(--color-subtitle)] focus-visible:border-[var(--color-effort)] aria-[invalid=true]:border-[var(--color-danger)]',
        className,
      )}
      {...rest}
    />
  );
});
