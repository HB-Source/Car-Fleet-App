import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import type { UserRole } from '../models/User.js';

export interface AccessTokenPayload {
  sub: string;
  role: UserRole;
  /** True when the session satisfied MFA (or the user has no MFA). */
  mfa: boolean;
  typ: 'access';
}

export interface RefreshTokenPayload {
  sub: string;
  typ: 'refresh';
}

/** Short-lived token proving the email-OTP step passed, pending MFA. */
export interface MfaChallengePayload {
  sub: string;
  typ: 'mfa_challenge';
}

export function signAccessToken(sub: string, role: UserRole, mfa: boolean): string {
  return jwt.sign({ sub, role, mfa, typ: 'access' }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function signRefreshToken(sub: string): string {
  return jwt.sign({ sub, typ: 'refresh' }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function signMfaChallengeToken(sub: string): string {
  return jwt.sign({ sub, typ: 'mfa_challenge' }, env.JWT_SECRET, {
    expiresIn: '5m',
  } as jwt.SignOptions);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === 'string' || decoded.typ !== 'access' || !decoded.sub) {
    throw new Error('Invalid access token');
  }
  return decoded as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET);
  if (typeof decoded === 'string' || decoded.typ !== 'refresh' || !decoded.sub) {
    throw new Error('Invalid refresh token');
  }
  return decoded as RefreshTokenPayload;
}

export function verifyMfaChallengeToken(token: string): MfaChallengePayload {
  const decoded = jwt.verify(token, env.JWT_SECRET);
  if (typeof decoded === 'string' || decoded.typ !== 'mfa_challenge' || !decoded.sub) {
    throw new Error('Invalid MFA challenge token');
  }
  return decoded as MfaChallengePayload;
}
