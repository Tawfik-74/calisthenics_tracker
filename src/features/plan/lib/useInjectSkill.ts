import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { produce } from 'immer';
import { queryKeys } from '@/shared/config/queryKeys';
import { useAuthStore } from '@/features/auth';
import type { WorkoutPlan } from '../model/plan.types';
import type { SkillProgression } from '../model/skill.types';
import { injectableExercises } from './skillTree';
import { usePlan } from './usePlan';
import { planApi } from '../api/planApi';

export interface UseInjectSkill {
  /** True once a saved plan exists to inject into. */
  ready: boolean;
  /** How many prerequisite exercises a skill would add to the plan. */
  countFor: (progression: SkillProgression) => number;
  /** Append a skill's prerequisites to every matching split day and persist. */
  inject: (progression: SkillProgression) => Promise<number>;
}

/**
 * Injects a target skill's catalog-backed prerequisites into the user's current
 * plan. Prereqs land on every day whose split matches `primarySplit`; if the
 * plan has no such day they go on the first training day. Persists through
 * `planApi.savePlan` and refreshes the query cache — same write path as the
 * plan editor.
 */
export function useInjectSkill(): UseInjectSkill {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id ?? null);
  const { data: plan } = usePlan();

  const countFor = useCallback(
    (progression: SkillProgression) => injectableExercises(progression).length,
    [],
  );

  const inject = useCallback(
    async (progression: SkillProgression): Promise<number> => {
      if (!plan || !userId) return 0;
      const additions = injectableExercises(progression);
      if (additions.length === 0) return 0;

      let added = 0;
      const next: WorkoutPlan = produce(plan, (draft) => {
        const matching = draft.days.filter((d) => d.split === progression.primarySplit);
        const targets = matching.length
          ? matching
          : draft.days.filter((d) => d.split !== 'rest').slice(0, 1);

        for (const day of targets) {
          for (const row of additions) {
            if (day.exercises.some((e) => e.exerciseId === row.exerciseId)) continue;
            day.exercises.push({ ...row });
            added += 1;
          }
        }
      });

      if (added === 0) return 0;
      const saved = await planApi.savePlan(userId, next);
      qc.setQueryData(queryKeys.plan.current(userId), saved);
      return added;
    },
    [plan, qc, userId],
  );

  return { ready: Boolean(plan && userId), countFor, inject };
}
