import { z } from 'zod';

/**
 * Zod owns every boundary — an RPC response is untrusted input just like a
 * Realtime payload. Snake_case in (Postgres), camelCase out (domain).
 */
export const memberSessionRowSchema = z.object({
  session_id: z.string().uuid(),
  split: z.enum(['push', 'pull', 'legs', 'core']),
  finished_at: z.string(),
  total_reps: z.coerce.number(),
  total_hold_seconds: z.coerce.number(),
  total_sets: z.coerce.number(),
});

export const memberSessionsResponseSchema = z.array(memberSessionRowSchema);
export type MemberSessionRow = z.infer<typeof memberSessionRowSchema>;

/** Squadmate-visible slice of `profiles`. */
export const memberProfileRowSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string().min(1).max(32),
  avatar_url: z.string().nullable().default(null),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  time_zone: z.string().min(1),
  created_at: z.string(),
});
export type MemberProfileRow = z.infer<typeof memberProfileRowSchema>;
