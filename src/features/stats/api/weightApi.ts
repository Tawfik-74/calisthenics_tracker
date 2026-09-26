import { supabase } from '@/shared/lib/supabase';
import type { WeighIn } from '../lib/adaptiveNutrition';

export const weightApi = {
  async list(userId: string): Promise<WeighIn[] | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.from('weigh_ins').select('measured_on,weight_kg').eq('user_id', userId).order('measured_on');
    if (error) throw error;
    return (data ?? []).map((row) => ({ date: row.measured_on, weightKg: Number(row.weight_kg) }));
  },
  async save(userId: string, entry: WeighIn) {
    if (!supabase) return;
    const { error } = await supabase.from('weigh_ins').upsert(
      { user_id: userId, measured_on: entry.date, weight_kg: entry.weightKg },
      { onConflict: 'user_id,measured_on' },
    );
    if (error) throw error;
  },
};
