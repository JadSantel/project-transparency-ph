import { useQuery } from '@tanstack/react-query';
import { apiRequest, ApiError } from '../lib/apiClient';
import { projectKeys } from '../lib/queryKeys';
import type { ProjectUpdatesResponse } from '../lib/types';

// Matches the API's projectUpdatesQuerySchema default — a project's full
// timeline is meant to be read in one scroll, not paged through, so this
// is generous rather than list-page-sized.
const UPDATES_PAGE_SIZE = 50;

export function useProjectUpdates(idOrSlug: string | undefined) {
  return useQuery<ProjectUpdatesResponse, ApiError>({
    queryKey: projectKeys.updates(idOrSlug ?? ''),
    queryFn: ({ signal }) =>
      apiRequest<ProjectUpdatesResponse>(`/projects/${idOrSlug}/updates`, {
        query: { limit: UPDATES_PAGE_SIZE },
        signal,
      }),
    enabled: idOrSlug !== undefined,
  });
}
