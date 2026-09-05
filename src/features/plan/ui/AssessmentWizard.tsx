import { useMemo, useState } from 'react';
import { useForm, type Path } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, Field, NumberStepper, SegmentedProgress, TextInput, toast } from '@/shared/ui';
import { assessmentInputSchema, type AssessmentInput } from '../model/assessment.schema';
import type { SkillId } from '../model/skill.types';
import type { TrainingGoal } from '../model/assessment.types';
import { bmiCategory, computeBmi, legEnduranceBand } from '../lib/planGenerator';
import { skillById } from '../lib/skillTree';
import { useAssessment } from '../lib/useAssessment';
import { GoalPicker } from './GoalPicker';
import { SkillTargetGrid } from './SkillTargetGrid';

const DEFAULTS: AssessmentInput = {
  goal: 'strength',
  skillTarget: null,
  weightKg: 75,
  heightCm: 175,
  pushUps: 15,
  pullUps: 5,
  dips: 8,
  squats: 20,
};

const STEP_FIELDS: Path<AssessmentInput>[][] = [
  ['goal', 'skillTarget'],
  ['weightKg', 'heightCm', 'pushUps', 'pullUps', 'dips', 'squats'],
  [],
];
const TOTAL_STEPS = STEP_FIELDS.length;

const BENCHMARKS = [
  { key: 'push_ups', field: 'pushUps', max: 150 },
  { key: 'pull_ups', field: 'pullUps', max: 100 },
  { key: 'dips', field: 'dips', max: 100 },
  { key: 'squats', field: 'squats', max: 300 },
] as const;

export function AssessmentWizard() {
  const { t, i18n } = useTranslation(['plan', 'common']);
  const locale = i18n.language.startsWith('ar') ? 'ar-EG' : 'en-US';
  const nf = new Intl.NumberFormat(locale, { numberingSystem: 'latn', maximumFractionDigits: 1 });
  const { save } = useAssessment();

  const [step, setStep] = useState(0);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    trigger,
    formState: { errors, isSubmitting },
  } = useForm<AssessmentInput>({
    resolver: zodResolver(assessmentInputSchema),
    defaultValues: DEFAULTS,
    mode: 'onTouched',
  });

  const values = watch();
  const isMastery = values.goal === 'mastery';
  const skillTarget = (values.skillTarget ?? null) as SkillId | null;
  const skill = skillTarget ? skillById.get(skillTarget) : undefined;

  const bmiPreview = useMemo(() => {
    const { weightKg, heightCm } = values;
    return Number.isFinite(weightKg) && Number.isFinite(heightCm) && weightKg > 0 && heightCm > 0
      ? computeBmi(weightKg, heightCm)
      : null;
  }, [values]);

  const legBand = legEnduranceBand(values.squats);
  const num = (n: number) => (Number.isFinite(n) ? n : 0);

  async function next() {
    const ok = await trigger(STEP_FIELDS[step]);
    if (ok) setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  }

  const submit = handleSubmit(async (data) => {
    const payload: AssessmentInput = {
      ...data,
      skillTarget: data.goal === 'mastery' ? (data.skillTarget ?? null) : null,
    };
    await save(payload);
    toast({ message: t('plan:toast.plan_ready'), tone: 'banked' });
  });

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(e) => {
        e.preventDefault();
        if (step === TOTAL_STEPS - 1) void submit();
      }}
      noValidate
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="eyebrow">{t('wizard.step_of', { current: step + 1, total: TOTAL_STEPS })}</span>
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="text-xs font-semibold text-[var(--color-steel)] hover:text-[var(--color-ink)]"
            >
              {t('wizard.back')}
            </button>
          )}
        </div>
        <SegmentedProgress total={TOTAL_STEPS} current={step + 1} label={t('assessment.title')} />
      </div>

      {step === 0 && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-xl font-bold">{t('wizard.goal_title')}</h1>
            <p className="text-sm text-[var(--color-steel)]">{t('wizard.goal_subtitle')}</p>
          </div>

          <GoalPicker
            value={values.goal}
            onChange={(g: TrainingGoal) => {
              setValue('goal', g, { shouldValidate: true });
              if (g !== 'mastery') setValue('skillTarget', null, { shouldValidate: true });
            }}
          />

          {isMastery && (
            <fieldset className="flex flex-col gap-2 border-0 p-0">
              <legend className="mb-1 text-sm font-semibold">{t('wizard.skill_target')}</legend>
              <p className="mb-1 text-xs text-[var(--color-steel)]">{t('wizard.skill_target_hint')}</p>
              <SkillTargetGrid
                value={skillTarget}
                onChange={(s) => setValue('skillTarget', s, { shouldValidate: true })}
              />
            </fieldset>
          )}
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-xl font-bold">{t('wizard.stats_title')}</h1>
            <p className="text-sm text-[var(--color-steel)]">{t('wizard.stats_subtitle')}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={t('field.weight')}
              hint={t('field.weight_hint')}
              error={errors.weightKg && t(errors.weightKg.message!)}
            >
              {(p) => (
                <TextInput
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  {...p}
                  {...register('weightKg', { valueAsNumber: true })}
                />
              )}
            </Field>
            <Field
              label={t('field.height')}
              hint={t('field.height_hint')}
              error={errors.heightCm && t(errors.heightCm.message!)}
            >
              {(p) => (
                <TextInput
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  {...p}
                  {...register('heightCm', { valueAsNumber: true })}
                />
              )}
            </Field>
          </div>

          {bmiPreview != null && (
            <p className="text-sm text-[var(--color-steel)]">
              {t('bmi.label')}:{' '}
              <span className="font-numeric font-semibold text-[var(--color-ink)]">
                {nf.format(bmiPreview)}
              </span>{' '}
              · {t(`bmi.category.${bmiCategory(bmiPreview)}`)}
            </p>
          )}

          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold">{t('assessment.benchmarks')}</p>
            {BENCHMARKS.map(({ key, field, max }) => (
              <div key={field} className="flex items-center justify-between gap-4">
                <span className="text-sm">{t(`field.${key}`)}</span>
                <div className="w-40">
                  <NumberStepper
                    label={t(`field.${key}`)}
                    value={num(values[field] ?? 0)}
                    min={0}
                    max={max}
                    onChange={(n) => setValue(field, n, { shouldValidate: true })}
                  />
                </div>
              </div>
            ))}
            {(errors.pushUps || errors.pullUps || errors.dips || errors.squats) && (
              <p role="alert" className="text-xs font-medium text-[var(--color-danger)]">
                {t('error.benchmark_range')}
              </p>
            )}
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <h1 className="font-display text-xl font-bold">{t('wizard.review_title')}</h1>
            <p className="text-sm text-[var(--color-steel)]">{t('wizard.review_subtitle')}</p>
          </div>

          <dl className="grid grid-cols-2 gap-x-3 gap-y-3 text-sm">
            <div>
              <dt className="text-[var(--color-steel)]">{t('goal.label')}</dt>
              <dd className="font-medium">{t(`goal.${values.goal}`)}</dd>
            </div>
            {skill && (
              <div>
                <dt className="text-[var(--color-steel)]">{t('wizard.skill_target')}</dt>
                <dd className="font-medium">{t(`skill.name.${skill.id}`)}</dd>
              </div>
            )}
            {bmiPreview != null && (
              <div>
                <dt className="text-[var(--color-steel)]">{t('bmi.label')}</dt>
                <dd className="font-numeric font-medium">
                  {nf.format(bmiPreview)} · {t(`bmi.category.${bmiCategory(bmiPreview)}`)}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-[var(--color-steel)]">{t('assessment.benchmarks')}</dt>
              <dd className="font-numeric font-medium">
                {num(values.pushUps)} / {num(values.pullUps)} / {num(values.dips)} /{' '}
                {num(values.squats ?? 0)}
              </dd>
            </div>
            {legBand && (
              <div>
                <dt className="text-[var(--color-steel)]">{t('wizard.leg_endurance')}</dt>
                <dd className="font-medium">{t(`wizard.leg_band.${legBand}`)}</dd>
              </div>
            )}
          </dl>

          <p className="text-xs text-[var(--color-steel)]">
            {skill ? t('wizard.review_skill_note') : t('wizard.review_general_note')}
          </p>
        </div>
      )}

      {step < TOTAL_STEPS - 1 ? (
        <Button type="button" size="lg" block onClick={next}>
          {t('wizard.continue')}
        </Button>
      ) : (
        <Button
          type="button"
          size="lg"
          block
          disabled={isSubmitting}
          onClick={() => void submit()}
        >
          {isSubmitting ? t('common:state.loading') : t('assessment.submit')}
        </Button>
      )}
    </form>
  );
}
