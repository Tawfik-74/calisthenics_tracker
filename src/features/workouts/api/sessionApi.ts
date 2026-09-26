import { supabase } from '@/shared/lib/supabase';
import type { FinishSessionInput, LogSetInput } from '../model/session.schema';

const HISTORY_KEY = 'ct.session-history';

export interface StoredSession extends FinishSessionInput {
  savedAt: string;
}

function readHistory(): StoredSession[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]') as StoredSession[];
  } catch {
    return [];
  }
}

export const sessionApi = {
  /** Idempotent: sets carry client UUIDs, so re-sending a queued batch is safe. */
  async appendSets(sessionId: string, sets: LogSetInput[]): Promise<void> {
    if (!supabase) return;
    if (sets.length === 0) return;
    await supabase.from('logged_sets').upsert(
      sets.map((s) => ({
        session_id: sessionId,
        exercise_id: s.exerciseId,
        set_number: s.setNumber,
        reps: s.reps,
        hold_seconds: s.holdSeconds,
        effort: s.effort,
        completed_at: s.completedAt,
      })),
      { onConflict: 'session_id,exercise_id,set_number' },
    );
  },

  async finish(input: FinishSessionInput): Promise<StoredSession> {
    const stored: StoredSession = { ...input, savedAt: new Date().toISOString() };

    if (!supabase) {
      localStorage.setItem(HISTORY_KEY, JSON.stringify([stored, ...readHistory()].slice(0, 200)));
      return stored;
    }

    await supabase.from('workout_sessions').upsert({
      id: input.sessionId,
      plan_id: input.planId,
      plan_day_index: input.planDayIndex,
      split: input.split,
      status: 'completed',
      started_at: input.startedAt,
      finished_at: input.finishedAt,
      notes: input.notes,
    });
    for (const ex of input.exercises) {
      await sessionApi.appendSets(
        input.sessionId,
        ex.sets.map((s) => ({ ...s, exerciseId: ex.exerciseId })),
      );
    }
    return stored;
  },

  async list(): Promise<StoredSession[]> {
    if (!supabase) return readHistory();
    const { data, error } = await supabase
      .from('workout_sessions')
      .select('id,plan_id,plan_day_index,split,started_at,finished_at,notes,logged_sets(id,exercise_id,set_number,reps,hold_seconds,effort,completed_at)')
      .eq('status', 'completed')
      .order('finished_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => {
      const grouped = new Map<string, typeof row.logged_sets>();
      for (const set of row.logged_sets) {
        grouped.set(set.exercise_id, [...(grouped.get(set.exercise_id) ?? []), set]);
      }
      return {
        sessionId: row.id,
        planId: row.plan_id,
        planDayIndex: row.plan_day_index,
        split: row.split,
        startedAt: row.started_at,
        finishedAt: row.finished_at,
        notes: row.notes,
        exercises: [...grouped.entries()].map(([exerciseId, sets]) => ({
          exerciseId,
          sets: sets.map((set) => ({
            exerciseId,
            setNumber: set.set_number,
            measure: set.hold_seconds != null ? 'hold' as const : 'reps' as const,
            reps: set.reps,
            holdSeconds: set.hold_seconds,
            effort: set.effort,
            completedAt: set.completed_at,
          })),
        })),
        savedAt: row.finished_at,
      } as StoredSession;
    });
  },

  /** Local history — used by the offline stats fallback. */
  localHistory: readHistory,
};
