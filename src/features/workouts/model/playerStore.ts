import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { normalizeSteps } from '../lib/playerSteps';
import type { CompletedSet, PlayerStatus, PlayerStep } from './player.types';

const REST_MIN_MS = 5_000;
const REST_MAX_MS = 15 * 60_000;
const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n));

interface PlayerState {
  status: PlayerStatus;
  /** Status to return to after `resume()`. */
  resumeStatus: Exclude<PlayerStatus, 'idle' | 'paused' | 'completed'>;
  steps: PlayerStep[];
  /** Index of the current (active) or upcoming (during rest) step. */
  stepIndex: number;
  /** How many steps have been completed — drives the progress bar. */
  completedSteps: number;

  /** Wall-clock anchors. All times are epoch-ms; `null` when not running. */
  nowMs: number;
  runningSince: number | null;
  restEndsAt: number | null;
  restTotalMs: number;
  activeEndsAt: number | null;
  activeTotalMs: number;
  pausedAt: number | null;

  /** Last completed set — host logs it via an effect keyed on `.key`. */
  lastCompleted: CompletedSet | null;

  load: (steps: PlayerStep[], completed?: number) => void;
  start: () => void;
  tick: () => void;
  completeSet: (actual?: { reps?: number; holdSeconds?: number }) => void;
  skipRest: () => void;
  adjustRest: (deltaMs: number) => void;
  restartActive: () => void;
  addSet: () => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
}

function enterActive(d: PlayerState): void {
  const cur = d.steps[d.stepIndex];
  if (cur?.measure === 'hold') {
    d.activeTotalMs = (cur.targetHoldSeconds ?? 20) * 1000;
    d.activeEndsAt = Date.now() + d.activeTotalMs;
  } else {
    d.activeTotalMs = 0;
    d.activeEndsAt = null;
  }
}

function complete(d: PlayerState, actual: { reps?: number; holdSeconds?: number }): void {
  const cur = d.steps[d.stepIndex];
  if (!cur) return;

  d.lastCompleted = {
    key: crypto.randomUUID(),
    exerciseId: cur.exerciseId,
    setNumber: cur.setNumber,
    measure: cur.measure,
    reps: cur.measure === 'reps' ? (actual.reps ?? cur.targetReps ?? 0) : null,
    holdSeconds:
      cur.measure === 'hold'
        ? (actual.holdSeconds ?? cur.targetHoldSeconds ?? Math.round(d.activeTotalMs / 1000))
        : null,
  };
  d.completedSteps += 1;
  d.activeEndsAt = null;
  d.activeTotalMs = 0;

  if (d.stepIndex >= d.steps.length - 1) {
    d.status = 'completed';
    d.runningSince = null;
    d.restEndsAt = null;
    d.restTotalMs = 0;
    return;
  }

  d.stepIndex += 1;
  d.status = 'resting';
  d.resumeStatus = 'resting';
  d.restTotalMs = Math.max(1000, cur.restSeconds * 1000);
  d.restEndsAt = Date.now() + d.restTotalMs;
}

const EMPTY = {
  status: 'idle' as PlayerStatus,
  resumeStatus: 'active' as PlayerState['resumeStatus'],
  steps: [] as PlayerStep[],
  stepIndex: 0,
  completedSteps: 0,
  nowMs: Date.now(),
  runningSince: null,
  restEndsAt: null,
  restTotalMs: 0,
  activeEndsAt: null,
  activeTotalMs: 0,
  pausedAt: null,
  lastCompleted: null,
};

export const usePlayerStore = create<PlayerState>()(
  immer<PlayerState>((set) => ({
    ...EMPTY,

    load: (steps, completed = 0) =>
      set((d) => {
        const normalized = normalizeSteps(steps.map((s) => ({ ...s })));
        Object.assign(d, EMPTY);
        d.steps = normalized;
        d.completedSteps = Math.min(completed, normalized.length);
        d.stepIndex = Math.min(completed, Math.max(0, normalized.length - 1));
        d.nowMs = Date.now();
      }),

    start: () =>
      set((d) => {
        if (d.steps.length === 0) return;
        d.nowMs = Date.now();
        if (d.completedSteps >= d.steps.length) {
          d.status = 'completed';
          return;
        }
        d.status = 'active';
        d.resumeStatus = 'active';
        d.runningSince = Date.now();
        d.pausedAt = null;
        enterActive(d);
      }),

    tick: () =>
      set((d) => {
        if (d.status !== 'active' && d.status !== 'resting') return;
        d.nowMs = Date.now();

        if (d.status === 'resting' && d.restEndsAt != null && d.nowMs >= d.restEndsAt) {
          d.restEndsAt = null;
          d.restTotalMs = 0;
          d.status = 'active';
          d.resumeStatus = 'active';
          enterActive(d);
          return;
        }
        if (d.status === 'active' && d.activeEndsAt != null && d.nowMs >= d.activeEndsAt) {
          complete(d, { holdSeconds: Math.round(d.activeTotalMs / 1000) });
        }
      }),

    completeSet: (actual) =>
      set((d) => {
        if (d.status !== 'active') return;
        complete(d, actual ?? {});
      }),

    skipRest: () =>
      set((d) => {
        if (d.status !== 'resting') return;
        d.restEndsAt = null;
        d.restTotalMs = 0;
        d.status = 'active';
        d.resumeStatus = 'active';
        d.nowMs = Date.now();
        enterActive(d);
      }),

    adjustRest: (deltaMs) =>
      set((d) => {
        if (d.status !== 'resting' || d.restEndsAt == null) return;
        const remaining = clamp(d.restEndsAt - Date.now() + deltaMs, REST_MIN_MS, REST_MAX_MS);
        d.restEndsAt = Date.now() + remaining;
        d.restTotalMs = Math.max(d.restTotalMs, remaining);
      }),

    restartActive: () =>
      set((d) => {
        if (d.status !== 'active' || d.activeTotalMs === 0) return;
        d.activeEndsAt = Date.now() + d.activeTotalMs;
      }),

    addSet: () =>
      set((d) => {
        const cur = d.steps[d.stepIndex];
        if (!cur) return;
        d.steps.splice(d.stepIndex + 1, 0, { ...cur });
        d.steps = normalizeSteps(d.steps);
      }),

    pause: () =>
      set((d) => {
        if (d.status !== 'active' && d.status !== 'resting') return;
        d.resumeStatus = d.status;
        d.status = 'paused';
        d.pausedAt = Date.now();
      }),

    resume: () =>
      set((d) => {
        if (d.status !== 'paused' || d.pausedAt == null) return;
        const gap = Date.now() - d.pausedAt;
        if (d.runningSince != null) d.runningSince += gap;
        if (d.restEndsAt != null) d.restEndsAt += gap;
        if (d.activeEndsAt != null) d.activeEndsAt += gap;
        d.pausedAt = null;
        d.status = d.resumeStatus;
        d.nowMs = Date.now();
      }),

    reset: () =>
      set((d) => {
        Object.assign(d, EMPTY, { nowMs: Date.now(), steps: [] });
      }),
  })),
);

// ── Selectors ────────────────────────────────────────────────
export const selectElapsedMs = (s: PlayerState) =>
  s.runningSince != null ? Math.max(0, s.nowMs - s.runningSince) : 0;

export const selectRestRemainingMs = (s: PlayerState) =>
  s.restEndsAt != null ? Math.max(0, s.restEndsAt - s.nowMs) : 0;

export const selectActiveRemainingMs = (s: PlayerState) =>
  s.activeEndsAt != null ? Math.max(0, s.activeEndsAt - s.nowMs) : 0;

export const selectCurrentStep = (s: PlayerState): PlayerStep | null =>
  s.steps[s.stepIndex] ?? null;
