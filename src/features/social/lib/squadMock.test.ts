import { describe, expect, it } from 'vitest';
import { addMemberSchema } from '../model/squad.schema';
import { syntheticStanding, uuidFromHandle } from './squadMock';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-8[0-9a-f]{3}-[0-9a-f]{12}$/;

describe('uuidFromHandle', () => {
  it('produces a v4-shaped uuid', () => {
    expect(uuidFromHandle('layla')).toMatch(UUID_V4);
  });

  it('is stable and case-insensitive for the same handle', () => {
    expect(uuidFromHandle('Layla')).toBe(uuidFromHandle('layla'));
  });

  it('differs between handles', () => {
    expect(uuidFromHandle('layla')).not.toBe(uuidFromHandle('sami'));
  });
});

describe('syntheticStanding', () => {
  it('is deterministic per handle', () => {
    expect(syntheticStanding('sami')).toEqual(syntheticStanding('sami'));
  });

  it('keeps the streak within range', () => {
    for (const h of ['a', 'coach', 'omar', 'nina', 'bruno', 'zed']) {
      const { streak } = syntheticStanding(h);
      expect(streak).toBeGreaterThanOrEqual(0);
      expect(streak).toBeLessThanOrEqual(21);
    }
  });
});

describe('addMemberSchema', () => {
  it('rejects a too-short handle', () => {
    const r = addMemberSchema.safeParse({ handle: 'a' });
    expect(r.success === false && r.error.issues[0]?.message).toBe('social:error.handle_short');
  });

  it('rejects a too-long handle', () => {
    const r = addMemberSchema.safeParse({ handle: 'x'.repeat(25) });
    expect(r.success === false && r.error.issues[0]?.message).toBe('social:error.handle_long');
  });

  it('rejects illegal characters', () => {
    const r = addMemberSchema.safeParse({ handle: 'bad name!' });
    expect(r.success === false && r.error.issues[0]?.message).toBe('social:error.handle_chars');
  });

  it('accepts a clean handle', () => {
    expect(addMemberSchema.safeParse({ handle: 'coach_omar' }).success).toBe(true);
  });
});
