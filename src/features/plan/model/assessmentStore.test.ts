import { beforeEach, describe, expect, it } from 'vitest';
import { assessmentInputSchema } from './assessment.schema';
import { useAssessmentStore } from './assessmentStore';

const valid = {
  goal: 'strength' as const,
  weightKg: 80,
  heightCm: 180,
  pushUps: 20,
  pullUps: 8,
  dips: 12,
};

describe('assessmentInputSchema', () => {
  it('rejects an out-of-range weight with an i18n key', () => {
    const r = assessmentInputSchema.safeParse({ ...valid, weightKg: 10 });
    expect(r.success).toBe(false);
    expect(r.success === false && r.error.issues[0]?.message).toBe('plan:error.weight_range');
  });

  it('rejects an out-of-range height', () => {
    const r = assessmentInputSchema.safeParse({ ...valid, heightCm: 300 });
    expect(r.success === false && r.error.issues[0]?.message).toBe('plan:error.height_range');
  });

  it('rejects a negative benchmark', () => {
    const r = assessmentInputSchema.safeParse({ ...valid, pushUps: -1 });
    expect(r.success === false && r.error.issues[0]?.message).toBe('plan:error.benchmark_range');
  });

  it('accepts a valid assessment', () => {
    expect(assessmentInputSchema.safeParse(valid).success).toBe(true);
  });
});

describe('useAssessmentStore', () => {
  beforeEach(() => {
    useAssessmentStore.setState({ assessment: null });
    localStorage.clear();
  });

  it('saves an assessment and stamps takenAt', () => {
    useAssessmentStore.getState().save(valid);
    const stored = useAssessmentStore.getState().assessment;
    expect(stored).not.toBeNull();
    expect(typeof stored?.takenAt).toBe('string');
    expect(Number.isNaN(Date.parse(stored!.takenAt))).toBe(false);
  });

  it('clears the assessment', () => {
    useAssessmentStore.getState().save(valid);
    useAssessmentStore.getState().clear();
    expect(useAssessmentStore.getState().assessment).toBeNull();
  });
});
