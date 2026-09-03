import { z } from 'zod';

/** Rows returned by the `monthly_exercise_totals` RPC. Untrusted -> parsed. */
export const monthlyTotalRowSchema = z.object({
  exercise_id: z.string().uuid(),
  slug: z.string(),
  measure: z.enum(['reps', 'hold']),
  total_reps: z.coerce.number(),
  total_hold_seconds: z.coerce.number(),
  total_sets: z.coerce.number(),
  session_count: z.coerce.number(),
  best_set_reps: z.coerce.number(),
});
export type MonthlyTotalRow = z.infer<typeof monthlyTotalRowSchema>;

export const monthlyTotalsResponseSchema = z.array(monthlyTotalRowSchema);
