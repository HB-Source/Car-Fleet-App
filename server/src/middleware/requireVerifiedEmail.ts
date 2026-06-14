import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError.js';

export function requireVerifiedEmail(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw ApiError.unauthorized();
  if (!req.user.emailVerified) {
    throw ApiError.forbidden('Please verify your email address first', 'email_unverified');
  }
  next();
}
