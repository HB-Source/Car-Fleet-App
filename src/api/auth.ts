import { apiRequest } from './client';
import type { User } from '../types/user';

interface Envelope<T> {
  success: boolean;
  data: T;
  message: string;
}

async function post<T>(path: string, body: unknown, authed = false): Promise<T> {
  const res = await apiRequest<Envelope<T>>(path, {
    method: 'POST',
    body,
    skipAuthRedirect: !authed,
  });
  return res.data;
}

export interface LoginResponse {
  email: string;
  requiresEmailVerification?: boolean;
  requiresOtp?: boolean;
  requiresMfa?: boolean;
  mfaToken?: string;
}

export interface VerifyOtpResponse {
  mfaRequired: boolean;
  mfaToken?: string;
  accessToken?: string;
  refreshToken?: string;
  user?: User;
}

export interface SessionResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface MfaSetupResponse {
  otpauthUrl: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export function register(name: string, email: string, password: string) {
  return post<{ email: string }>('/api/auth/register', { name, email, password });
}

export function login(email: string, password: string) {
  return post<LoginResponse>('/api/auth/login', { email, password });
}

export function sendEmailOtp(email: string) {
  return post<{ email: string }>('/api/auth/send-email-otp', { email });
}

export function verifyEmailOtp(email: string, code: string) {
  return post<VerifyOtpResponse>('/api/auth/verify-email-otp', { email, code });
}

export function verifyMfaLogin(mfaToken: string, code: string) {
  return post<SessionResponse>('/api/auth/mfa/verify', { mfaToken, code });
}

export function setupMfa() {
  return post<MfaSetupResponse>('/api/auth/mfa/setup', {}, true);
}

export function confirmMfaSetup(code: string) {
  return post<{ mfaEnabled: boolean }>('/api/auth/mfa/verify', { code }, true);
}

export function disableMfa(password: string) {
  return post<{ mfaEnabled: boolean }>('/api/auth/mfa/disable', { password }, true);
}

export function logout() {
  return post<Record<string, never>>('/api/auth/logout', {}, true).catch(() => undefined);
}

export async function fetchMe(): Promise<User> {
  const res = await apiRequest<Envelope<{ user: User }>>('/api/auth/me', {
    skipAuthRedirect: true,
  });
  return res.data.user;
}
