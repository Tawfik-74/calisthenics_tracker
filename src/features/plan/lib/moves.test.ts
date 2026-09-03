import { describe, expect, it } from 'vitest';
import { MOVES, moveById, moveBySlug, EXERCISES, exerciseById, exerciseBySlug } from './moves';

describe('moves library', () => {
  it('has 20 movements with unique ids and slugs', () => {
    expect(MOVES).toHaveLength(20);
    expect(new Set(MOVES.map((m) => m.id)).size).toBe(20);
    expect(new Set(MOVES.map((m) => m.slug)).size).toBe(20);
  });

  it('every regressionOf points at a known move', () => {
    for (const m of MOVES) {
      if (m.regressionOf !== null) expect(moveById.has(m.regressionOf)).toBe(true);
    }
  });

  it('derives i18n keys from the slug', () => {
    for (const m of MOVES) {
      expect(m.nameKey).toBe(`plan:exercise.${m.slug}`);
      expect(m.cueKeys).toEqual([
        `plan:cue.${m.slug}.0`,
        `plan:cue.${m.slug}.1`,
        `plan:cue.${m.slug}.2`,
      ]);
    }
  });

  it('reps moves carry reps, hold moves carry hold', () => {
    for (const m of MOVES) {
      if (m.measure === 'reps') {
        expect(m.defaultReps).not.toBeNull();
        expect(m.defaultHoldSeconds).toBeNull();
      } else {
        expect(m.defaultHoldSeconds).not.toBeNull();
        expect(m.defaultReps).toBeNull();
      }
    }
  });

  it('exposes a backward-compatible Exercise catalog', () => {
    expect(EXERCISES).toHaveLength(20);
    for (const e of EXERCISES) {
      expect(['push', 'pull', 'legs', 'core']).toContain(e.pattern);
    }
    const pushUp = exerciseBySlug.get('push_up');
    expect(pushUp).toBeDefined();
    expect(pushUp?.measure).toBe('reps');
    expect(exerciseById.get(pushUp!.id)?.slug).toBe('push_up');
  });

  it('includes the new decline_push_up move', () => {
    const decline = moveBySlug.get('decline_push_up');
    expect(decline?.muscleGroup).toBe('push');
    expect(decline?.difficulty).toBe('intermediate');
  });
});
