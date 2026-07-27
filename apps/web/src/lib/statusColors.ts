import type { ProjectStatus } from '@transparency-ph/shared-types';
import { PROJECT_STATUSES } from '@transparency-ph/shared-types';

/**
 * Single source of truth for status -> color. Both the MapLibre paint
 * expression (map.ts) and the StatusLegend component read from this table,
 * so the pins on the map and the legend explaining them can never drift
 * apart. Hex values mirror the `status` scale in tailwind.config.js —
 * duplicated (not read from Tailwind at runtime) because MapLibre paint
 * expressions need literal hex strings, not CSS classes.
 */
export const STATUS_COLORS: Record<ProjectStatus, string> = {
  PLANNING: '#78829A',
  PROCUREMENT: '#8B5CF6',
  ONGOING: '#1D8A5E',
  PAUSED: '#D9A441',
  DELAYED: '#E0632B',
  COMPLETED: '#2153C7',
  CANCELLED: '#C23B3B',
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  PLANNING: 'Planning',
  PROCUREMENT: 'Procurement',
  ONGOING: 'Ongoing',
  PAUSED: 'Paused',
  DELAYED: 'Delayed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
};

/** Ordered for the legend — roughly the lifecycle a project moves through. */
export const STATUS_ORDER: ProjectStatus[] = [
  'PLANNING',
  'PROCUREMENT',
  'ONGOING',
  'PAUSED',
  'DELAYED',
  'COMPLETED',
  'CANCELLED',
];

// Sanity check at module load, not runtime cost worth guarding: if a status
// is ever added to the enum without updating the tables above, fail loudly
// in dev rather than silently rendering an uncolored pin.
if (import.meta.env.DEV) {
  for (const status of PROJECT_STATUSES) {
    if (!(status in STATUS_COLORS) || !(status in STATUS_LABELS)) {
      // eslint-disable-next-line no-console
      console.error(`statusColors.ts is missing an entry for "${status}"`);
    }
  }
}
