import { z } from 'zod';

const uuid = z.string().uuid();

/** Logging ONE set. Fires dozens of times per session — keep it cheap. */
export const logSetSchema = z
  .object({
    exerciseId: uuid,
    setNumber: z.number().int().positive().max(50),
    measure: z.enum(['reps', 'hold']),
    reps: z.number().int().min(0).max(500).nullable().default(null),
    holdSeconds: z.number().int().min(0).max(1800).nullable().default(null),
    effort: z.number().int().min(1).max(10).nullable().default(null),
    completedAt: z.string().datetime(),
  })
  .superRefine((v, ctx) => {
    if (v.measure === 'reps') {
      if (v.reps === null)
        ctx.addIssue({ code: 'custom', path: ['reps'], message: 'workouts:error.reps_required' });
      if (v.holdSeconds !== null)
        ctx.addIssue({ code: 'custom', path: ['holdSeconds'], message: 'workouts:error.hold_not_applicable' });
    } else {
      if (v.holdSeconds === null)
        ctx.addIssue({ code: 'custom', path: ['holdSeconds'], message: 'workouts:error.hold_required' });
      if (v.reps !== null)
        ctx.addIssue({ code: 'custom', path: ['reps'], message: 'workouts:error.reps_not_applicable' });
    }
  });
export type LogSetInput = z.infer<typeof logSetSchema>;

/** The whole session, validated once on finish before it's persisted. */
export const finishSessionSchema = z
  .object({
    sessionId: uuid,
    planId: uuid,
    planDayIndex: z.number().int().min(0).max(6),
    split: z.enum(['push', 'pull', 'legs', 'core']),
    startedAt: z.string().datetime(),
    finishedAt: z.string().datetime(),
    notes: z.string().trim().max(500).nullable().default(null),
    exercises: z
      .array(
        z.object({
          exerciseId: uuid,
          sets: z.array(logSetSchema).min(1, { message: 'workouts:error.no_sets' }),
        }),
      )
      .min(1, { message: 'workouts:error.no_exercises' }),
  })
  .refine((v) => new Date(v.finishedAt) > new Date(v.startedAt), {
    message: 'workouts:error.end_before_start',
    path: ['finishedAt'],
  })
  .refine((v) => Date.now() - new Date(v.startedAt).getTime() < 12 * 60 * 60 * 1000, {
    message: 'workouts:error.session_too_old',
    path: ['startedAt'],
  });
export type FinishSessionInput = z.infer<typeof finishSessionSchema>;

/** Guards rehydration from localStorage. Looser than finishSessionSchema. */
export const persistedStateSchema = z.object({
  session: z
    .object({
      id: uuid,
      userId: uuid,
      planId: uuid,
      planDayIndex: z.number().int().min(0).max(6),
      split: z.enum(['push', 'pull', 'legs', 'core']),
      status: z.literal('active'),
      startedAt: z.string().datetime(),
      finishedAt: z.null().default(null),
      exercises: z.array(
        z.object({
          exerciseId: uuid,
          sets: z.array(
            z.object({
              id: uuid,
              setNumber: z.number().int().positive(),
              reps: z.number().int().nullable(),
              holdSeconds: z.number().int().nullable(),
              effort: z.number().int().nullable(),
              completedAt: z.string().datetime(),
            }),
          ),
        }),
      ),
      notes: z.string().nullable(),
    })
    .nullable(),
  pendingSets: z.array(logSetSchema).default([]),
});
export type PersistedState = z.infer<typeof persistedStateSchema>;
