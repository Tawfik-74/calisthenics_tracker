import type { IsoDateTime, SquadId, UserId } from '@/shared/types/ids';

export const SQUAD_MAX_MEMBERS = 4;

export interface SquadMember {
  userId: UserId;
  displayName: string;
  avatarUrl: string | null;
  role: 'owner' | 'member';
  joinedAt: IsoDateTime;
}

export interface Squad {
  id: SquadId;
  name: string;
  members: SquadMember[]; // length <= SQUAD_MAX_MEMBERS
  createdAt: IsoDateTime;
}

export type NudgeMessageKey = 'nudge.workout_time' | 'nudge.finished' | 'nudge.streak';

export interface Nudge {
  id: string;
  squadId: SquadId;
  senderId: UserId;
  senderName: string;
  /** Resolved in each recipient's OWN locale — not the sender's. */
  messageKey: NudgeMessageKey;
  sentAt: IsoDateTime;
}
