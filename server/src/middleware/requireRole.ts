import type { NextFunction, Request, Response } from 'express';
import type { UserRole } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw ApiError.unauthorized();
    if (!roles.includes(req.user.role)) {
      throw ApiError.forbidden();
    }
    next();
  };
}
