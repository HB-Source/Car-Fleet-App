import type { NextFunction, Request, Response } from 'express';
import { ApiError } from '../utils/ApiError.js';

/**
 * Defense-in-depth: when a user has MFA enabled, the access token must have
 * been issued after the MFA step. Full access tokens are only minted after all
 * factors pass, so this rejects any token minted before MFA was turned on.
 */
export function requireMfaVerified(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) throw ApiError.unauthorized();
  if (req.user.mfaEnabled && req.authMfa !== true) {
    throw ApiError.forbidden('Multi-factor authentication required', 'mfa_required');
  }
  next();
}
