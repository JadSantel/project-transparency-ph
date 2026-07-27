import type { CitizenReportsQuery, CreateCitizenReportInput } from '@transparency-ph/shared-types';
import { Request, Response } from 'express';
import { AppError } from '../middlewares/errorHandler.js';
import * as citizenReportService from '../services/citizen-report.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const listReports = asyncHandler(async (req: Request, res: Response) => {
  const result = await citizenReportService.listApprovedReports(
    req.params.idOrSlug,
    req.query as unknown as CitizenReportsQuery,
  );
  res.status(200).json(result);
});

export const submitReport = asyncHandler(async (req: Request, res: Response) => {
  // This route is mounted behind the `authenticate` middleware in
  // citizen-report.routes.ts, so req.user should always be set here - the
  // check mirrors auth.controller.ts's `me` handler rather than asserting
  // non-null, in case route wiring ever changes.
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  const result = await citizenReportService.submitReport(
    req.params.idOrSlug,
    req.user.id,
    req.body as CreateCitizenReportInput,
  );
  res.status(201).json({ data: result });
});
