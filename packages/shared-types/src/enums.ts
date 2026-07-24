import { z } from 'zod';

/**
 * These mirror the enums in apps/api/prisma/schema.prisma exactly. They're
 * duplicated here - not imported from @prisma/client - because the web app
 * can't depend on @prisma/client (it's a backend-only generated package
 * tied to a native query engine). This is a deliberate, contained break from
 * "single source of truth": if you add a category or status, update BOTH
 * schema.prisma and this file. A comment in schema.prisma points here as a
 * reminder.
 */
export const PROJECT_CATEGORIES = [
  'ROAD',
  'BRIDGE',
  'HOSPITAL',
  'SCHOOL',
  'DRAINAGE',
  'FLOOD_CONTROL',
  'BUILDING',
  'WATER',
  'POWER',
  'TRANSPORTATION',
] as const;
export const projectCategorySchema = z.enum(PROJECT_CATEGORIES);
export type ProjectCategory = z.infer<typeof projectCategorySchema>;

export const PROJECT_STATUSES = [
  'PLANNING',
  'PROCUREMENT',
  'ONGOING',
  'PAUSED',
  'DELAYED',
  'COMPLETED',
  'CANCELLED',
] as const;
export const projectStatusSchema = z.enum(PROJECT_STATUSES);
export type ProjectStatus = z.infer<typeof projectStatusSchema>;
