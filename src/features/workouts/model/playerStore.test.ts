import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { asId, type ExerciseId } from '@/shared/types/ids';
import type { PlayerStep } from './player.types';
import {
  selectActiveRemainingMs,
  selectCurrentStep,
  selectElapsedMs,
  selectRestRemainingMs,
  usePlayerStore,
} from './playerStore';

const ex = (n: number): ExerciseId => asId(`00000000-0000-4000-9000-00000000000${n}`);

const step = (over: Partial<PlayerStep> = {}): PlayerStep => ({
  exerciseId: ex(1),
  slug: 'push_up',
  nameKey: 'plan:exercise.push_up',
  cueKeys: ['a', 'b', 'c'],
  measure: 'reps',
  targetReps: 10,
  targetHoldSeconds: null,
  restSeconds: 60,
  exerciseIndex: 0,
  setNumber: 1,
  totalSets: 1,
  isLast: false,
  ...over,
});

/** Two exercises: 2 rep sets, then 1 timed set (20s hold). */
function demoSteps(): PlayerStep[] {
  return [
    step({ exerciseIndex: 0, setNumber: 1 }),
    step({ exerciseIndex: 0, setNumber: 2 }),
    step({
      exerciseId: ex(2),
      slug: 'l_sit',
      measure: 'hold',
      targetReps: null,
      targetHoldSeconds: 20,
      exerciseIndex: 1,
      setNumber: 1,
      restSeconds: 45,
    }),
  ];
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date('2026-09-06T10:00:00.000Z'));
  usePlayerStore.getState().reset();
});
afterEach(() => vi.useRealTimers());

describe('load / buildSteps normalisation', () => {
  it('renumbers sets, totals and the final flag', () => {
    usePlayerStore.getState().load(demoSteps());
    const { steps } = usePlayerStore.getState();
    expect(steps.map((s) => [s.exerciseIndex, s.setNumber, s.totalSets, s.isLast])).toEqual([
      [0, 1, 2, false],
      [0, 2, 2, false],
      [1, 1, 1, true],
    ]);
    expect(usePlayerStore.getState().status).toBe('idle');
  });

  it('resumes at a given completed count', () => {
    usePlayerStore.getState().load(demoSteps(), 2);
    expect(usePlayerStore.getState().stepIndex).toBe(2);
    expect(usePlayerStore.getState().completedSteps).toBe(2);
  });
});

describe('rep set → rest → next set', () => {
  it('completeSet moves active → resting and logs the rep count', () => {
    const s = usePlayerStore.getState();
    s.load(demoSteps());
    s.start();
    expect(usePlayerStore.getState().status).toBe('active');

    usePlayerStore.getState().completeSet();
    const st = usePlayerStore.getState();
    expect(st.status).toBe('resting');
    expect(st.stepIndex).toBe(1);
    expect(st.completedSteps).toBe(1);
    expect(st.lastCompleted).toMatchObject({ setNumber: 1, measure: 'reps', reps: 10 });
    expect(selectRestRemainingMs(usePlayerStore.getState())).toBe(60_000);
  });

  it('the rest countdown auto-advances to the next active set', () => {
    const s = usePlayerStore.getState();
    s.load(demoSteps());
    s.start();
    s.completeSet();

    vi.advanceTimersByTime(59_000);
    usePlayerStore.getState().tick();
    expect(usePlayerStore.getState().status).toBe('resting');

    vi.advanceTimersByTime(2_000);
    usePlayerStore.getState().tick();
    expect(usePlayerStore.getState().status).toBe('active');
    expect(selectCurrentStep(usePlayerStore.getState())?.setNumber).toBe(2);
  });

  it('skipRest ends the rest immediately', () => {
    const s = usePlayerStore.getState();
    s.load(demoSteps());
    s.start();
    s.completeSet();
    usePlayerStore.getState().skipRest();
    expect(usePlayerStore.getState().status).toBe('active');
    expect(selectRestRemainingMs(usePlayerStore.getState())).toBe(0);
  });
});

describe('timed set', () => {
  it('starts a countdown and auto-completes when it hits zero', () => {
    const s = usePlayerStore.getState();
    s.load(demoSteps(), 2); // jump to the hold set
    s.start();
    expect(usePlayerStore.getState().status).toBe('active');
    expect(selectActiveRemainingMs(usePlayerStore.getState())).toBe(20_000);

    vi.advanceTimersByTime(21_000);
    usePlayerStore.getState().tick();

    const st = usePlayerStore.getState();
    expect(st.status).toBe('completed');
    expect(st.lastCompleted).toMatchObject({ measure: 'hold', holdSeconds: 20 });
  });

  it('restartActive resets the countdown', () => {
    const s = usePlayerStore.getState();
    s.load(demoSteps(), 2);
    s.start();
    vi.advanceTimersByTime(12_000);
    usePlayerStore.getState().tick();
    usePlayerStore.getState().restartActive();
    expect(selectActiveRemainingMs(usePlayerStore.getState())).toBe(20_000);
  });
});

describe('completion', () => {
  it('the last set completes the workout with no rest', () => {
    const s = usePlayerStore.getState();
    s.load(demoSteps());
    s.start();
    s.completeSet(); // set 1 -> rest
    usePlayerStore.getState().skipRest();
    usePlayerStore.getState().completeSet(); // set 2 -> rest
    usePlayerStore.getState().skipRest();
    usePlayerStore.getState().completeSet(); // hold set -> done

    const st = usePlayerStore.getState();
    expect(st.status).toBe('completed');
    expect(st.completedSteps).toBe(3);
    expect(selectRestRemainingMs(st)).toBe(0);
  });
});

describe('pause / resume', () => {
  it('freezes elapsed and shifts the rest deadline forward', () => {
    const s = usePlayerStore.getState();
    s.load(demoSteps());
    s.start();

    vi.advanceTimersByTime(10_000);
    usePlayerStore.getState().tick();
    expect(selectElapsedMs(usePlayerStore.getState())).toBe(10_000);

    usePlayerStore.getState().completeSet(); // resting, 60s
    usePlayerStore.getState().pause();
    vi.advanceTimersByTime(30_000); // 30s away
    usePlayerStore.getState().tick(); // no-op while paused
    expect(selectElapsedMs(usePlayerStore.getState())).toBe(10_000);
    expect(selectRestRemainingMs(usePlayerStore.getState())).toBe(60_000);

    usePlayerStore.getState().resume();
    expect(usePlayerStore.getState().status).toBe('resting');
    vi.advanceTimersByTime(1_000);
    usePlayerStore.getState().tick();
    expect(selectRestRemainingMs(usePlayerStore.getState())).toBe(59_000);
  });
});

describe('adjustRest', () => {
  it('adds and removes time within bounds', () => {
    const s = usePlayerStore.getState();
    s.load([step({ restSeconds: 60 }), step({ setNumber: 2 })]);
    s.start();
    s.completeSet();

    usePlayerStore.getState().adjustRest(15_000);
    expect(selectRestRemainingMs(usePlayerStore.getState())).toBe(75_000);

    usePlayerStore.getState().adjustRest(-999_000); // clamps to 5s min
    expect(selectRestRemainingMs(usePlayerStore.getState())).toBe(5_000);
  });
});

describe('addSet', () => {
  it('inserts a set after the current one and renumbers', () => {
    const s = usePlayerStore.getState();
    s.load(demoSteps());
    s.start();
    usePlayerStore.getState().addSet();

    const { steps } = usePlayerStore.getState();
    expect(steps).toHaveLength(4);
    expect(steps.filter((x) => x.exerciseIndex === 0).map((x) => x.setNumber)).toEqual([1, 2, 3]);
    expect(steps[steps.length - 1].isLast).toBe(true);
  });
});
