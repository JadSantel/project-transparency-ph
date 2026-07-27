import { prisma } from '../lib/prisma.js';

// User has no geometry/PostGIS field, so (unlike project.repository.ts)
// this uses the plain Prisma client directly instead of raw SQL - the
// same convention already established for the geography lookups at the
// bottom of project.repository.ts ("these don't touch geometry, so they
// use the plain Prisma client rather than raw SQL").

export interface AuthCredentials {
  id: string;
  email: string;
  passwordHash: string | null;
  fullName: string;
  role: string;
}

export interface PublicUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export async function findByEmail(email: string): Promise<AuthCredentials | null> {
  return prisma.user.findFirst({
    where: { email, deletedAt: null },
    select: { id: true, email: true, passwordHash: true, fullName: true, role: true },
  });
}

export async function findById(id: string): Promise<PublicUser | null> {
  return prisma.user.findFirst({
    where: { id, deletedAt: null },
    select: { id: true, email: true, fullName: true, role: true },
  });
}

export async function create(data: {
  email: string;
  passwordHash: string;
  fullName: string;
}): Promise<PublicUser> {
  return prisma.user.create({
    data: { email: data.email, passwordHash: data.passwordHash, fullName: data.fullName },
    select: { id: true, email: true, fullName: true, role: true },
  });
}
