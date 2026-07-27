import type { MapProjectFilters } from '../hooks/useProjects';

/**
 * Centralized key factory. Keeping this in one place — rather than each
 * hook inlining its own array — means the query key's shape can't drift as
 * more hooks (project detail, bookmarks, etc.) get added in later phases.
 */
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: MapProjectFilters) => [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (idOrSlug: string) => [...projectKeys.details(), idOrSlug] as const,
  updates: (idOrSlug: string) => [...projectKeys.detail(idOrSlug), 'updates'] as const,
  reports: (idOrSlug: string) => [...projectKeys.detail(idOrSlug), 'reports'] as const,
};
