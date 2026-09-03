import type { SquadMemberStatus } from '../model/squad.types';

/** FNV-1a, 32-bit, seedable. Deterministic per input. */
function fnv1a(input: string, seed = 0x811c9dc5): number {
  let h = seed >>> 0;
  for (let i = 0; i < input.length; i += 1) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

const hex8 = (n: number) => (n >>> 0).toString(16).padStart(8, '0');
const norm = (handle: string) => handle.trim().toLowerCase();

/**
 * A stable, v4-shaped UUID derived from a handle — so re-adding the same
 * username in offline mode always maps to the same synthetic member.
 */
export function uuidFromHandle(handle: string): string {
  const key = norm(handle);
  const a = fnv1a(key);
  const b = fnv1a(key, a ^ 0x9e3779b9);
  const c = fnv1a(key, b ^ 0x85ebca77);
  const d = fnv1a(key, c ^ 0xc2b2ae3d);
  const s = hex8(a) + hex8(b) + hex8(c) + hex8(d);
  return [
    s.slice(0, 8),
    s.slice(8, 12),
    `4${s.slice(13, 16)}`,
    `8${s.slice(17, 20)}`,
    s.slice(20, 32),
  ].join('-');
}

/** Deterministic pseudo-standing for a synthetic squadmate. */
export function syntheticStanding(handle: string): {
  status: SquadMemberStatus;
  streak: number;
} {
  const h = fnv1a(norm(handle), 0xcafebabe);
  return {
    streak: h % 22, // 0..21
    status: h % 3 === 0 ? 'resting' : 'active',
  };
}
