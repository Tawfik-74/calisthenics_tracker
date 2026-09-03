import type { Split } from '../model/plan.types';

/**
 * PPL-based day templates keyed by training days per week. Index 0 = Monday.
 * Non-listed days are 'rest'.
 */
export const SPLIT_TEMPLATES: Record<3 | 4 | 5 | 6, Split[]> = {
  3: ['push', 'rest', 'pull', 'rest', 'legs', 'rest', 'rest'],
  4: ['push', 'pull', 'rest', 'legs', 'core', 'rest', 'rest'],
  5: ['push', 'pull', 'legs', 'rest', 'core', 'push', 'rest'],
  6: ['push', 'pull', 'legs', 'core', 'push', 'pull', 'rest'],
};
