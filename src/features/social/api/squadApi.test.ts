import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/shared/lib/supabase', () => ({
  supabase: null,
  requireSupabase: () => {
    throw new Error('not configured');
  },
}));

import { useSquadStore } from '../model/squadStore';
import { squadApi } from './squadApi';

describe('squadApi (mock mode)', () => {
  beforeEach(() => {
    localStorage.clear();
    useSquadStore.getState().reset();
  });

  it('returns the seeded roster', async () => {
    const squad = await squadApi.mine();
    expect(squad?.members).toHaveLength(3);
  });

  it('adds a member and reflects it in mine()', async () => {
    const member = await squadApi.addMember({ handle: 'nina' });
    expect(member.displayName).toBe('nina');
    const squad = await squadApi.mine();
    expect(squad?.members).toHaveLength(4);
  });

  it('rejects an add past the cap with an i18n key', async () => {
    await squadApi.addMember({ handle: 'nina' });
    await expect(squadApi.addMember({ handle: 'bruno' })).rejects.toThrow('social:error.squad_full');
  });

  it('removes a member', async () => {
    const member = await squadApi.addMember({ handle: 'nina' });
    await squadApi.removeMember(member.userId);
    const squad = await squadApi.mine();
    expect(squad?.members).toHaveLength(3);
  });
});
