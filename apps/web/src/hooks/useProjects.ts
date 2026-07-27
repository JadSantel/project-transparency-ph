import { useQuery } from '@tanstack/react-query';
import type { ProjectCategory, ProjectStatus } from '@transparency-ph/shared-types';
import { apiRequest } from '../lib/apiClient';
import { projectKeys } from '../lib/queryKeys';
import type { ProjectListResponse } from '../lib/types';

export interface MapProjectFilters {
  bbox: string | null;
  status?: ProjectStatus;
  category?: ProjectCategory;
}

// The map is meant to show every pin in view, not a paginated slice of it —
// 200 comfortably covers a city-level viewport at once. If nationwide
// zoomed-out browsing later shows more pins than that in a single bbox,
// that's a Phase-3.x follow-up (likely: don't cluster-fetch below a zoom
// threshold), not something to solve speculatively now.
const MAP_PAGE_SIZE = 200;

/**
 * Fetches projects within the current map viewport. `bbox: null` (map not
 * yet initialized) short-circuits via `enabled` rather than hitting the API
 * with an unbounded query.
 */
export function useProjects(filters: MapProjectFilters) {
  return useQuery({
    queryKey: projectKeys.list(filters),
    queryFn: ({ signal }) =>
      apiRequest<ProjectListResponse>('/projects', {
        query: {
          bbox: filters.bbox ?? undefined,
          status: filters.status,
          category: filters.category,
          limit: MAP_PAGE_SIZE,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
        signal,
      }),
    enabled: filters.bbox !== null,
    placeholderData: (previousData) => previousData, // keep old pins visible while panning, avoid flicker
  });
}
