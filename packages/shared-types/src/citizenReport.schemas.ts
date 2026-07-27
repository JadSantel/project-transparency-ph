import { z } from 'zod';
import { paginationQuerySchema } from './pagination.schema.js';
import { citizenReportCategorySchema } from './enums.js';

// latitude/longitude are optional - the web app captures them via the
// browser Geolocation API when the form loads, but a citizen who denies
// location permission (or is on a device without it) can still submit a
// report; schema.prisma's `location` column is nullable for exactly this
// reason ("captured independently of the project's own location").
export const createCitizenReportSchema = z.object({
  category: citizenReportCategorySchema,
  comment: z.string().min(1).max(2000).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});
export type CreateCitizenReportInput = z.infer<typeof createCitizenReportSchema>;

// No status filter here: the public GET endpoint always returns APPROVED
// reports only (moderation gate - see citizen-report.service.ts), so
// there's nothing for a query param to select between yet. A moderator-
// facing PENDING queue would be a separate, authenticated query schema in
// a future phase.
export const citizenReportsQuerySchema = paginationQuerySchema;
export type CitizenReportsQuery = z.infer<typeof citizenReportsQuerySchema>;
