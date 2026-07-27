import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';

export interface AccessTokenPayload {
  sub: string; // user id
  role: string;
}

export interface RefreshTokenPayload {
  sub: string; // user id
}

// expiresIn's type in @types/jsonwebtoken is stricter than "any string"
// (it wants a recognized duration format or a number of seconds). env.ts
// already validates JWT_*_EXPIRES_IN is a non-empty string via Zod but
// doesn't (and shouldn't) constrain it to jsonwebtoken's specific format
// union - that's an implementation detail of this one library, not
// something the env schema should know about. Cast at the boundary here
// instead of loosening the env schema.
type Expiry = jwt.SignOptions['expiresIn'];

export function signAccessToken(payload: AccessTokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.JWT_ACCESS_EXPIRES_IN as Expiry });
}

export function signRefreshToken(payload: RefreshTokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, { expiresIn: env.JWT_REFRESH_EXPIRES_IN as Expiry });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
}
