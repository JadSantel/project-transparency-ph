import { NextFunction, Request, Response } from 'express';
import { ZodTypeAny } from 'zod';

type Source = 'body' | 'query' | 'params';

/**
 * Validates req[source] against a Zod schema and replaces it with the
 * parsed result, so downstream code sees defaults/coercions already applied
 * (e.g. ?page= arrives as a string but the controller sees a number).
 *
 * Gotcha: in Express 4, req.query is defined with only a getter (no
 * setter) - a plain `req.query = result.data` throws "Cannot set property
 * query of #<IncomingMessage> which has only a getter". Object.defineProperty
 * overrides it with a plain writable property instead.
 */
export function validate(schema: ZodTypeAny, source: Source = 'body') {
  return (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return next(result.error);
    }

    Object.defineProperty(req, source, {
      value: result.data,
      writable: true,
      configurable: true,
    });

    next();
  };
}
