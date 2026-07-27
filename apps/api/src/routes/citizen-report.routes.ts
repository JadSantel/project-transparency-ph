import { citizenReportsQuerySchema, createCitizenReportSchema } from '@transparency-ph/shared-types';
import { Router } from 'express';
import * as citizenReportController from '../controllers/citizen-report.controller.js';
import { authenticate } from '../middlewares/authenticate.js';
import { validate } from '../middlewares/validate.js';

// Mounted at /projects/:idOrSlug/reports (nested under projectRouter, the
// same way project.routes.ts nests GET /:idOrSlug/updates). `mergeParams`
// is required so req.params.idOrSlug from the parent router is visible
// here.
export const citizenReportRouter = Router({ mergeParams: true });

// Public - anyone can view a project's (approved) reports, per the
// product decision that this is a transparency tool, not a gated one.
citizenReportRouter.get(
  '/',
  validate(citizenReportsQuerySchema, 'query'),
  citizenReportController.listReports,
);

// Authenticated - a report must be attributable to a real user.
citizenReportRouter.post(
  '/',
  authenticate,
  validate(createCitizenReportSchema, 'body'),
  citizenReportController.submitReport,
);
