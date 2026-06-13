import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';
import { Error as MongooseError } from 'mongoose';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

interface MongoServerErrorLike extends Error {
  code?: number;
  keyValue?: Record<string, unknown>;
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { message: 'Route not found', code: 'not_found' } });
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ApiError) {
    res.status(err.status).json({ error: { message: err.message, code: err.code } });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: {
        message: err.issues
          .map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
          .join('; '),
        code: 'validation_error',
        details: err.issues,
      },
    });
    return;
  }

  // Duplicate key (e.g. email or plate_number already exists)
  const mongoErr = err as MongoServerErrorLike;
  if (mongoErr?.code === 11000) {
    const field = Object.keys(mongoErr.keyValue ?? {})[0] ?? 'field';
    res.status(409).json({
      error: { message: `A record with this ${field} already exists`, code: 'duplicate' },
    });
    return;
  }

  if (err instanceof MongooseError.CastError) {
    res.status(400).json({ error: { message: 'Invalid identifier', code: 'invalid_id' } });
    return;
  }

  if (env.NODE_ENV !== 'test') {
    console.error('Unhandled error:', err);
  }
  res.status(500).json({ error: { message: 'Internal server error', code: 'internal' } });
}
