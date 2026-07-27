import { randomUUID } from 'node:crypto';
import { Prisma } from '@prisma/client';
import type { CitizenReportsQuery, CreateCitizenReportInput } from '@transparency-ph/shared-types';
import { prisma } from '../lib/prisma.js';

// CitizenReport has its own independent PostGIS geometry column (the
// citizen's actual location, deliberately separate from the project's own
// pin) - same reason project.repository.ts uses raw SQL instead of the
// plain Prisma client. Don't follow user.repository.ts's plain-client
// pattern here; that convention only applies to models without geometry.
export interface CitizenReportItem {
  id: string;
  projectId: string;
  category: string;
  comment: string | null;
  status: string;
  createdAt: Date;
  longitude: number | null;
  latitude: number | null;
  reporterName: string;
}

const SELECT_FIELDS = Prisma.sql`
  cr.id, cr.project_id as "projectId", cr.category, cr.comment, cr.status,
  cr.created_at as "createdAt",
  ST_X(cr.location) as longitude,
  ST_Y(cr.location) as latitude,
  u.full_name as "reporterName"
`;

// Only APPROVED, non-deleted reports are ever surfaced publicly - the
// PENDING/REJECTED gate is enforced here in the repository (not just the
// service layer) so there's no path that accidentally lists an
// unmoderated report by skipping a service-level check.
export async function findApprovedByProjectId(
  projectId: string,
  pagination: CitizenReportsQuery,
): Promise<{ rows: CitizenReportItem[]; total: number }> {
  const offset = (pagination.page - 1) * pagination.limit;

  const rows = await prisma.$queryRaw<CitizenReportItem[]>(Prisma.sql`
    SELECT ${SELECT_FIELDS}
    FROM citizen_reports cr
    JOIN users u ON u.id = cr.user_id
    WHERE cr.project_id = ${projectId}::uuid
      AND cr.status = 'APPROVED'
      AND cr.deleted_at IS NULL
    ORDER BY cr.created_at DESC
    LIMIT ${pagination.limit} OFFSET ${offset}
  `);

  const countRows = await prisma.$queryRaw<{ count: bigint }[]>(Prisma.sql`
    SELECT COUNT(*)::bigint as count
    FROM citizen_reports cr
    WHERE cr.project_id = ${projectId}::uuid
      AND cr.status = 'APPROVED'
      AND cr.deleted_at IS NULL
  `);

  return { rows, total: Number(countRows[0].count) };
}

// New reports always land as PENDING (the column default) - there's no
// moderator-approval path built yet, so this never writes any other
// status. userId comes from req.user (the authenticate middleware), never
// from the request body.
export async function create(
  projectId: string,
  userId: string,
  data: CreateCitizenReportInput,
): Promise<string> {
  const id = randomUUID();

  const location =
    data.latitude !== undefined && data.longitude !== undefined
      ? Prisma.sql`ST_SetSRID(ST_MakePoint(${data.longitude}, ${data.latitude}), 4326)`
      : Prisma.sql`NULL`;

  await prisma.$executeRaw(Prisma.sql`
    INSERT INTO citizen_reports (id, project_id, user_id, category, comment, location)
    VALUES (
      ${id}::uuid, ${projectId}::uuid, ${userId}::uuid,
      ${data.category}::"CitizenReportCategory", ${data.comment ?? null},
      ${location}
    )
  `);

  return id;
}
