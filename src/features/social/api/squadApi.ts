import { supabase } from '@/shared/lib/supabase';
import { asId, nowIso, type SquadId, type UserId } from '@/shared/types/ids';
import type { Squad, SquadMember } from '../model/squad.types';
import type { AddMemberInput, InviteFriendsInput } from '../model/squad.schema';
import { useSquadStore } from '../model/squadStore';

const MOCK_SQUAD: Squad = {
  id: asId('00000000-0000-4000-8000-0000000000aa'),
  name: 'Bar Brothers',
  createdAt: '2026-02-01T08:00:00.000Z' as Squad['createdAt'],
  members: [
    {
      userId: asId('00000000-0000-4000-8000-000000000001'),
      displayName: 'Omer',
      avatarUrl: null,
      role: 'owner',
      joinedAt: '2026-02-01T08:00:00.000Z' as Squad['createdAt'],
      status: 'active',
      streak: 6,
    },
    {
      userId: asId('00000000-0000-4000-8000-000000000002'),
      displayName: 'Layla',
      avatarUrl: null,
      role: 'member',
      joinedAt: '2026-02-03T08:00:00.000Z' as Squad['createdAt'],
      status: 'active',
      streak: 11,
    },
    {
      userId: asId('00000000-0000-4000-8000-000000000003'),
      displayName: 'Sami',
      avatarUrl: null,
      role: 'member',
      joinedAt: '2026-02-05T08:00:00.000Z' as Squad['createdAt'],
      status: 'resting',
      streak: 2,
    },
  ],
};

async function currentSquadId(): Promise<SquadId | null> {
  const squad = await squadApi.mine();
  return squad?.id ?? null;
}

export const squadApi = {
  async mine(): Promise<Squad | null> {
    if (!supabase) {
      const { squadName, members } = useSquadStore.getState();
      return { id: MOCK_SQUAD.id, name: squadName, createdAt: MOCK_SQUAD.createdAt, members };
    }
    const { data } = await supabase
      .from('squads')
      .select('id, name, created_at, squad_members(user_id, role, joined_at, profiles(display_name, avatar_url))')
      .maybeSingle();
    if (!data) return null;
    return {
      id: asId(data.id),
      name: data.name,
      createdAt: data.created_at,
      members: (data.squad_members ?? []).map((m: Record<string, unknown>) => ({
        userId: asId(m.user_id as string),
        displayName: ((m.profiles as Record<string, unknown>)?.display_name as string) ?? 'Athlete',
        avatarUrl: ((m.profiles as Record<string, unknown>)?.avatar_url as string) ?? null,
        role: m.role as 'owner' | 'member',
        joinedAt: m.joined_at as Squad['createdAt'],
        // Real-mode standing derivation from workout_sessions is out of scope for
        // this slice; safe defaults keep the type intact.
        status: 'active' as const,
        streak: 0,
      })),
    };
  },

  async create(name: string): Promise<Squad> {
    if (!supabase) return { ...MOCK_SQUAD, name };
    const { data, error } = await supabase.from('squads').insert({ name }).select().single();
    if (error) throw error;
    return { id: asId(data.id), name: data.name, createdAt: data.created_at, members: [] };
  },

  async addMember(input: AddMemberInput): Promise<SquadMember> {
    if (!supabase) {
      const result = useSquadStore.getState().addMember(input.handle);
      if (!result.ok) throw new Error(`social:error.${result.error}`);
      return result.value;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, display_name, avatar_url')
      .ilike('display_name', input.handle)
      .maybeSingle();
    if (!profile) throw new Error('social:error.handle_not_found');

    const squadId = await currentSquadId();
    if (!squadId) throw new Error('social:error.not_found');

    const { error } = await supabase
      .from('squad_members')
      .insert({ squad_id: squadId, user_id: profile.id, role: 'member' });
    if (error) {
      throw new Error(
        /SQUAD_FULL/.test(error.message) ? 'social:error.squad_full' : 'social:error.invite_failed',
      );
    }

    return {
      userId: asId(profile.id),
      displayName: profile.display_name,
      avatarUrl: profile.avatar_url ?? null,
      role: 'member',
      joinedAt: nowIso(),
      status: 'active',
      streak: 0,
    };
  },

  async removeMember(userId: UserId): Promise<void> {
    if (!supabase) {
      const result = useSquadStore.getState().removeMember(userId);
      if (!result.ok) throw new Error(`social:error.${result.error}`);
      return;
    }
    const squadId = await currentSquadId();
    if (!squadId) return;
    await supabase.from('squad_members').delete().eq('squad_id', squadId).eq('user_id', userId);
  },

  async invite(input: InviteFriendsInput): Promise<{ invited: number }> {
    if (!supabase) return { invited: input.emails.length };
    const { error } = await supabase.functions.invoke('invite-squad', { body: input });
    if (error) throw error;
    return { invited: input.emails.length };
  },

  async leave(squadId: SquadId): Promise<void> {
    if (!supabase) return;
    await supabase.from('squad_members').delete().eq('squad_id', squadId);
  },

  _mock: MOCK_SQUAD,
  _now: nowIso,
};
