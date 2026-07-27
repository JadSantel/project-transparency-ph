import type {
  CitizenReportCategory,
  ProjectCategory,
  ProjectStatus,
  ProjectUpdateType,
  UserRole,
} from '@transparency-ph/shared-types';

/**
 * Mirrors apps/api/src/repositories/project.repository.ts's ProjectListItem
 * — deliberately duplicated here rather than imported, the same way
 * enums.ts mirrors schema.prisma: apps/api is a server-only workspace (it
 * pulls in @prisma/client, fs-dependent config, etc.) and isn't something
 * the web app can safely depend on. This type describes the JSON *wire*
 * shape specifically, which differs from the repository's TS return type in
 * two ways: dates arrive as ISO strings (JSON has no Date type), and budget
 * is already a string on the repository side (cast to ::text in SQL to
 * avoid float precision loss — see the comment in project.repository.ts).
 */
export interface ProjectListItem {
  id: string;
  name: string;
  slug: string;
  category: ProjectCategory;
  status: ProjectStatus;
  budget: string;
  progressPercentage: number;
  startDate: string | null;
  targetCompletion: string | null;
  actualCompletion: string | null;
  createdAt: string;
  updatedAt: string;
  longitude: number;
  latitude: number;
  cityName: string;
  agencyName: string;
  agencyAcronym: string | null;
}

/**
 * Mirrors apps/api's ProjectDetail (project.repository.ts), same wire-shape
 * duplication rationale as ProjectListItem above. Returned by
 * GET /projects/:idOrSlug.
 */
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

/**
 * Mirrors apps/api's ProjectUpdateItem (project.repository.ts). Returned by
 * GET /projects/:idOrSlug/updates.
 */
export interface ProjectUpdate {
  id: string;
  projectId: string;
  type: ProjectUpdateType;
  title: string;
  description: string;
  progressAtTime: number | null;
  updateDate: string;
  source: string | null;
  createdAt: string;
  createdByName: string | null;
}

/**
 * Mirrors apps/api's CitizenReportItem (citizen-report.repository.ts).
 * Returned by GET /projects/:idOrSlug/reports. Only ever APPROVED reports
 * - the API's moderation gate is enforced server-side, so `status` isn't
 * even part of this shape (it's always "APPROVED" for anything the web
 * app receives from this endpoint).
 */
export interface CitizenReport {
  id: string;
  projectId: string;
  category: CitizenReportCategory;
  comment: string | null;
  createdAt: string;
  longitude: number | null;
  latitude: number | null;
  reporterName: string;
}

// Returned by POST /projects/:idOrSlug/reports - deliberately minimal
// (just confirms submission) since the report won't be visible on the
// page until a moderator approves it. See citizen-report.service.ts.
export interface SubmitReportResponse {
  data: {
    id: string;
    status: 'PENDING';
  };
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProjectListResponse {
  data: ProjectListItem[];
  meta: PaginationMeta;
}

export interface ProjectDetailResponse {
  data: ProjectDetail;
}

export interface ProjectUpdatesResponse {
  data: ProjectUpdate[];
  meta: PaginationMeta;
}

export interface CitizenReportsResponse {
  data: CitizenReport[];
  meta: PaginationMeta;
}

/**
 * Mirrors apps/api's PublicUser (user.repository.ts) - never includes a
 * password hash, the API's select clauses already exclude it everywhere.
 */
export interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

// Shape of both POST /auth/register and POST /auth/login responses.
export interface AuthResponse extends AuthTokens {
  user: AuthUser;
}

// POST /auth/refresh only ever returns a new access token - see the
// Phase 7 README note on why the refresh token itself isn't rotated.
export interface RefreshResponse {
  accessToken: string;
}

export interface MeResponse {
  data: AuthUser;
}
