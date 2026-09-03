/**
 * Branded IDs — you can't pass a UserId where an ExerciseId is expected.
 * At runtime these are plain strings; the brand exists only in the type system.
 */
declare const brand: unique symbol;
type Brand<T, B> = T & { readonly [brand]: B };

export type UserId = Brand<string, 'UserId'>;
export type SquadId = Brand<string, 'SquadId'>;
export type ExerciseId = Brand<string, 'ExerciseId'>;
export type SessionId = Brand<string, 'SessionId'>;
export type PlanId = Brand<string, 'PlanId'>;

/** ISO-8601 UTC instant, e.g. "2026-09-01T05:30:00.000Z" */
export type IsoDateTime = Brand<string, 'IsoDateTime'>;

/** "2026-09" */
export type MonthKey = Brand<string, 'MonthKey'>;

export const asId = <B extends string>(v: string): Brand<string, B> => v as Brand<string, B>;
export const nowIso = (): IsoDateTime => new Date().toISOString() as IsoDateTime;
