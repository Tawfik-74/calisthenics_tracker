import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { z } from 'zod';
import { asId, nowIso, type UserId } from '@/shared/types/ids';
import { Err, Ok, type Result } from '@/shared/types/result';
import { SQUAD_MAX_MEMBERS, type SquadMember } from './squad.types';
import { syntheticStanding, uuidFromHandle } from '../lib/squadMock';

export type SquadError = 'squad_full' | 'duplicate' | 'cannot_remove_owner' | 'not_found';

function seedMember(
  id: string,
  displayName: string,
  role: 'owner' | 'member',
  joinedAt: string,
): SquadMember {
  return {
    userId: asId<'UserId'>(id),
    displayName,
    avatarUrl: null,
    role,
    joinedAt: joinedAt as SquadMember['joinedAt'],
    ...syntheticStanding(displayName),
  };
}

export const SQUAD_NAME = 'Bar Brothers';

export const SQUAD_SEED: SquadMember[] = [
  seedMember('00000000-0000-4000-8000-000000000001', 'Omer', 'owner', '2026-02-01T08:00:00.000Z'),
  seedMember('00000000-0000-4000-8000-000000000002', 'Layla', 'member', '2026-02-03T08:00:00.000Z'),
  seedMember('00000000-0000-4000-8000-000000000003', 'Sami', 'member', '2026-02-05T08:00:00.000Z'),
];

interface SquadStoreState {
  squadName: string;
  members: SquadMember[];
  addMember: (handle: string) => Result<SquadMember, SquadError>;
  removeMember: (userId: UserId) => Result<void, SquadError>;
  reset: () => void;
}

const persistedSquadSchema = z.object({
  squadName: z.string(),
  members: z.array(
    z.object({
      userId: z.string(),
      displayName: z.string(),
      avatarUrl: z.string().nullable(),
      role: z.enum(['owner', 'member']),
      joinedAt: z.string(),
      status: z.enum(['active', 'resting']),
      streak: z.number(),
    }),
  ),
});

const freshSeed = () => SQUAD_SEED.map((m) => ({ ...m }));

/**
 * Authoritative squad roster in offline / mock mode. `squadApi` delegates here
 * when Supabase is not configured; TanStack Query remains the read path for UI.
 */
export const useSquadStore = create<SquadStoreState>()(
  persist(
    immer<SquadStoreState>((set, get) => ({
      squadName: SQUAD_NAME,
      members: freshSeed(),

      addMember: (handle) => {
        const clean = handle.trim();
        const { members } = get();

        const id = uuidFromHandle(clean);
        if (members.some((m) => m.userId === id)) return Err('duplicate');
        if (members.length >= SQUAD_MAX_MEMBERS) return Err('squad_full');

        const member: SquadMember = {
          userId: asId(id),
          displayName: clean,
          avatarUrl: null,
          role: 'member',
          joinedAt: nowIso(),
          ...syntheticStanding(clean),
        };
        set((s) => {
          s.members.push(member);
        });
        return Ok(member);
      },

      removeMember: (userId) => {
        const target = get().members.find((m) => m.userId === userId);
        if (!target) return Err('not_found');
        if (target.role === 'owner') return Err('cannot_remove_owner');
        set((s) => {
          s.members = s.members.filter((m) => m.userId !== userId);
        });
        return Ok(undefined);
      },

      reset: () =>
        set((s) => {
          s.squadName = SQUAD_NAME;
          s.members = freshSeed();
        }),
    })),
    {
      name: 'ct.squad',
      storage: createJSONStorage(() => localStorage),
      version: 1,
      merge: (persisted, current) => {
        const parsed = persistedSquadSchema.safeParse(persisted);
        return parsed.success
          ? { ...current, squadName: parsed.data.squadName, members: parsed.data.members as SquadMember[] }
          : current;
      },
    },
  ),
);

export const selectMembers = (s: SquadStoreState) => s.members;
export const selectMemberCount = (s: SquadStoreState) => s.members.length;
