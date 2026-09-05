import { useTranslation } from 'react-i18next';
import { SkillProgressionView } from '@/features/plan';

export function SkillsRoute() {
  const { t } = useTranslation('plan');

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-bold">{t('plan:skill.title')}</h1>
      <SkillProgressionView />
    </div>
  );
}
