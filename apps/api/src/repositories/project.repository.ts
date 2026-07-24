import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type { CreateProjectInput, ProjectQuery, UpdateProjectInput } from '@transparency-ph/shared-types';
import { prisma } from '../lib/prisma.js';

export interface ProjectListItem {
  id: string;
  name: string;
  slug: string;
  category: string;
  status: string;
  budget: string; // returned as text, not float - see note below
  progressPercentage: number;
  startDate: Date | null;
  targetCompletion: Date | null;
  actualCompletion: Date | null;
  createdAt: Date;
  updatedAt: Date;
  longitude: number;
  latitude: number;
  cityName: string;
  agencyName: string;
  agencyAcronym: string | null;
}

export interface ProjectDetail extends ProjectListItem {
  description: string;
  fundingSource: string | null;
  barangayId: string;
  cityId: string;
  regionId: string;
  implementingAgencyId: string;
  contractorId: string | null;
  consultantId: string | null;
}

// Money is returned as text rather than a JS number: a Decimal(15,2) budget
// can exceed what a float64 represents exactly, and financial figures
// silently losing cents in an API response is the kind of bug that's easy
// to miss and bad to ship in a government transparency tool. The frontend
// parses this string for display formatting.
const SELECT_FIELDS = Prisma.sql`
  p.id, p.name, p.slug, p.category, p.status,
  p.budget::text as budget,
  p.progress_percentage as "progressPercentage",
  p.start_date as "startDate",
  p.target_completion as "targetCompletion",
  p.actual_completion as "actualCompletion",
  p.created_at as "createdAt",
  p.updated_at as "updatedAt",
  ST_X(p.location) as longitude,
  ST_Y(p.location) as latitude,
  c.name as "cityName",
  a.name as "agencyName",
  a.acronym as "agencyAcronym"
`;

const SORT_COLUMNS: Record<ProjectQuery['sortBy'], Prisma.Sql> = {
  createdAt: Prisma.sql`p.created_at`,
  budget: Prisma.sql`p.budget`,
  progressPercentage: Prisma.sql`p.progress_percentage`,
  startDate: Prisma.sql`p.start_date`,
  name: Prisma.sql`p.name`,
};

function buildWhereClause(filters: ProjectQuery): Prisma.Sql {
  const conditions: Prisma.Sql[] = [Prisma.sql`p.deleted_at IS NULL`];

  if (filters.status) conditions.push(Prisma.sql`p.status = ${filters.status}::"ProjectStatus"`);
  if (filters.category) conditions.push(Prisma.sql`p.category = ${filters.category}::"ProjectCategory"`);
  if (filters.agencyId) conditions.push(Prisma.sql`p.implementing_agency_id = ${filters.agencyId}::uuid`);
  if (filters.contractorId) conditions.push(Prisma.sql`p.contractor_id = ${filters.contractorId}::uuid`);
  if (filters.regionId) conditions.push(Prisma.sql`p.region_id = ${filters.regionId}::uuid`);
  if (filters.cityId) conditions.push(Prisma.sql`p.city_id = ${filters.cityId}::uuid`);
  if (filters.barangayId) conditions.push(Prisma.sql`p.barangay_id = ${filters.barangayId}::uuid`);
  if (filters.minBudget !== undefined) conditions.push(Prisma.sql`p.budget >= ${filters.minBudget}`);
  if (filters.maxBudget !== undefined) conditions.push(Prisma.sql`p.budget <= ${filters.maxBudget}`);
  if (filters.minProgress !== undefined) conditions.push(Prisma.sql`p.progress_percentage >= ${filters.minProgress}`);
  if (filters.maxProgress !== undefined) conditions.push(Prisma.sql`p.progress_percentage <= ${filters.maxProgress}`);

  if (filters.completionYear !== undefined) {
    conditions.push(
      Prisma.sql`EXTRACT(YEAR FROM COALESCE(p.actual_completion, p.target_completion)) = ${filters.completionYear}`,
    );
  }

  if (filters.search) {
    conditions.push(Prisma.sql`(p.name ILIKE ${'%' + filters.search + '%'} OR p.description ILIKE ${'%' + filters.search + '%'})`);
  }

  if (filters.bbox) {
    const [minLng, minLat, maxLng, maxLat] = filters.bbox.split(',').map(Number);
    conditions.push(Prisma.sql`p.location && ST_MakeEnvelope(${minLng}, ${minLat}, ${maxLng}, ${maxLat}, 4326)`);
  }

  return Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;
}

export async function findMany(filters: ProjectQuery): Promise<{ rows: ProjectListItem[]; total: number }> {
  const where = buildWhereClause(filters);
  const orderColumn = SORT_COLUMNS[filters.sortBy];
  const orderDirection = filters.sortOrder === 'asc' ? Prisma.sql`ASC` : Prisma.sql`DESC`;
  const offset = (filters.page - 1) * filters.limit;

  const rows = await prisma.$queryRaw<ProjectListItem[]>(Prisma.sql`
    SELECT ${SELECT_FIELDS}
    FROM projects p
    JOIN cities c ON c.id = p.city_id
    JOIN agencies a ON a.id = p.implementing_agency_id
    ${where}
    ORDER BY ${orderColumn} ${orderDirection}
    LIMIT ${filters.limit} OFFSET ${offset}
  `);

  const countRows = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    SELECT COUNT(*)::bigint as count
    FROM projects p
    ${where}
  `);

  return { rows, total: Number(countRows[0].count) };
}

export async function findByIdOrSlug(idOrSlug: string): Promise<ProjectDetail | null> {
  const rows = await prisma.$queryRaw<ProjectDetail[]>(Prisma.sql`
    SELECT ${SELECT_FIELDS},
      p.description,
      p.funding_source as "fundingSource",
      p.barangay_id as "barangayId",
      p.city_id as "cityId",
      p.region_id as "regionId",
      p.implementing_agency_id as "implementingAgencyId",
      p.contractor_id as "contractorId",
      p.consultant_id as "consultantId"
    FROM projects p
    JOIN cities c ON c.id = p.city_id
    JOIN agencies a ON a.id = p.implementing_agency_id
    WHERE p.deleted_at IS NULL AND (p.id::text = ${idOrSlug} OR p.slug = ${idOrSlug})
    LIMIT 1
  `);

  return rows[0] ?? null;
}

type CreateProjectData = CreateProjectInput & { slug: string; cityId: string; regionId: string };

export async function create(data: CreateProjectData): Promise<string> {
  // UUID generated in JS (not gen_random_uuid()) to stay consistent with
  // the rest of the schema, which uses Prisma's client-generated UUIDs and
  // has no dependency on the pgcrypto extension.
  const id = randomUUID();

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO projects (
      id, name, slug, description, location, barangay_id, city_id, region_id,
      category, status, budget, funding_source, implementing_agency_id,
      contractor_id, consultant_id, start_date, target_completion, progress_percentage
    ) VALUES (
      ${id}::uuid, ${data.name}, ${data.slug}, ${data.description},
      ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326),
      ${data.barangayId}::uuid, ${data.cityId}::uuid, ${data.regionId}::uuid,
      ${data.category}::"ProjectCategory", ${data.status}::"ProjectStatus", ${data.budget},
      ${data.fundingSource ?? null}, ${data.implementingAgencyId}::uuid,
      ${data.contractorId ?? null}, ${data.consultantId ?? null},
      ${data.startDate ?? null}, ${data.targetCompletion ?? null}, ${data.progressPercentage}
    )
  `);

  return id;
}

type UpdateProjectData = UpdateProjectInput & { slug?: string; cityId?: string; regionId?: string };

export async function update(id: string, data: UpdateProjectData): Promise<void> {
  const setClauses: Prisma.Sql[] = [Prisma.sql`updated_at = now()`];

  if (data.name !== undefined) setClauses.push(Prisma.sql`name = ${data.name}`);
  if (data.slug !== undefined) setClauses.push(Prisma.sql`slug = ${data.slug}`);
  if (data.description !== undefined) setClauses.push(Prisma.sql`description = ${data.description}`);
  if (data.latitude !== undefined && data.longitude !== undefined) {
    setClauses.push(Prisma.sql`location = ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326)`);
  }
  if (data.barangayId !== undefined) setClauses.push(Prisma.sql`barangay_id = ${data.barangayId}::uuid`);
  if (data.cityId !== undefined) setClauses.push(Prisma.sql`city_id = ${data.cityId}::uuid`);
  if (data.regionId !== undefined) setClauses.push(Prisma.sql`region_id = ${data.regionId}::uuid`);
  if (data.category !== undefined) setClauses.push(Prisma.sql`category = ${data.category}::"ProjectCategory"`);
  if (data.status !== undefined) setClauses.push(Prisma.sql`status = ${data.status}::"ProjectStatus"`);
  if (data.budget !== undefined) setClauses.push(Prisma.sql`budget = ${data.budget}`);
  if (data.fundingSource !== undefined) setClauses.push(Prisma.sql`funding_source = ${data.fundingSource}`);
  if (data.implementingAgencyId !== undefined) {
    setClauses.push(Prisma.sql`implementing_agency_id = ${data.implementingAgencyId}::uuid`);
  }
  if (data.contractorId !== undefined) setClauses.push(Prisma.sql`contractor_id = ${data.contractorId}::uuid`);
  if (data.consultantId !== undefined) setClauses.push(Prisma.sql`consultant_id = ${data.consultantId}::uuid`);
  if (data.startDate !== undefined) setClauses.push(Prisma.sql`start_date = ${data.startDate}`);
  if (data.targetCompletion !== undefined) setClauses.push(Prisma.sql`target_completion = ${data.targetCompletion}`);
  if (data.progressPercentage !== undefined) {
    setClauses.push(Prisma.sql`progress_percentage = ${data.progressPercentage}`);
  }

  await prisma.$executeRaw(Prisma.sql`
    UPDATE projects
    SET ${Prisma.join(setClauses, ', ')}
    WHERE id = ${id}::uuid AND deleted_at IS NULL
  `);
}

export async function softDelete(id: string): Promise<number> {
  return prisma.$executeRaw(Prisma.sql`
    UPDATE projects SET deleted_at = now() WHERE id = ${id}::uuid AND deleted_at IS NULL
  `);
}

// --- Reference-data lookups used by the service layer for validation ---
// These don't touch geometry, so they use the plain Prisma client rather
// than raw SQL. Kept here (not a separate repository) since Phase 2 only
// needs read-only existence checks; a dedicated Agency/Contractor
// repository makes sense once those get their own CRUD endpoints later.

export async function getBarangayWithGeography(barangayId: string) {
  return prisma.barangay.findFirst({
    where: { id: barangayId, deletedAt: null },
    select: {
      id: true,
      cityId: true,
      city: { select: { province: { select: { regionId: true } } } },
    },
  });
}

export async function agencyExists(agencyId: string): Promise<boolean> {
  const agency = await prisma.agency.findFirst({ where: { id: agencyId, deletedAt: null }, select: { id: true } });
  return agency !== null;
}

export async function contractorExists(contractorId: string): Promise<boolean> {
  const contractor = await prisma.contractor.findFirst({
    where: { id: contractorId, deletedAt: null },
    select: { id: true },
  });
  return contractor !== null;
}

export async function consultantExists(consultantId: string): Promise<boolean> {
  const consultant = await prisma.consultant.findFirst({
    where: { id: consultantId, deletedAt: null },
    select: { id: true },
  });
  return consultant !== null;
}

export async function slugExists(slug: string, excludeId?: string): Promise<boolean> {
  const existing = await prisma.project.findFirst({
    where: { slug, deletedAt: null, ...(excludeId ? { id: { not: excludeId } } : {}) },
    select: { id: true },
  });
  return existing !== null;
}
