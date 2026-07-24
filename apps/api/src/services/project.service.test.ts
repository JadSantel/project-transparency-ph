import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { CreateProjectInput } from '@transparency-ph/shared-types';
import { AppError } from '../middlewares/errorHandler.js';

vi.mock('../repositories/project.repository.js', () => ({
  findMany: vi.fn(),
  findByIdOrSlug: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  softDelete: vi.fn(),
  getBarangayWithGeography: vi.fn(),
  agencyExists: vi.fn(),
  contractorExists: vi.fn(),
  consultantExists: vi.fn(),
  slugExists: vi.fn(),
}));

import * as projectRepository from '../repositories/project.repository.js';
import * as projectService from './project.service.js';

const baseInput: CreateProjectInput = {
  name: 'Carmen Bridge Rehabilitation',
  description: 'Rehabilitation of the Carmen bridge span crossing the river.',
  latitude: 8.4822,
  longitude: 124.6319,
  barangayId: 'barangay-1',
  category: 'BRIDGE',
  status: 'PLANNING',
  budget: 45000000,
  implementingAgencyId: 'agency-1',
  progressPercentage: 0,
};

describe('project.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('throws a 404 AppError when getting a project that does not exist', async () => {
    vi.mocked(projectRepository.findByIdOrSlug).mockResolvedValue(null);

    await expect(projectService.getProject('missing-slug')).rejects.toMatchObject({
      statusCode: 404,
    } satisfies Partial<AppError>);
  });

  it('rejects project creation when the implementing agency does not exist', async () => {
    vi.mocked(projectRepository.agencyExists).mockResolvedValue(false);

    await expect(projectService.createProject(baseInput)).rejects.toThrow('Agency agency-1 not found');
    expect(projectRepository.create).not.toHaveBeenCalled();
  });

  it('rejects project creation when the barangay does not exist', async () => {
    vi.mocked(projectRepository.agencyExists).mockResolvedValue(true);
    vi.mocked(projectRepository.getBarangayWithGeography).mockResolvedValue(null);

    await expect(projectService.createProject(baseInput)).rejects.toThrow('Barangay barangay-1 not found');
  });

  it('resolves city/region from the barangay and generates a unique slug on collision', async () => {
    vi.mocked(projectRepository.agencyExists).mockResolvedValue(true);
    vi.mocked(projectRepository.getBarangayWithGeography).mockResolvedValue({
      id: 'barangay-1',
      cityId: 'city-1',
      city: { province: { regionId: 'region-1' } },
    } as never);
    // First candidate slug collides, second one doesn't.
    vi.mocked(projectRepository.slugExists).mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    vi.mocked(projectRepository.create).mockResolvedValue('new-project-id');
    vi.mocked(projectRepository.findByIdOrSlug).mockResolvedValue({
      id: 'new-project-id',
      slug: 'carmen-bridge-rehabilitation-1',
    } as never);

    await projectService.createProject(baseInput);

    expect(projectRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        cityId: 'city-1',
        regionId: 'region-1',
        slug: 'carmen-bridge-rehabilitation-1',
      }),
    );
  });

  it('throws a 404 when updating a project that does not exist', async () => {
    vi.mocked(projectRepository.findByIdOrSlug).mockResolvedValue(null);

    await expect(projectService.updateProject('missing', { name: 'New name' })).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it('deletes an existing project by resolving its id first', async () => {
    vi.mocked(projectRepository.findByIdOrSlug).mockResolvedValue({ id: 'project-1' } as never);

    await projectService.deleteProject('some-slug');

    expect(projectRepository.softDelete).toHaveBeenCalledWith('project-1');
  });
});
