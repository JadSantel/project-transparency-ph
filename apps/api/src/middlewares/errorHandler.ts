import { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

/**
 * Thrown by services/controllers for expected, "operational" failures
 * (e.g. "project not found", "invalid status transition"). Distinguishing
 * these from unexpected bugs lets errorHandler return the right status
 * code and message instead of leaking a generic 500 for everything.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: 'ValidationError',
      details: err.flatten(),
    });
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
}
