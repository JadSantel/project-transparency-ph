import type { CitizenReportsQuery, CreateCitizenReportInput } from '@transparency-ph/shared-types';
import { AppError } from '../middlewares/errorHandler.js';
import * as citizenReportRepository from '../repositories/citizen-report.repository.js';
import * as projectRepository from '../repositories/project.repository.js';

// Same pattern as getProjectUpdates in project.service.ts: resolve
// idOrSlug -> project first so an unknown slug 404s consistently, rather
// than the repository silently returning an empty/failed result for a
// project that doesn't exist.
export async function listApprovedReports(idOrSlug: string, query: CitizenReportsQuery) {
  const project = await projectRepository.findByIdOrSlug(idOrSlug);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const { rows, total } = await citizenReportRepository.findApprovedByProjectId(project.id, query);
  return {
    data: rows,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit),
    },
  };
}

// userId is passed in separately (from req.user, set by the authenticate
// middleware) rather than being part of CreateCitizenReportInput - a
// report is always attributed to whoever is actually logged in, never to
// a userId a client could put in the request body.
export async function submitReport(idOrSlug: string, userId: string, input: CreateCitizenReportInput) {
  const project = await projectRepository.findByIdOrSlug(idOrSlug);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const id = await citizenReportRepository.create(project.id, userId, input);
  // Reports start PENDING and aren't publicly visible until a moderator
  // approves them (no moderation UI exists yet - see the Phase 9 README
  // note) - so the response just confirms submission rather than
  // returning a full report object the citizen would expect to then see
  // on the page.
  return { id, status: 'PENDING' as const };
}
