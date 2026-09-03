import { useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/config/queryKeys';
import { useAuthStore } from '@/features/auth';
import type { AssessmentResult } from '../model/assessment.types';
import type { AssessmentInput } from '../model/assessment.schema';
import { useAssessmentStore } from '../model/assessmentStore';
import { assess } from './planGenerator';
import { planApi } from '../api/planApi';

export interface UseAssessment {
  assessment: ReturnType<typeof useAssessmentStore.getState>['assessment'];
  result: AssessmentResult | null;
  save: (input: AssessmentInput) => Promise<void>;
  clear: () => void;
}

/** Reads the persisted assessment, derives its metrics, and regenerates the plan on save. */
export function useAssessment(): UseAssessment {
  const qc = useQueryClient();
  const userId = useAuthStore((s) => s.session?.user.id ?? null);
  const assessment = useAssessmentStore((s) => s.assessment);
  const saveStore = useAssessmentStore((s) => s.save);
  const clearStore = useAssessmentStore((s) => s.clear);

  const result = useMemo<AssessmentResult | null>(
    () => (assessment ? assess(assessment) : null),
    [assessment],
  );

  const save = async (input: AssessmentInput) => {
    saveStore(input);
    if (!userId) return;
    const r = assess({ ...input, takenAt: new Date().toISOString() as never });
    const plan = await planApi.regenerate(userId, r.tier, r.daysPerWeek);
    qc.setQueryData(queryKeys.plan.current(userId), plan);
  };

  const clear = () => {
    clearStore();
    try {
      localStorage.removeItem('ct.plan');
    } catch {
      /* storage unavailable — nothing to clear */
    }
    if (userId) qc.removeQueries({ queryKey: queryKeys.plan.current(userId) });
  };

  return { assessment, result, save, clear };
}
