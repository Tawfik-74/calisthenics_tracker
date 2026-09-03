import { useTranslation } from 'react-i18next';
import { Sheet, Button } from '@/shared/ui';
import { secondsToClock } from '@/shared/lib/dates';

export function RestTimer({
  open,
  remaining,
  onClose,
}: {
  open: boolean;
  remaining: number;
  onClose: () => void;
}) {
  const { t } = useTranslation('workouts');
  return (
    <Sheet open={open} onClose={onClose} title={t('rest.title')}>
      <div className="flex flex-col items-center gap-4 py-4">
        {/* A clock does not mirror in RTL — keep it LTR. */}
        <span dir="ltr" className="font-numeric text-hero font-semibold tabular-nums">
          {secondsToClock(remaining)}
        </span>
        <Button variant="quiet" size="lg" block onClick={onClose}>
          {t('rest.skip')}
        </Button>
      </div>
    </Sheet>
  );
}
