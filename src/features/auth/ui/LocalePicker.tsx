import { useTranslation } from 'react-i18next';
import { LOCALES, type Locale } from '@/shared/types/locale';
import { cn } from '@/shared/lib/cn';

const labels: Record<Locale, string> = { en: 'EN', ar: 'ع' };

export function LocalePicker({ className }: { className?: string }) {
  const { i18n } = useTranslation();
  const active = i18n.language.startsWith('ar') ? 'ar' : 'en';

  return (
    <div className={cn('inline-flex rounded-full border border-[var(--color-line)] p-0.5', className)}>
      {LOCALES.map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => void i18n.changeLanguage(l)}
          className={cn(
            'min-h-[36px] min-w-[44px] rounded-full px-2 text-sm font-semibold',
            active === l ? 'bg-[var(--color-ink)] text-white' : 'text-[var(--color-steel)]',
          )}
        >
          {labels[l]}
        </button>
      ))}
    </div>
  );
}
