import type { CitizenReportCategory } from '@transparency-ph/shared-types';
import { CITIZEN_REPORT_CATEGORIES } from '@transparency-ph/shared-types';

// Same "fail loudly in dev if the enum grows and this table doesn't"
// pattern as categoryLabels.ts.
export const CITIZEN_REPORT_CATEGORY_LABELS: Record<CitizenReportCategory, string> = {
  NO_ACTIVITY: 'No activity on site',
  ROAD_DAMAGE: 'Road damage',
  SAFETY_ISSUE: 'Safety issue',
  DELAY: 'Delay',
  COMPLETED: 'Looks completed',
  OTHER: 'Other',
};

export const CITIZEN_REPORT_CATEGORY_ORDER: CitizenReportCategory[] = [
  'NO_ACTIVITY',
  'ROAD_DAMAGE',
  'SAFETY_ISSUE',
  'DELAY',
  'COMPLETED',
  'OTHER',
];

if (import.meta.env.DEV) {
  for (const category of CITIZEN_REPORT_CATEGORIES) {
    if (!(category in CITIZEN_REPORT_CATEGORY_LABELS)) {
      // eslint-disable-next-line no-console
      console.error(`citizenReportLabels.ts is missing an entry for "${category}"`);
    }
  }
}
