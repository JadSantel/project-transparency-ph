import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { ProjectCategory, ProjectStatus } from '@transparency-ph/shared-types';
import { PROJECT_CATEGORIES, PROJECT_STATUSES } from '@transparency-ph/shared-types';
import { CATEGORY_PARAM, STATUS_PARAM, parseActiveSet, serializeActiveSet } from '../lib/urlFilters';

/**
 * Owns which statuses and categories are currently "on". Backed by the
 * URL's ?status=&category= params (not local state) so a filtered view
 * (e.g. "just delayed projects") is a link a citizen can copy and share,
 * and refreshing the page keeps the same filter instead of resetting to
 * "everything on" - fits the civic-transparency angle of the project.
 *
 * Both dimensions still default to "everything on" when their param is
 * absent, same as before URL-sync: a first-time visitor sees every
 * project, not an empty map, and an unfiltered "/" visit stays a clean
 * URL instead of always spelling out every status/category.
 *
 * Toggling uses `{ replace: true }` on the URL update rather than pushing
 * a new history entry per click - otherwise every legend/dropdown click
 * would need its own back-button press to undo, which reads as broken
 * rather than as a filter.
 */
export function useProjectFilters() {
  const [searchParams, setSearchParams] = useSearchParams();

  const activeStatuses = useMemo(
    () => parseActiveSet(searchParams.get(STATUS_PARAM), PROJECT_STATUSES),
    [searchParams],
  );
  const activeCategories = useMemo(
    () => parseActiveSet(searchParams.get(CATEGORY_PARAM), PROJECT_CATEGORIES),
    [searchParams],
  );

  const applyStatuses = useCallback(
    (next: Set<ProjectStatus>) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          const serialized = serializeActiveSet(next, PROJECT_STATUSES);
          if (serialized === null) {
            params.delete(STATUS_PARAM);
          } else {
            params.set(STATUS_PARAM, serialized);
          }
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const applyCategories = useCallback(
    (next: Set<ProjectCategory>) => {
      setSearchParams(
        (prev) => {
          const params = new URLSearchParams(prev);
          const serialized = serializeActiveSet(next, PROJECT_CATEGORIES);
          if (serialized === null) {
            params.delete(CATEGORY_PARAM);
          } else {
            params.set(CATEGORY_PARAM, serialized);
          }
          return params;
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  function toggleStatus(status: ProjectStatus) {
    const next = new Set(activeStatuses);
    next.has(status) ? next.delete(status) : next.add(status);
    applyStatuses(next);
  }

  function toggleCategory(category: ProjectCategory) {
    const next = new Set(activeCategories);
    next.has(category) ? next.delete(category) : next.add(category);
    applyCategories(next);
  }

  function clearAll() {
    setSearchParams(
      (prev) => {
        const params = new URLSearchParams(prev);
        params.delete(STATUS_PARAM);
        params.delete(CATEGORY_PARAM);
        return params;
      },
      { replace: true },
    );
  }

  const isFiltered =
    activeStatuses.size < PROJECT_STATUSES.length || activeCategories.size < PROJECT_CATEGORIES.length;

  return {
    activeStatuses,
    activeCategories,
    toggleStatus,
    toggleCategory,
    clearAll,
    isFiltered,
  };
}

export type ProjectFilters = ReturnType<typeof useProjectFilters>;
