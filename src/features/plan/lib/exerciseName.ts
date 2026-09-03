import type { TFunction } from 'i18next';
import type { ExerciseId } from '@/shared/types/ids';
import { exerciseById } from './moves';

/** Resolve an exercise id to a localized name. Falls back to the slug. */
export function exerciseName(t: TFunction, exerciseId: ExerciseId): string {
  const slug = exerciseById.get(exerciseId)?.slug ?? 'unknown';
  return t(`plan:exercise.${slug}`, { defaultValue: slug.replace(/_/g, ' ') });
}
