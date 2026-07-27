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

// Mirrors schema.prisma's ProjectUpdateType enum on ProjectUpdate.
export const PROJECT_UPDATE_TYPES = ['MILESTONE', 'PROGRESS', 'STATUS_CHANGE'] as const;
export const projectUpdateTypeSchema = z.enum(PROJECT_UPDATE_TYPES);
export type ProjectUpdateType = z.infer<typeof projectUpdateTypeSchema>;

// Mirrors schema.prisma's UserRole enum on User.
export const USER_ROLES = ['CITIZEN', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'] as const;
export const userRoleSchema = z.enum(USER_ROLES);
export type UserRole = z.infer<typeof userRoleSchema>;

// Mirrors schema.prisma's CitizenReportCategory enum on CitizenReport.
export const CITIZEN_REPORT_CATEGORIES = [
  'NO_ACTIVITY',
  'ROAD_DAMAGE',
  'SAFETY_ISSUE',
  'DELAY',
  'COMPLETED',
  'OTHER',
] as const;
export const citizenReportCategorySchema = z.enum(CITIZEN_REPORT_CATEGORIES);
export type CitizenReportCategory = z.infer<typeof citizenReportCategorySchema>;

// Mirrors schema.prisma's CitizenReportStatus enum on CitizenReport.
export const CITIZEN_REPORT_STATUSES = ['PENDING', 'APPROVED', 'REJECTED'] as const;
export const citizenReportStatusSchema = z.enum(CITIZEN_REPORT_STATUSES);
export type CitizenReportStatus = z.infer<typeof citizenReportStatusSchema>;
