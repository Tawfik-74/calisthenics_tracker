import type { MonthKey } from '@/shared/types/ids';

export const queryKeys = {
  auth: {
    session: () => ['auth', 'session'] as const,
  },
  plan: {
    current: (userId: string) => ['plan', 'current', userId] as const,
  },
  sessions: {
    list: () => ['sessions', 'list'] as const,
    detail: (id: string) => ['sessions', 'detail', id] as const,
  },
  squad: {
    mine: () => ['squad', 'mine'] as const,
    /** A squadmate's profile for one month. */
    member: (userId: string, month: MonthKey) => ['squad', 'member', userId, month] as const,
  },
  stats: {
    /**
     * userId comes BEFORE month so `all(userId)` is a prefix of every month.
     * Finishing a session can change both the current month and the previous
     * month's comparison ratio, so invalidation targets the user, not a month.
     */
    all: (userId: string) => ['stats', userId] as const,
    month: (userId: string, month: MonthKey) => ['stats', userId, 'month', month] as const,
  },
} as const;
