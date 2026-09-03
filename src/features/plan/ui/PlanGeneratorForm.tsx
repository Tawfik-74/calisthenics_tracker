import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Button, Field, NumberStepper, TextInput, toast } from '@/shared/ui';
import { formatNumber } from '@/shared/lib/formatters';
import { assessmentInputSchema, type AssessmentInput } from '../model/assessment.schema';
import type { TrainingGoal } from '../model/assessment.types';
import { bmiCategory, computeBmi } from '../lib/planGenerator';
import { useAssessment } from '../lib/useAssessment';
import { GoalPicker } from './GoalPicker';

const DEFAULTS: AssessmentInput = {
  goal: 'strength',
  weightKg: 75,
  heightCm: 175,
  pushUps: 15,
  pullUps: 5,
  dips: 8,
};

export function PlanGeneratorForm() {
  const { t, i18n } = useTranslation(['plan', 'common']);
  const locale = i18n.language.startsWith('ar') ? 'ar' : 'en';
  const { save } = useAssessment();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AssessmentInput>({ resolver: zodResolver(assessmentInputSchema), defaultValues: DEFAULTS });

  const goal = watch('goal');
  const weightKg = watch('weightKg');
  const heightCm = watch('heightCm');
  const pushUps = watch('pushUps');
  const pullUps = watch('pullUps');
  const dips = watch('dips');

  const bmiPreview =
    Number.isFinite(weightKg) && Number.isFinite(heightCm) && weightKg > 0 && heightCm > 0
      ? computeBmi(weightKg, heightCm)
      : null;

  const onSubmit = handleSubmit(async (values) => {
    await save(values);
    toast({ message: t('plan:toast.plan_ready'), tone: 'banked' });
  });

  const num = (n: number) => (Number.isFinite(n) ? n : 0);

  return (
    <form className="flex flex-col gap-6" onSubmit={onSubmit} noValidate>
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-xl font-bold">{t('plan:assessment.title')}</h1>
        <p className="text-sm text-[var(--color-steel)]">{t('plan:assessment.subtitle')}</p>
      </div>

      <fieldset className="flex flex-col gap-2 border-0 p-0">
        <legend className="mb-1 text-sm font-semibold">{t('plan:goal.label')}</legend>
        <GoalPicker
          value={goal}
          onChange={(g: TrainingGoal) => setValue('goal', g, { shouldValidate: true })}
        />
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t('plan:field.weight')}
          hint={t('plan:field.weight_hint')}
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
          label={t('plan:field.height')}
          hint={t('plan:field.height_hint')}
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
          {t('plan:bmi.label')}:{' '}
          <span className="font-numeric font-semibold text-[var(--color-ink)]">
            {formatNumber(bmiPreview, locale)}
          </span>{' '}
          · {t(`plan:bmi.category.${bmiCategory(bmiPreview)}`)}
        </p>
      )}

      <div className="flex flex-col gap-3">
        <p className="text-sm font-semibold">{t('plan:assessment.benchmarks')}</p>
        {(
          [
            ['push_ups', pushUps, 'pushUps'],
            ['pull_ups', pullUps, 'pullUps'],
            ['dips', dips, 'dips'],
          ] as const
        ).map(([labelKey, value, field]) => (
          <div key={field} className="flex items-center justify-between gap-4">
            <span className="text-sm">{t(`plan:field.${labelKey}`)}</span>
            <div className="w-40">
              <NumberStepper
                label={t(`plan:field.${labelKey}`)}
                value={num(value)}
                min={0}
                max={150}
                onChange={(n) => setValue(field, n, { shouldValidate: true })}
              />
            </div>
          </div>
        ))}
        {(errors.pushUps || errors.pullUps || errors.dips) && (
          <p role="alert" className="text-xs font-medium text-[var(--color-danger)]">
            {t('plan:error.benchmark_range')}
          </p>
        )}
      </div>

      <Button type="submit" size="lg" block disabled={isSubmitting}>
        {isSubmitting ? t('common:state.loading') : t('plan:assessment.submit')}
      </Button>
    </form>
  );
}
