import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Card, Tag, toast } from '@/shared/ui';
import { cn } from '@/shared/lib/cn';
import type { SkillId } from '../model/skill.types';
import { SKILL_TREE, skillById } from '../lib/skillTree';
import { useInjectSkill } from '../lib/useInjectSkill';
import { SkillArt } from './SkillArt';

function StepLine({
  index,
  slug,
  isDrill,
  metric,
}: {
  index: number;
  slug: string;
  isDrill: boolean;
  metric: string;
}) {
  const { t } = useTranslation('plan');
  return (
    <li className="flex gap-3 border-s-2 border-[var(--color-line)] ps-3">
      <span className="font-numeric text-sm font-bold text-[var(--color-steel)]">{index + 1}</span>
      <div className="flex flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-medium">{t(`skill.step.${slug}`)}</span>
          <span className="font-numeric text-xs text-[var(--color-steel)]">{metric}</span>
        </div>
        <p className="text-sm text-[var(--color-steel)]">{t(`skill.step_hint.${slug}`)}</p>
        {isDrill && (
          <span className="text-xs font-semibold uppercase tracking-wide text-[var(--color-steel)]">
            {t('skill.drill_only')}
          </span>
        )}
      </div>
    </li>
  );
}

export function SkillProgressionView() {
  const { t } = useTranslation(['plan', 'common']);
  const [selected, setSelected] = useState<SkillId>(SKILL_TREE[0].id);
  const skill = skillById.get(selected)!;
  const inject = useInjectSkill();

  const injectCount = useMemo(() => inject.countFor(skill), [inject, skill]);

  const metricFor = (reps: number | null, holdSeconds: number | null, sets: number) => {
    if (holdSeconds != null) return `${sets} × ${holdSeconds}${t('unit.sec')}`;
    if (reps != null) return `${sets} × ${reps}`;
    return `${sets}×`;
  };

  async function onInject() {
    const added = await inject.inject(skill);
    toast({
      message: added > 0 ? t('skill.injected', { count: added }) : t('skill.nothing_to_inject'),
      tone: added > 0 ? 'banked' : 'default',
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-[var(--color-steel)]">{t('skill.subtitle')}</p>

      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {SKILL_TREE.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSelected(s.id)}
            className={cn(
              'min-h-[40px] shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors',
              s.id === selected
                ? 'border-[var(--color-effort)] bg-[var(--color-effort)] text-[var(--color-on-effort)]'
                : 'border-[var(--color-line)] text-[var(--color-steel)] hover:bg-[var(--color-hover)]',
            )}
          >
            {t(`skill.name.${s.id}`)}
          </button>
        ))}
      </div>

      <SkillArt skillId={skill.id} />

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="eyebrow">{t(`difficulty.${skill.difficulty}`)}</p>
            <h2 className="font-display text-lg font-bold">{t(`skill.name.${skill.id}`)}</h2>
          </div>
          <Tag tone="effort">{t(`split.${skill.primarySplit}`)}</Tag>
        </div>
        <p className="text-sm text-[var(--color-steel)]">{t(`skill.blurb.${skill.id}`)}</p>

        <div className="flex flex-col gap-2">
          <p className="eyebrow">{t('skill.muscle_groups')}</p>
          <div className="flex flex-wrap gap-2">
            {skill.muscleGroups.map((g) => (
              <Tag key={g}>{t(`muscle.${g}`)}</Tag>
            ))}
          </div>
        </div>

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
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="eyebrow">{t('skill.roadmap')}</p>
        <ol className="flex flex-col gap-3">
          {skill.steps.map((step, i) => (
            <StepLine
              key={step.slug}
              index={i}
              slug={step.slug}
              isDrill={step.moveSlug === null}
              metric={metricFor(step.reps, step.holdSeconds, step.sets)}
            />
          ))}
        </ol>
      </Card>

      <Card className="flex flex-col gap-3">
        <p className="eyebrow">{t('skill.weekly_routine')}</p>
        <div className="flex flex-col gap-3">
          {skill.weeklySessions.map((session, i) => (
            <div key={session.slug} className="flex flex-col gap-1">
              <span className="text-sm font-semibold">
                {t('skill.day', { n: i + 1 })} · {t(`skill.session.${skill.id}.${session.slug}`)}
              </span>
              <span className="text-sm text-[var(--color-steel)]">
                {session.stepSlugs.map((slug) => t(`skill.step.${slug}`)).join(' · ')}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-col gap-2">
        <Button block disabled={!inject.ready || injectCount === 0} onClick={onInject}>
          {t('skill.add_to_plan', { count: injectCount })}
        </Button>
        {!inject.ready && (
          <p className="text-center text-sm text-[var(--color-steel)]">{t('skill.need_plan')}</p>
        )}
      </div>
    </div>
  );
}
