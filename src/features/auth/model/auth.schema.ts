import { z } from 'zod';

/**
 * Error messages are i18n keys, never English strings. The `Field` component
 * calls t() on whatever comes back here.
 * (Zod v3 syntax — see the architecture doc for the v4 variant.)
 */
export const loginSchema = z.object({
  email: z
    .string({ required_error: 'auth:error.email_required' })
    .trim()
    .toLowerCase()
    .min(1, { message: 'auth:error.email_required' })
    .email({ message: 'auth:error.email_invalid' }),
  password: z
    .string({ required_error: 'auth:error.password_required' })
    .min(8, { message: 'auth:error.password_too_short' })
    .max(72, { message: 'auth:error.password_too_long' }),
  rememberMe: z.boolean().default(false),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const signUpSchema = loginSchema
  .omit({ rememberMe: true })
  .extend({
    displayName: z.string().trim().min(2).max(32),
    confirmPassword: z.string(),
    level: z.enum(['beginner', 'intermediate', 'advanced']),
    daysPerWeek: z.union([z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
    locale: z.enum(['en', 'ar']).default('en'),
    timeZone: z
      .string()
      .min(1)
      .default(() => Intl.DateTimeFormat().resolvedOptions().timeZone),
    scheduledWorkoutTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):[0-5]\d$/, { message: 'auth:error.time_invalid' }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    message: 'auth:error.passwords_mismatch',
    path: ['confirmPassword'],
  });
export type SignUpInput = z.infer<typeof signUpSchema>;
