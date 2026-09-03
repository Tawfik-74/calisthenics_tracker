import type { IsoDateTime, SquadId, UserId } from '@/shared/types/ids';
import type { Locale } from '@/shared/types/locale';

export type { Locale };

export type FitnessLevel = 'beginner' | 'intermediate' | 'advanced';

export interface User {
  id: UserId;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  level: FitnessLevel;
  daysPerWeek: 3 | 4 | 5 | 6;
  locale: Locale;
  /** IANA zone, e.g. "Europe/Istanbul". Nudges respect each member's clock. */
  timeZone: string;
  /** Local wall-clock "HH:mm" — survives DST and travel; a UTC instant doesn't. */
  scheduledWorkoutTime: string;
  squadId: SquadId | null;
  createdAt: IsoDateTime;
}

export type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthSession {
  user: User;
  accessToken: string;
  expiresAt: IsoDateTime;
}
