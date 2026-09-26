import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { z } from 'zod';
import type { WeighIn } from '../lib/adaptiveNutrition';
import { weightApi } from '../api/weightApi';

interface WeightState {
  weighIns: WeighIn[];
  hydrate: (userId: string) => Promise<void>;
  add: (entry: WeighIn, userId?: string) => void;
}

const persistedWeightSchema = z.object({
  weighIns: z.array(
    z.object({
      date: z.string().refine((value) => !Number.isNaN(Date.parse(value))),
      weightKg: z.number().min(30).max(250),
    }),
  ),
});

export const useWeightStore = create<WeightState>()(
  persist(
    (set) => ({
      weighIns: [],
      hydrate: async (userId) => {
        try {
          const remote = await weightApi.list(userId);
          if (remote) set({ weighIns: remote });
        } catch {
          // Keep the persisted offline copy and retry next mount.
        }
      },
      add: (entry, userId) => {
        set((state) => ({
          weighIns: [...state.weighIns.filter((item) => item.date !== entry.date), entry]
            .sort((a, b) => Date.parse(a.date) - Date.parse(b.date))
            .slice(-90),
        }));
        if (userId) void weightApi.save(userId, entry).catch(() => undefined);
      },
    }),
    {
      name: 'ct.weigh-ins',
      storage: createJSONStorage(() => localStorage),
      merge: (persisted, current) => {
        const parsed = persistedWeightSchema.safeParse(persisted);
        return parsed.success ? { ...current, weighIns: parsed.data.weighIns } : current;
      },
    },
  ),
);
