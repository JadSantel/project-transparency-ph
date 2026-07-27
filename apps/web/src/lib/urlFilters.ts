/**
 * Pure encode/decode helpers for syncing filter state to the URL, kept out
 * of useProjectFilters.ts so the URL <-> Set mapping is testable on its
 * own, same rationale as lib/filterProjects.ts being separate from
 * MapView.
 */

export const STATUS_PARAM = 'status';
export const CATEGORY_PARAM = 'category';

// Sentinel for "the user explicitly selected zero values in this
// dimension" - distinct from the param being absent (which means
// "everything on", the default). Without this, serializing an empty Set
// would produce an empty string param, which is indistinguishable from a
// malformed/missing one and would silently reset back to "everything on".
const NONE = 'none';

export function parseActiveSet<T extends string>(raw: string | null, allValues: readonly T[]): Set<T> {
  if (raw === null) return new Set(allValues);
  if (raw === NONE) return new Set();

  const valid = new Set<string>(allValues);
  const parsed = raw.split(',').filter((value) => valid.has(value)) as T[];

  // A param that's present but entirely unrecognized (typo'd or tampered
  // link) falls back to "everything on" rather than rendering an empty
  // map with no explanation.
  return parsed.length > 0 ? new Set(parsed) : new Set(allValues);
}

// Returns null when the set is "everything on" (the default) so the
// caller can omit the param entirely and keep a clean URL for the
// unfiltered case, rather than always spelling out every value.
export function serializeActiveSet<T extends string>(
  active: ReadonlySet<T>,
  allValues: readonly T[],
): string | null {
  if (active.size === allValues.length) return null;
  if (active.size === 0) return NONE;
  // Serialized in allValues' canonical order (not insertion/toggle order)
  // so the same filter selection always produces the same URL regardless
  // of which order the user clicked things in.
  return allValues.filter((value) => active.has(value)).join(',');
}
