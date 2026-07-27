import { useQuery } from '@tanstack/react-query';
import { apiRequest, ApiError } from '../lib/apiClient';
import { projectKeys } from '../lib/queryKeys';
import type { ProjectDetailResponse } from '../lib/types';

/**
 * Fetches a single project by id or slug for the detail page. Unlike
 * useProjects (bbox-gated, viewport-driven), this only needs the route
 * param to be present.
 *
 * Explicit ApiError generic (rather than the default Error) so pages can
 * branch on `.status` (e.g. 404 -> "not found" vs any other -> generic
 * error) without a cast.
 */
export function useProject(idOrSlug: string | undefined) {
  return useQuery<ProjectDetailResponse, ApiError>({
    queryKey: projectKeys.detail(idOrSlug ?? ''),
    queryFn: ({ signal }) => apiRequest<ProjectDetailResponse>(`/projects/${idOrSlug}`, { signal }),
    enabled: idOrSlug !== undefined,
  });
}
