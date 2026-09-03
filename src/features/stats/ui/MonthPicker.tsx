import type { MonthKey } from '@/shared/types/ids';
import { shiftMonth } from '@/shared/lib/dates';
import { formatMonthLabel } from '@/shared/lib/formatters';
import { useTranslation } from 'react-i18next';

export function MonthPicker({
  month,
  onChange,
}: {
  month: MonthKey;
  onChange: (m: MonthKey) => void;
}) {
  const { i18n } = useTranslation();
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en';

  return (
    <div className="flex items-center justify-between gap-2">
      {/* Chronology reads oldest -> newest; in RTL the arrows swap with the layout. */}
      <button
        type="button"
        aria-label="previous month"
        onClick={() => onChange(shiftMonth(month, -1))}
        className="grid h-12 w-12 place-items-center rounded-full hover:bg-[var(--color-hover)] rtl:rotate-180"
      >
        ‹
      </button>
      <span className="font-display text-lg font-bold">{formatMonthLabel(month, locale)}</span>
      <button
        type="button"
        aria-label="next month"
        onClick={() => onChange(shiftMonth(month, 1))}
        className="grid h-12 w-12 place-items-center rounded-full hover:bg-[var(--color-hover)] rtl:rotate-180"
      >
        ›
      </button>
    </div>
  );
}
