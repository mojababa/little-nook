/**
 * What domain service functions return when an operation can be refused for a
 * domain reason (validation, rule violation). Unexpected failures still throw.
 */
export type Result<T, E extends string = string> =
  { ok: true; value: T } | { ok: false; error: E };

export const ok = <T = undefined>(value?: T): Result<T, never> => ({
  ok: true,
  value: value as T,
});

export const err = <E extends string>(error: E): Result<never, E> => ({
  ok: false,
  error,
});
