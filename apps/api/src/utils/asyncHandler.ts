import { NextFunction, Request, Response } from 'express';

type AsyncRouteHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;

/**
 * Express 4 does not automatically catch rejected promises from async
 * handlers - an unhandled rejection would crash the process instead of
 * reaching errorHandler. Wrapping every controller in this ensures thrown
 * errors (including AppError and ZodError) are forwarded to next().
 */
export function asyncHandler(fn: AsyncRouteHandler) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
