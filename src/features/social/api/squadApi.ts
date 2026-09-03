import { supabase } from '@/shared/lib/supabase';
import { asId, nowIso, type SquadId } from '@/shared/types/ids';
import type { Squad } from '../model/squad.types';
import type { InviteFriendsInput } from '../model/squad.schema';

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
    },
    {
      userId: asId('00000000-0000-4000-8000-000000000002'),
      displayName: 'Layla',
      avatarUrl: null,
      role: 'member',
      joinedAt: '2026-02-03T08:00:00.000Z' as Squad['createdAt'],
    },
    {
      userId: asId('00000000-0000-4000-8000-000000000003'),
      displayName: 'Sami',
      avatarUrl: null,
      role: 'member',
      joinedAt: '2026-02-05T08:00:00.000Z' as Squad['createdAt'],
    },
  ],
};

export const squadApi = {
  async mine(): Promise<Squad | null> {
    if (!supabase) return MOCK_SQUAD;
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
      })),
    };
  },

  async create(name: string): Promise<Squad> {
    if (!supabase) return { ...MOCK_SQUAD, name };
    const { data, error } = await supabase.from('squads').insert({ name }).select().single();
    if (error) throw error;
    return { id: asId(data.id), name: data.name, createdAt: data.created_at, members: [] };
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
