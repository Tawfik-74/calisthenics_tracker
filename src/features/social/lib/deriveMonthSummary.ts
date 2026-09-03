import type { MemberMonthSummary, MemberRecentSession } from '../model/memberProfile.types';

/** "2026-09-14" in the given zone. */
function dayKey(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(iso));
}

/**
 * Pure: session list -> month summary. No IO, so it is trivially unit-testable.
 *
 * activeDays is bucketed in the MEMBER's time zone, not the viewer's. A 00:30
 * session in Istanbul is one day there and the previous day in UTC — using the
 * viewer's clock would let the same session count as a different day for each
 * squadmate looking at it.
 */
export function deriveMonthSummary(
  sessions: MemberRecentSession[],
  timeZone: string,
): MemberMonthSummary {
  return {
    totalSessions: sessions.length,
    totalReps: sessions.reduce((a, s) => a + s.totalReps, 0),
    totalHoldSeconds: sessions.reduce((a, s) => a + s.totalHoldSeconds, 0),
    activeDays: new Set(sessions.map((s) => dayKey(s.finishedAt, timeZone))).size,
  };
}
