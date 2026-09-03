import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/shared/ui';
import { ExerciseLibrarySheet } from './ExerciseLibrarySheet';

/** Opens the movement library in browse-only mode from a route header. */
export function PlanLibraryButton() {
  const { t } = useTranslation('plan');
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="quiet" size="md" onClick={() => setOpen(true)}>
        {t('library.title')}
      </Button>
      <ExerciseLibrarySheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}
