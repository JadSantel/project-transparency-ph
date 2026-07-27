import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../lib/jwt.js';
import { AppError } from './errorHandler.js';

/**
 * Verifies a `Bearer <token>` access token and attaches `req.user`. Later
 * routes that need a logged-in user (citizen reports, bookmarks, etc.)
 * mount this in front of them the same way `validate` is mounted for
 * request bodies. Unlike `validate`, this always throws via `next(err)`
 * rather than being wrapped in asyncHandler - it's synchronous, so there's
 * nothing to catch a rejection from.
 */
export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith('Bearer ')) {
    return next(new AppError('Authentication required', 401));
  }

  const token = header.slice('Bearer '.length);

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(new AppError('Invalid or expired access token', 401));
  }
}
