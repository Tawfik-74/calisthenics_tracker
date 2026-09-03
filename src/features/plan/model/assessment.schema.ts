import { z } from 'zod';

/** Onboarding form input. Messages are i18n keys resolved by `Field`. */
export const assessmentInputSchema = z.object({
  goal: z.enum(['strength', 'hypertrophy', 'mastery', 'fat_loss']),
  weightKg: z
    .number({ invalid_type_error: 'plan:error.weight_range' })
    .min(30, 'plan:error.weight_range')
    .max(250, 'plan:error.weight_range'),
  heightCm: z
    .number({ invalid_type_error: 'plan:error.height_range' })
    .min(120, 'plan:error.height_range')
    .max(230, 'plan:error.height_range'),
  pushUps: z
    .number({ invalid_type_error: 'plan:error.benchmark_range' })
    .int('plan:error.benchmark_range')
    .min(0, 'plan:error.benchmark_range')
    .max(150, 'plan:error.benchmark_range'),
  pullUps: z
    .number({ invalid_type_error: 'plan:error.benchmark_range' })
    .int('plan:error.benchmark_range')
    .min(0, 'plan:error.benchmark_range')
    .max(100, 'plan:error.benchmark_range'),
  dips: z
    .number({ invalid_type_error: 'plan:error.benchmark_range' })
    .int('plan:error.benchmark_range')
    .min(0, 'plan:error.benchmark_range')
    .max(100, 'plan:error.benchmark_range'),
});
export type AssessmentInput = z.infer<typeof assessmentInputSchema>;

/** Guards rehydration of the persisted assessment from localStorage. */
export const persistedAssessmentSchema = z.object({
  assessment: assessmentInputSchema
    .extend({ takenAt: z.string().datetime() })
    .nullable(),
});
export type PersistedAssessment = z.infer<typeof persistedAssessmentSchema>;
