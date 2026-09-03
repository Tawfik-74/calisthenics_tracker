import { z } from 'zod';

export const generatePlanSchema = z.object({
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  daysPerWeek: z.union([z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
});
export type GeneratePlanInput = z.infer<typeof generatePlanSchema>;

const plannedExerciseSchema = z.object({
  exerciseId: z.string().uuid(),
  sets: z.number().int().min(1).max(10),
  targetReps: z.number().int().min(1).max(100).nullable(),
  targetHoldSeconds: z.number().int().min(3).max(300).nullable(),
  restSeconds: z.number().int().min(15).max(300),
  noteKey: z.string().optional(),
});

export const planDaySchema = z.object({
  dayIndex: z.number().int().min(0).max(6),
  split: z.enum(['push', 'pull', 'legs', 'core', 'rest']),
  exercises: z.array(plannedExerciseSchema),
});

export const workoutPlanSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
  level: z.enum(['beginner', 'intermediate', 'advanced']),
  daysPerWeek: z.union([z.literal(3), z.literal(4), z.literal(5), z.literal(6)]),
  generatedAt: z.string().datetime(),
  archivedAt: z.string().datetime().nullable(),
  days: z.array(planDaySchema).length(7),
});
