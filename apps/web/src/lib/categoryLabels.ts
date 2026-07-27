import type { ProjectCategory } from '@transparency-ph/shared-types';
import { PROJECT_CATEGORIES } from '@transparency-ph/shared-types';

/**
 * Categories don't drive pin color (only status does), so this file is
 * simpler than statusColors.ts — just display labels, in a sensible order
 * for a checklist UI. Mirrors its "fail loudly in dev if the enum grows and
 * this table doesn't" pattern.
 */
export const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  ROAD: 'Road',
  BRIDGE: 'Bridge',
  FLOOD_CONTROL: 'Flood control',
  DRAINAGE: 'Drainage',
  WATER: 'Water',
  POWER: 'Power',
  HOSPITAL: 'Hospital',
  SCHOOL: 'School',
  BUILDING: 'Building',
  TRANSPORTATION: 'Transportation',
};

export const CATEGORY_ORDER: ProjectCategory[] = [
  'ROAD',
  'BRIDGE',
  'FLOOD_CONTROL',
  'DRAINAGE',
  'WATER',
  'POWER',
  'HOSPITAL',
  'SCHOOL',
  'BUILDING',
  'TRANSPORTATION',
];

if (import.meta.env.DEV) {
  for (const category of PROJECT_CATEGORIES) {
    if (!(category in CATEGORY_LABELS)) {
      // eslint-disable-next-line no-console
      console.error(`categoryLabels.ts is missing an entry for "${category}"`);
    }
  }
}
