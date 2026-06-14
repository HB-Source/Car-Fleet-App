import type { NextFunction, Request, Response } from 'express';
import { User, type UserDoc } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { verifyAccessToken } from '../utils/jwt.js';

declare module 'express-serve-static-core' {
  interface Request {
    user?: UserDoc;
    /** Whether the presented access token satisfied MFA. */
    authMfa?: boolean;
  }
}

export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    throw ApiError.unauthorized();
  }

  let payload;
  try {
    payload = verifyAccessToken(header.slice('Bearer '.length));
  } catch {
    throw ApiError.unauthorized('Invalid or expired token', 'invalid_token');
  }

  const user = await User.findById(payload.sub);
  if (!user || !user.active) {
    throw ApiError.unauthorized('Account not found or deactivated', 'account_inactive');
  }

  req.user = user;
  req.authMfa = payload.mfa === true;
  next();
}
