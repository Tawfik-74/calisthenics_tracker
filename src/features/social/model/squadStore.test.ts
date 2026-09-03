import { beforeEach, describe, expect, it } from 'vitest';
import { asId } from '@/shared/types/ids';
import { useSquadStore } from './squadStore';

const OWNER_ID = asId<'UserId'>('00000000-0000-4000-8000-000000000001');

describe('useSquadStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useSquadStore.getState().reset();
  });

  it('seeds three members with one owner', () => {
    const { members } = useSquadStore.getState();
    expect(members).toHaveLength(3);
    expect(members.filter((m) => m.role === 'owner')).toHaveLength(1);
  });

  it('adds a member up to the cap, then refuses', () => {
    const first = useSquadStore.getState().addMember('nina');
    expect(first.ok).toBe(true);
    expect(useSquadStore.getState().members).toHaveLength(4);
    if (first.ok) {
      expect(first.value.role).toBe('member');
      expect(typeof first.value.streak).toBe('number');
      expect(['active', 'resting']).toContain(first.value.status);
    }

    const overflow = useSquadStore.getState().addMember('bruno');
    expect(overflow).toEqual({ ok: false, error: 'squad_full' });
  });

  it('refuses a duplicate handle', () => {
    useSquadStore.getState().addMember('nina');
    const again = useSquadStore.getState().addMember('Nina');
    expect(again).toEqual({ ok: false, error: 'duplicate' });
  });

  it('refuses to remove the owner', () => {
    expect(useSquadStore.getState().removeMember(OWNER_ID)).toEqual({
      ok: false,
      error: 'cannot_remove_owner',
    });
  });

  it('removes an added member', () => {
    const added = useSquadStore.getState().addMember('nina');
    if (!added.ok) throw new Error('expected add to succeed');
    const removed = useSquadStore.getState().removeMember(added.value.userId);
    expect(removed.ok).toBe(true);
    expect(useSquadStore.getState().members).toHaveLength(3);
  });

  it('reports not_found for an unknown id', () => {
    expect(
      useSquadStore.getState().removeMember(asId<'UserId'>('ffffffff-0000-4000-8000-000000000000')),
    ).toEqual({ ok: false, error: 'not_found' });
  });
});
