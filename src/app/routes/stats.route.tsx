import { useTranslation } from 'react-i18next';
import { MonthlyDashboard } from '@/features/stats';

export function StatsRoute() {
  const { t } = useTranslation('stats');
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-bold">{t('title')}</h1>
      <MonthlyDashboard />
    </div>
  );
}
