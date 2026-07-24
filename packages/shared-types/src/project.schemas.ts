import { z } from 'zod';
import { paginationQuerySchema } from './pagination.schema.js';
import { projectCategorySchema, projectStatusSchema } from './enums.js';

export const createProjectSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().min(10),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  barangayId: z.string().uuid(),
  category: projectCategorySchema,
  status: projectStatusSchema.default('PLANNING'),
  budget: z.number().positive(),
  fundingSource: z.string().optional(),
  implementingAgencyId: z.string().uuid(),
  contractorId: z.string().uuid().optional(),
  consultantId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  targetCompletion: z.coerce.date().optional(),
  progressPercentage: z.number().int().min(0).max(100).default(0),
});
export type CreateProjectInput = z.infer<typeof createProjectSchema>;

// Partial, since PATCH /projects/:id only requires the fields being changed.
export const updateProjectSchema = createProjectSchema.partial();
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;

export const projectQuerySchema = paginationQuerySchema.extend({
  search: z.string().optional(),
  status: projectStatusSchema.optional(),
  category: projectCategorySchema.optional(),
  agencyId: z.string().uuid().optional(),
  contractorId: z.string().uuid().optional(),
  regionId: z.string().uuid().optional(),
  cityId: z.string().uuid().optional(),
  barangayId: z.string().uuid().optional(),
  minBudget: z.coerce.number().nonnegative().optional(),
  maxBudget: z.coerce.number().nonnegative().optional(),
  minProgress: z.coerce.number().int().min(0).max(100).optional(),
  maxProgress: z.coerce.number().int().min(0).max(100).optional(),
  completionYear: z.coerce.number().int().min(2000).max(2100).optional(),
  // "minLng,minLat,maxLng,maxLat" - the visible map viewport, so the API
  // only returns pins actually on screen instead of every project nationwide.
  bbox: z
    .string()
    .regex(
      /^-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?,-?\d+(\.\d+)?$/,
      'bbox must be "minLng,minLat,maxLng,maxLat"',
    )
    .optional(),
  sortBy: z.enum(['createdAt', 'budget', 'progressPercentage', 'startDate', 'name']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});
export type ProjectQuery = z.infer<typeof projectQuerySchema>;
