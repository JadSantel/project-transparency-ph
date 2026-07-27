import { useQuery } from '@tanstack/react-query';
import { apiRequest, ApiError } from '../lib/apiClient';
import { projectKeys } from '../lib/queryKeys';
import type { CitizenReportsResponse } from '../lib/types';

export function useProjectReports(idOrSlug: string | undefined) {
  return useQuery<CitizenReportsResponse, ApiError>({
    queryKey: projectKeys.reports(idOrSlug ?? ''),
    queryFn: ({ signal }) => apiRequest<CitizenReportsResponse>(`/projects/${idOrSlug}/reports`, { signal }),
    enabled: idOrSlug !== undefined,
  });
}
