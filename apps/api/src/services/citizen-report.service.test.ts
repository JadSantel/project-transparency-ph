import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateCitizenReportInput } from '@transparency-ph/shared-types';

vi.mock('../repositories/citizen-report.repository.js', () => ({
  findApprovedByProjectId: vi.fn(),
  create: vi.fn(),
}));

vi.mock('../repositories/project.repository.js', () => ({
  findByIdOrSlug: vi.fn(),
}));

import * as citizenReportRepository from '../repositories/citizen-report.repository.js';
import * as projectRepository from '../repositories/project.repository.js';
import * as citizenReportService from './citizen-report.service.js';

const baseInput: CreateCitizenReportInput = {
  category: 'ROAD_DAMAGE',
  comment: 'Pothole has grown significantly since last week.',
  latitude: 8.4822,
  longitude: 124.6319,
};

describe('citizen-report.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws a 404 when listing reports for a project that does not exist', async () => {
    vi.mocked(projectRepository.findByIdOrSlug).mockResolvedValue(null);

    await expect(citizenReportService.listApprovedReports('missing-slug', { page: 1, limit: 20 })).rejects.toMatchObject(
      { statusCode: 404 },
    );
    expect(citizenReportRepository.findApprovedByProjectId).not.toHaveBeenCalled();
  });

  it('resolves idOrSlug to the project id before listing approved reports', async () => {
    vi.mocked(projectRepository.findByIdOrSlug).mockResolvedValue({ id: 'project-1' } as never);
    vi.mocked(citizenReportRepository.findApprovedByProjectId).mockResolvedValue({ rows: [], total: 0 });

    const result = await citizenReportService.listApprovedReports('some-slug', { page: 1, limit: 20 });

    expect(citizenReportRepository.findApprovedByProjectId).toHaveBeenCalledWith('project-1', {
      page: 1,
      limit: 20,
    });
    expect(result).toEqual({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });
  });

  it('throws a 404 when submitting a report for a project that does not exist', async () => {
    vi.mocked(projectRepository.findByIdOrSlug).mockResolvedValue(null);

    await expect(citizenReportService.submitReport('missing-slug', 'user-1', baseInput)).rejects.toMatchObject({
      statusCode: 404,
    });
    expect(citizenReportRepository.create).not.toHaveBeenCalled();
  });

  it('submits a report attributed to the resolved project and given userId', async () => {
    vi.mocked(projectRepository.findByIdOrSlug).mockResolvedValue({ id: 'project-1' } as never);
    vi.mocked(citizenReportRepository.create).mockResolvedValue('report-1');

    const result = await citizenReportService.submitReport('some-slug', 'user-1', baseInput);

    expect(citizenReportRepository.create).toHaveBeenCalledWith('project-1', 'user-1', baseInput);
    expect(result).toEqual({ id: 'report-1', status: 'PENDING' });
  });
});
