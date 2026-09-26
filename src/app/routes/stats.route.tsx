import { useTranslation } from 'react-i18next';
import { MonthlyDashboard, WeightCheckInCard } from '@/features/stats';
import { useAssessment } from '@/features/plan';
import { useNutritionStore } from '@/features/nutrition';
import { useAuthStore } from '@/features/auth';

export function StatsRoute() {
  const { t } = useTranslation('stats');
  const { assessment } = useAssessment();
  const userId = useAuthStore((state) => state.session!.user.id);
  const calorieAdjustment = useNutritionStore((state) => state.calorieAdjustment);
  const setCalorieAdjustment = useNutritionStore((state) => state.setCalorieAdjustment);
  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-xl font-bold">{t('title')}</h1>
      {assessment && (
        <WeightCheckInCard
          goal={assessment.nutritionGoal}
          userId={userId}
          defaultWeight={assessment.weightKg}
          calorieAdjustment={calorieAdjustment}
          onApplyAdjustment={(calories) => setCalorieAdjustment(calories, userId)}
        />
      )}
      <MonthlyDashboard />
    </div>
  );
}
