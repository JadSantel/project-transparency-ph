import type { ProjectCategory, ProjectStatus } from '@transparency-ph/shared-types';
import type { ProjectListItem } from './types';

/**
 * Applies the active status/category selections to an already-fetched list
 * of projects. Kept as a pure function (no React, no map) so it's testable
 * on its own and MapView doesn't need to know how filtering works, only
 * that it needs to happen before building the GeoJSON feature collection.
 *
 * An empty Set is treated as "hide everything in that dimension" — the
 * literal meaning of "zero statuses selected" — not "no filter applied".
 * useProjectFilters is what guarantees both sets start full.
 */
export function filterByActiveSet(
  projects: ProjectListItem[],
  activeStatuses: ReadonlySet<ProjectStatus>,
  activeCategories: ReadonlySet<ProjectCategory>,
): ProjectListItem[] {
  return projects.filter(
    (project) => activeStatuses.has(project.status) && activeCategories.has(project.category),
  );
}
