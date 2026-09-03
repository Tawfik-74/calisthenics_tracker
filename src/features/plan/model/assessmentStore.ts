import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { nowIso } from '@/shared/types/ids';
import type { Assessment } from './assessment.types';
import { persistedAssessmentSchema, type AssessmentInput } from './assessment.schema';

interface AssessmentState {
  assessment: Assessment | null;
  save: (input: AssessmentInput) => void;
  clear: () => void;
}

export const useAssessmentStore = create<AssessmentState>()(
  persist(
    immer<AssessmentState>((set) => ({
      assessment: null,

      save: (input) =>
        set((s) => {
          s.assessment = { ...input, takenAt: nowIso() };
        }),

      clear: () =>
        set((s) => {
          s.assessment = null;
        }),
    })),
    {
      name: 'ct.assessment',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      merge: (persisted, current) => {
        const parsed = persistedAssessmentSchema.safeParse(persisted);
        return parsed.success
          ? { ...current, assessment: parsed.data.assessment as Assessment | null }
          : current;
      },
    },
  ),
);

export const selectHasAssessment = (s: AssessmentState) => s.assessment !== null;
