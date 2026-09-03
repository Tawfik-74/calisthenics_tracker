import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { asId, nowIso, type UserId } from '@/shared/types/ids';
import type { PlanDay, WorkoutPlan } from '@/features/plan';
import type { LoggedSet, WorkoutSession } from './session.types';
import {
  finishSessionSchema,
  persistedStateSchema,
  type FinishSessionInput,
  type LogSetInput,
} from './session.schema';

interface SessionState {
  session: WorkoutSession | null;
  pendingSets: LogSetInput[];
  start: (plan: WorkoutPlan, day: PlanDay, userId: UserId) => void;
  logSet: (input: LogSetInput) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  setNotes: (notes: string) => void;
  finish: () => { data: FinishSessionInput } | { error: string };
  abandon: () => void;
  clearPending: () => void;
}

function buildSession(plan: WorkoutPlan, day: PlanDay, userId: UserId): WorkoutSession {
  return {
    id: asId(crypto.randomUUID()),
    userId,
    planId: plan.id,
    planDayIndex: day.dayIndex,
    split: day.split,
    status: 'active',
    startedAt: nowIso(),
    finishedAt: null,
    exercises: day.exercises.map((e) => ({ exerciseId: e.exerciseId, sets: [] })),
    notes: null,
  };
}

function toLoggedSet(input: LogSetInput): LoggedSet {
  return {
    id: crypto.randomUUID(),
    setNumber: input.setNumber,
    reps: input.reps,
    holdSeconds: input.holdSeconds,
    effort: input.effort,
    completedAt: input.completedAt as LoggedSet['completedAt'],
  };
}

function toFinishInput(s: WorkoutSession): unknown {
  return {
    sessionId: s.id,
    planId: s.planId,
    planDayIndex: s.planDayIndex,
    split: s.split,
    startedAt: s.startedAt,
    finishedAt: s.finishedAt ?? nowIso(),
    notes: s.notes,
    exercises: s.exercises
      .filter((e) => e.sets.length > 0)
      .map((e) => ({
        exerciseId: e.exerciseId,
        sets: e.sets.map((set) => ({
          exerciseId: e.exerciseId,
          setNumber: set.setNumber,
          measure: set.holdSeconds != null ? 'hold' : 'reps',
          reps: set.reps,
          holdSeconds: set.holdSeconds,
          effort: set.effort,
          completedAt: set.completedAt,
        })),
      })),
  };
}

export const useSessionStore = create<SessionState>()(
  persist(
    immer<SessionState>((set, get) => ({
      session: null,
      pendingSets: [],

      start: (plan, day, userId) =>
        set((s) => {
          s.session = buildSession(plan, day, userId);
          s.pendingSets = [];
        }),

      logSet: (input) =>
        set((s) => {
          if (!s.session) return;
          const ex = s.session.exercises.find((e) => e.exerciseId === input.exerciseId);
          if (!ex) return;
          ex.sets.push(toLoggedSet(input));
          s.pendingSets.push(input);
        }),

      removeSet: (exerciseId, setId) =>
        set((s) => {
          const ex = s.session?.exercises.find((e) => e.exerciseId === exerciseId);
          if (ex) ex.sets = ex.sets.filter((x) => x.id !== setId);
        }),

      setNotes: (notes) =>
        set((s) => {
          if (s.session) s.session.notes = notes;
        }),

      finish: () => {
        const s = get().session;
        if (!s) return { error: 'workouts.error.no_session' };
        const parsed = finishSessionSchema.safeParse(toFinishInput({ ...s, finishedAt: nowIso() }));
        if (!parsed.success) {
          return { error: parsed.error.issues[0]?.message ?? 'workouts.error.invalid_session' };
        }
        set((d) => {
          d.session = null;
          d.pendingSets = [];
        });
        return { data: parsed.data };
      },

      abandon: () =>
        set((s) => {
          s.session = null;
          s.pendingSets = [];
        }),

      clearPending: () =>
        set((s) => {
          s.pendingSets = [];
        }),
    })),
    {
      name: 'ct.active-session',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      merge: (persisted, current) => {
        const ok = persistedStateSchema.safeParse(persisted);
        return ok.success
          ? { ...current, session: ok.data.session as WorkoutSession | null, pendingSets: ok.data.pendingSets }
          : current;
      },
    },
  ),
);

/** Selectors live next to the store — components never compute in render. */
export const selectTotalReps = (s: SessionState) =>
  s.session?.exercises.reduce(
    (sum, e) => sum + e.sets.reduce((a, x) => a + (x.reps ?? 0), 0),
    0,
  ) ?? 0;

export const selectTotalSets = (s: SessionState) =>
  s.session?.exercises.reduce((n, e) => n + e.sets.length, 0) ?? 0;

export const selectTotalHold = (s: SessionState) =>
  s.session?.exercises.reduce(
    (sum, e) => sum + e.sets.reduce((a, x) => a + (x.holdSeconds ?? 0), 0),
    0,
  ) ?? 0;
