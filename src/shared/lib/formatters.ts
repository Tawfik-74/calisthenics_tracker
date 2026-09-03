import type { Locale } from '@/shared/types/locale';

/**
 * Numbers always render with Western (latn) digits, even in Arabic — mixing
 * Eastern Arabic numerals with a mono font is a mess, and most Arabic fitness
 * apps use Western digits anyway.
 */
export function formatNumber(value: number, locale: Locale = 'en'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    numberingSystem: 'latn',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(ratio: number, locale: Locale = 'en'): string {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    numberingSystem: 'latn',
    style: 'percent',
    signDisplay: 'exceptZero',
    maximumFractionDigits: 0,
  }).format(ratio);
}

export function formatMonthLabel(monthKey: string, locale: Locale = 'en'): string {
  const [y, m] = monthKey.split('-').map(Number);
  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    month: 'long',
    year: 'numeric',
    numberingSystem: 'latn',
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}
