import { useTranslation } from 'react-i18next';
import { cn } from '@/shared/lib/cn';
import { useThemeStore, type ThemeMode } from '@/shared/lib/theme';

const MODES: { mode: ThemeMode; glyph: string }[] = [
  { mode: 'light', glyph: '☀' },
  { mode: 'dark', glyph: '☾' },
  { mode: 'system', glyph: 'Auto' },
];

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation('common');
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);

  return (
    <div
      role="radiogroup"
      aria-label={t('theme.label')}
      className={cn('inline-flex rounded-full border border-[var(--color-line)] p-0.5', className)}
    >
      {MODES.map(({ mode: m, glyph }) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={mode === m}
          aria-label={t(`theme.${m}`)}
          title={t(`theme.${m}`)}
          onClick={() => setMode(m)}
          className={cn(
            'min-h-[36px] min-w-[40px] rounded-full px-2.5 text-sm font-semibold',
            mode === m
              ? 'bg-[var(--color-ink)] text-[var(--color-raised)]'
              : 'text-[var(--color-steel)]',
          )}
        >
          {glyph}
        </button>
      ))}
    </div>
  );
}
