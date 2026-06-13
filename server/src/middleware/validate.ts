import type { NextFunction, Request, Response } from 'express';
import type { ZodSchema } from 'zod';

/** Validates and replaces req.body with the parsed (typed, stripped) result. */
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction) => {
    req.body = schema.parse(req.body ?? {});
    next();
  };
}
