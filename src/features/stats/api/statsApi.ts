import { supabase } from '@/shared/lib/supabase';
import type { MonthKey, UserId } from '@/shared/types/ids';
import { asId } from '@/shared/types/ids';
import { sessionApi, type FinishSessionInput } from '@/features/workouts';
import { monthlyTotalsResponseSchema } from '../model/stats.schema';
import { aggregateMonthly } from '../lib/aggregateMonthly';
import type { MonthlyStats } from '../model/stats.types';

export const statsApi = {
  /**
   * `isSelf` only matters for the offline mock: local history belongs to the
   * signed-in user, so replaying it for a teammate would attribute YOUR reps to
   * THEM. Better to return nothing than something false — the per-exercise
   * breakdown for a squadmate needs the real monthly_exercise_totals RPC.
   */
  async month(
    userId: UserId,
    month: MonthKey,
    timeZone?: string,
    isSelf = true,
  ): Promise<MonthlyStats> {
    if (!supabase) {
      const history = isSelf
        ? (sessionApi.localHistory() as unknown as FinishSessionInput[])
        : [];
      return aggregateMonthly(history, { userId, month, timeZone });
    }

    const { data, error } = await supabase.rpc('monthly_exercise_totals', {
      p_user: userId,
      p_month: month,
    });
    if (error) throw error;

    const rows = monthlyTotalsResponseSchema.parse(data);
    return {
      userId,
      month,
      totalSessions: Math.max(...rows.map((r) => r.session_count), 0),
      totalReps: rows.reduce((a, r) => a + r.total_reps, 0),
      totalHoldSeconds: rows.reduce((a, r) => a + r.total_hold_seconds, 0),
      activeDays: 0, // filled by a second lightweight query in production
      byExercise: rows.map((r) => ({
        exerciseId: asId(r.exercise_id),
        slug: r.slug,
        measure: r.measure,
        totalReps: r.total_reps,
        totalHoldSeconds: r.total_hold_seconds,
        totalSets: r.total_sets,
        sessionCount: r.session_count,
        bestSetReps: r.best_set_reps,
        changeVsPrevMonth: null,
      })),
    };
  },
};
