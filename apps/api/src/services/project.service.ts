import type {
  CreateProjectInput,
  ProjectQuery,
  ProjectUpdatesQuery,
  UpdateProjectInput,
} from '@transparency-ph/shared-types';
import { AppError } from '../middlewares/errorHandler.js';
import * as projectRepository from '../repositories/project.repository.js';
import { slugify } from '../utils/slugify.js';

async function resolveGeography(barangayId: string): Promise<{ cityId: string; regionId: string }> {
  const barangay = await projectRepository.getBarangayWithGeography(barangayId);
  if (!barangay) {
    throw new AppError(`Barangay ${barangayId} not found`, 400);
  }
  return {
    cityId: barangay.cityId,
    regionId: barangay.city.province.regionId,
  };
}

async function validateReferences(input: {
  implementingAgencyId?: string;
  contractorId?: string;
  consultantId?: string;
}): Promise<void> {
  if (input.implementingAgencyId) {
    const exists = await projectRepository.agencyExists(input.implementingAgencyId);
    if (!exists) throw new AppError(`Agency ${input.implementingAgencyId} not found`, 400);
  }
  if (input.contractorId) {
    const exists = await projectRepository.contractorExists(input.contractorId);
    if (!exists) throw new AppError(`Contractor ${input.contractorId} not found`, 400);
  }
  if (input.consultantId) {
    const exists = await projectRepository.consultantExists(input.consultantId);
    if (!exists) throw new AppError(`Consultant ${input.consultantId} not found`, 400);
  }
}

async function generateUniqueSlug(name: string, excludeId?: string): Promise<string> {
  const base = slugify(name);
  let candidate = base;
  let suffix = 1;

  while (await projectRepository.slugExists(candidate, excludeId)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

export async function listProjects(query: ProjectQuery) {
  const { rows, total } = await projectRepository.findMany(query);
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

export async function getProject(idOrSlug: string) {
  const project = await projectRepository.findByIdOrSlug(idOrSlug);
  if (!project) {
    throw new AppError('Project not found', 404);
  }
  return project;
}

export async function getProjectUpdates(idOrSlug: string, query: ProjectUpdatesQuery) {
  // Resolve idOrSlug -> project first so an unknown slug 404s the same way
  // getProject() does, rather than the repository silently returning an
  // empty timeline for a project that doesn't exist.
  const project = await projectRepository.findByIdOrSlug(idOrSlug);
  if (!project) {
    throw new AppError('Project not found', 404);
  }

  const { rows, total } = await projectRepository.findUpdatesByProjectId(project.id, query);
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

export async function createProject(input: CreateProjectInput) {
  await validateReferences(input);
  const { cityId, regionId } = await resolveGeography(input.barangayId);
  const slug = await generateUniqueSlug(input.name);

  const id = await projectRepository.create({ ...input, slug, cityId, regionId });
  return getProject(id);
}

export async function updateProject(idOrSlug: string, input: UpdateProjectInput) {
  const existing = await projectRepository.findByIdOrSlug(idOrSlug);
  if (!existing) {
    throw new AppError('Project not found', 404);
  }

  await validateReferences(input);

  let geography: { cityId: string; regionId: string } | undefined;
  if (input.barangayId) {
    geography = await resolveGeography(input.barangayId);
  }

  let slug: string | undefined;
  if (input.name) {
    slug = await generateUniqueSlug(input.name, existing.id);
  }

  await projectRepository.update(existing.id, { ...input, ...geography, slug });
  return getProject(existing.id);
}

export async function deleteProject(idOrSlug: string): Promise<void> {
  const existing = await projectRepository.findByIdOrSlug(idOrSlug);
  if (!existing) {
    throw new AppError('Project not found', 404);
  }
  await projectRepository.softDelete(existing.id);
}
