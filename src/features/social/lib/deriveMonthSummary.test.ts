import { describe, expect, it } from 'vitest';
import { asId } from '@/shared/types/ids';
import type { MemberRecentSession } from '../model/memberProfile.types';
import { deriveMonthSummary } from './deriveMonthSummary';

function session(finishedAt: string, reps: number): MemberRecentSession {
  return {
    sessionId: asId(crypto.randomUUID()),
    split: 'push',
    finishedAt: finishedAt as MemberRecentSession['finishedAt'],
    totalReps: reps,
    totalHoldSeconds: 0,
    totalSets: 3,
  };
}

describe('deriveMonthSummary', () => {
  it('sums reps and counts sessions', () => {
    const s = deriveMonthSummary(
      [session('2026-09-02T18:30:00.000Z', 30), session('2026-09-04T18:30:00.000Z', 24)],
      'UTC',
    );
    expect(s.totalSessions).toBe(2);
    expect(s.totalReps).toBe(54);
    expect(s.activeDays).toBe(2);
  });

  it('counts two sessions on the same local day as one active day', () => {
    const s = deriveMonthSummary(
      [session('2026-09-02T07:00:00.000Z', 20), session('2026-09-02T18:00:00.000Z', 20)],
      'UTC',
    );
    expect(s.activeDays).toBe(1);
  });

  it("buckets active days by the member's zone, not UTC", () => {
    // 21:30 UTC on Sep 1 is 00:30 on Sep 2 in Istanbul (UTC+3).
    const sessions = [
      session('2026-09-01T21:30:00.000Z', 20),
      session('2026-09-02T09:00:00.000Z', 20),
    ];
    expect(deriveMonthSummary(sessions, 'UTC').activeDays).toBe(2);
    // Same instant, same member: both land on Sep 2 locally -> one active day.
    expect(deriveMonthSummary(sessions, 'Europe/Istanbul').activeDays).toBe(1);
  });

  it('is zero-safe for a member with no sessions', () => {
    const s = deriveMonthSummary([], 'UTC');
    expect(s).toEqual({ totalSessions: 0, totalReps: 0, totalHoldSeconds: 0, activeDays: 0 });
  });
});
