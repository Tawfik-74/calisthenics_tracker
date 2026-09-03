import { z } from 'zod';
import { SQUAD_MAX_MEMBERS } from './squad.types';

export const inviteFriendsSchema = z.object({
  squadId: z.string().uuid(),
  emails: z
    .array(z.string().email({ message: 'social:error.email_invalid' }).trim().toLowerCase())
    .min(1, { message: 'social:error.at_least_one' })
    .max(SQUAD_MAX_MEMBERS - 1, { message: 'social:error.squad_full' })
    .refine((list) => new Set(list).size === list.length, {
      message: 'social:error.duplicate_emails',
    }),
  messageKey: z.enum(['invite.default', 'invite.friendly']).default('invite.default'),
});
export type InviteFriendsInput = z.infer<typeof inviteFriendsSchema>;

export const sendNudgeSchema = z.object({
  squadId: z.string().uuid(),
  messageKey: z.enum(['nudge.workout_time', 'nudge.finished', 'nudge.streak']),
});
export type SendNudgeInput = z.infer<typeof sendNudgeSchema>;

/** Parsed on the RECEIVING client — a Realtime payload is untrusted input. */
export const nudgePayloadSchema = z.object({
  id: z.string().uuid(),
  squadId: z.string().uuid(),
  senderId: z.string().uuid(),
  senderName: z.string().min(1).max(32),
  messageKey: z.enum(['nudge.workout_time', 'nudge.finished', 'nudge.streak']),
  sentAt: z.string().datetime(),
});
export type NudgePayload = z.infer<typeof nudgePayloadSchema>;
