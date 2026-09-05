import { useTranslation } from 'react-i18next';
import { Card, Tag } from '@/shared/ui';
import type { SkillId } from '../model/skill.types';
import { injectableSteps, skillById } from '../lib/skillTree';

/**
 * "Skill Lore" — the biomechanics + prerequisite briefing shown above a plan
 * that was generated with a target skill. Purely presentational.
 */
export function SkillLoreCard({ skillTarget }: { skillTarget: SkillId }) {
  const { t } = useTranslation('plan');
  const skill = skillById.get(skillTarget);
  if (!skill) return null;

  const prereqs = injectableSteps(skill);

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="eyebrow">{t('skill.lore_eyebrow')}</p>
          <h2 className="font-display text-lg font-bold">{t(`skill.name.${skill.id}`)}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Tag tone="effort">{t(`difficulty.${skill.difficulty}`)}</Tag>
          <Tag tone="neutral">{t(`split.${skill.primarySplit}`)}</Tag>
        </div>
      </div>

      <p className="text-sm leading-relaxed text-[var(--color-steel)]">
        {t(`skill.lore.${skill.id}`)}
      </p>

      <div className="flex flex-col gap-2">
        <p className="eyebrow">{t('skill.stability_label')}</p>
        <ul className="flex flex-col gap-1 text-sm">
          {skill.stability.map((s) => (
            <li key={s} className="flex gap-2">
              <span aria-hidden className="text-[var(--color-steel)]">
                •
              </span>
              <span>{t(`skill.stability.${s}`)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2">
        <p className="eyebrow">{t('skill.lore_prereqs')}</p>
        <div className="flex flex-wrap gap-2">
          {prereqs.map((step) => (
            <Tag key={step.slug} tone="neutral">
              {t(`skill.step.${step.slug}`)}
            </Tag>
          ))}
        </div>
      </div>

      <p className="text-xs text-[var(--color-steel)]">{t('skill.lore_note')}</p>
    </Card>
  );
}
