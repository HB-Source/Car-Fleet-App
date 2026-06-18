import { User, type UserDoc, type EmailOtpPurpose } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { hashPassword, verifyPassword } from '../utils/password.js';
import {
  signAccessToken,
  signRefreshToken,
  signMfaChallengeToken,
  verifyRefreshToken,
  verifyMfaChallengeToken,
} from '../utils/jwt.js';
import {
  generateOtp,
  hashOtp,
  verifyOtpHash,
  generateBackupCodes,
  hashBackupCodes,
  matchBackupCode,
  OTP_TTL_MS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_MAX_ATTEMPTS,
} from '../utils/otp.js';
import { sendOtpEmail } from './email.service.js';
import { createMfaSetup, verifyTotp } from './mfa.service.js';
import type { LoginInput, RegisterInput } from '../schemas/auth.schema.js';

const MAX_FAILED_LOGINS = 5;
const LOCK_MS = 15 * 60 * 1000;

const OTP_SELECT =
  '+emailOtpHash +emailOtpPurpose +emailOtpExpiresAt +emailOtpAttempts +emailOtpLastSentAt';

export interface Tokens {
  accessToken: string;
  refreshToken: string;
}

export type SessionResult =
  | ({ kind: 'tokens'; user: UserDoc } & Tokens)
  | { kind: 'mfa_required'; mfaToken: string };

export type LoginResult =
  | { kind: 'email_verification'; email: string }
  | { kind: 'mfa_required'; email: string; mfaToken: string }
  | { kind: 'otp_sent'; email: string };

/** Generate, hash, store and email a fresh OTP, enforcing the resend cooldown. */
async function issueAndSendOtp(user: UserDoc, purpose: EmailOtpPurpose): Promise<void> {
  if (user.emailOtpLastSentAt) {
    const elapsed = Date.now() - user.emailOtpLastSentAt.getTime();
    if (elapsed < OTP_RESEND_COOLDOWN_MS) {
      const wait = Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000);
      throw new ApiError(429, `Please wait ${wait}s before requesting another code`, 'otp_cooldown');
    }
  }

  const code = generateOtp();
  user.emailOtpHash = await hashOtp(code);
  user.emailOtpPurpose = purpose;
  user.emailOtpExpiresAt = new Date(Date.now() + OTP_TTL_MS);
  user.emailOtpAttempts = 0;
  user.emailOtpLastSentAt = new Date();
  await user.save();

  await sendOtpEmail(user.email, user.name, code, purpose);
}

function buildSession(user: UserDoc): { kind: 'tokens'; user: UserDoc } & Tokens {
  return {
    kind: 'tokens',
    user,
    accessToken: signAccessToken(user._id.toString(), user.role, true),
    refreshToken: signRefreshToken(user._id.toString()),
  };
}

async function completeAuthentication(user: UserDoc): Promise<SessionResult> {
  if (user.mfaEnabled) {
    return { kind: 'mfa_required', mfaToken: signMfaChallengeToken(user._id.toString()) };
  }
  user.lastLoginAt = new Date();
  await user.save();
  return buildSession(user);
}

export async function register(input: RegisterInput): Promise<{ userId: string; email: string }> {
  const email = input.email.toLowerCase();
  const existing = await User.findOne({ email });
  if (existing) {
    throw ApiError.conflict('An account with this email already exists', 'email_taken');
  }

  // Public registration always creates drivers; elevated roles are assigned
  // by an admin afterwards (POST /api/users or PATCH /api/users/:id).
  const user = await User.create({
    name: input.name,
    email,
    role: 'driver',
    password_hash: await hashPassword(input.password),
    emailVerified: false,
  });

  await issueAndSendOtp(user, 'verify');
  return { userId: user._id.toString(), email: user.email };
}

export async function login(input: LoginInput): Promise<LoginResult> {
  const user = await User.findOne({ email: input.email.toLowerCase() }).select(
    `+password_hash +failedLoginAttempts +accountLockedUntil ${OTP_SELECT}`,
  );
  if (!user) {
    throw ApiError.unauthorized('Invalid email or password', 'invalid_credentials');
  }
  if (!user.active) {
    throw ApiError.unauthorized('This account has been deactivated', 'account_inactive');
  }
  if (user.accountLockedUntil && user.accountLockedUntil.getTime() > Date.now()) {
    const mins = Math.ceil((user.accountLockedUntil.getTime() - Date.now()) / 60000);
    throw new ApiError(429, `Account locked. Try again in ${mins} min.`, 'account_locked');
  }

  const ok = await verifyPassword(input.password, user.password_hash);
  if (!ok) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= MAX_FAILED_LOGINS) {
      user.accountLockedUntil = new Date(Date.now() + LOCK_MS);
      user.failedLoginAttempts = 0;
    }
    await user.save();
    throw ApiError.unauthorized('Invalid email or password', 'invalid_credentials');
  }

  user.failedLoginAttempts = 0;
  user.accountLockedUntil = null;

  if (!user.emailVerified) {
    await issueAndSendOtp(user, 'verify');
    return { kind: 'email_verification', email: user.email };
  }

  // When an authenticator is set up, it replaces the email OTP as the second
  // factor: go straight to the MFA challenge (no login code is emailed).
  if (user.mfaEnabled) {
    await user.save(); // persist the failed-attempt reset
    return {
      kind: 'mfa_required',
      email: user.email,
      mfaToken: signMfaChallengeToken(user._id.toString()),
    };
  }

  // No MFA: fall back to an emailed one-time login code.
  await issueAndSendOtp(user, 'login');
  return { kind: 'otp_sent', email: user.email };
}

/** Resend the appropriate OTP (verification when unverified, else login). */
export async function resendEmailOtp(emailRaw: string): Promise<void> {
  const user = await User.findOne({ email: emailRaw.toLowerCase() }).select(OTP_SELECT);
  // Don't reveal whether the account exists.
  if (!user || !user.active) return;
  await issueAndSendOtp(user, user.emailVerified ? 'login' : 'verify');
}

export async function verifyEmailOtp(emailRaw: string, code: string): Promise<SessionResult> {
  const user = await User.findOne({ email: emailRaw.toLowerCase() }).select(OTP_SELECT);
  if (!user || !user.emailOtpHash || !user.emailOtpExpiresAt) {
    throw ApiError.badRequest('No verification in progress. Request a new code.', 'no_otp');
  }
  if (user.emailOtpExpiresAt.getTime() < Date.now()) {
    throw ApiError.badRequest('This code has expired. Request a new one.', 'otp_expired');
  }
  if (user.emailOtpAttempts >= OTP_MAX_ATTEMPTS) {
    user.emailOtpHash = null;
    await user.save();
    throw ApiError.badRequest('Too many attempts. Request a new code.', 'otp_attempts');
  }

  const valid = await verifyOtpHash(code, user.emailOtpHash);
  if (!valid) {
    user.emailOtpAttempts += 1;
    await user.save();
    throw ApiError.badRequest('Incorrect code. Please try again.', 'otp_invalid');
  }

  const purpose = user.emailOtpPurpose;
  // Single-use: clear the OTP.
  user.emailOtpHash = null;
  user.emailOtpPurpose = null;
  user.emailOtpExpiresAt = null;
  user.emailOtpAttempts = 0;
  if (purpose === 'verify') {
    user.emailVerified = true;
  }
  await user.save();

  return completeAuthentication(user);
}

export async function refresh(refreshToken: string): Promise<{ user: UserDoc } & Tokens> {
  let sub: string;
  try {
    sub = verifyRefreshToken(refreshToken).sub;
  } catch {
    throw ApiError.unauthorized('Invalid or expired session', 'invalid_refresh');
  }
  const user = await User.findById(sub);
  if (!user || !user.active) {
    throw ApiError.unauthorized('Account not found or deactivated', 'account_inactive');
  }
  return buildSession(user);
}

export interface MfaSetupResult {
  otpauthUrl: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export async function setupMfa(userId: string): Promise<MfaSetupResult> {
  const user = await User.findById(userId).select('+mfaSecret +mfaBackupCodesHash +mfaPending');
  if (!user) throw ApiError.notFound('User not found');
  if (user.mfaEnabled) {
    throw ApiError.conflict('MFA is already enabled', 'mfa_enabled');
  }

  const setup = await createMfaSetup(user.email);
  const backupCodes = generateBackupCodes();

  user.mfaSecret = setup.secret;
  user.mfaPending = true;
  user.mfaBackupCodesHash = hashBackupCodes(backupCodes);
  await user.save();

  // Backup codes are returned exactly once, here.
  return {
    otpauthUrl: setup.otpauthUrl,
    qrCodeDataUrl: setup.qrCodeDataUrl,
    backupCodes,
  };
}

export async function confirmMfaSetup(userId: string, code: string): Promise<void> {
  const user = await User.findById(userId).select('+mfaSecret +mfaPending');
  if (!user || !user.mfaSecret || !user.mfaPending) {
    throw ApiError.badRequest('Start MFA setup first', 'mfa_not_pending');
  }
  if (!verifyTotp(code, user.mfaSecret)) {
    throw ApiError.badRequest('Incorrect code. Check your authenticator app.', 'mfa_invalid');
  }
  user.mfaEnabled = true;
  user.mfaPending = false;
  await user.save();
}

/** Login-time MFA: verify a TOTP or backup code against the challenge token. */
export async function verifyMfaLogin(
  mfaToken: string,
  code: string,
): Promise<{ user: UserDoc } & Tokens> {
  let sub: string;
  try {
    sub = verifyMfaChallengeToken(mfaToken).sub;
  } catch {
    throw ApiError.unauthorized('MFA session expired. Please sign in again.', 'mfa_expired');
  }
  const user = await User.findById(sub).select('+mfaSecret +mfaBackupCodesHash');
  if (!user || !user.mfaEnabled || !user.mfaSecret) {
    throw ApiError.badRequest('MFA is not enabled for this account', 'mfa_not_enabled');
  }

  let ok = verifyTotp(code, user.mfaSecret);
  if (!ok) {
    const idx = matchBackupCode(code, user.mfaBackupCodesHash);
    if (idx >= 0) {
      user.mfaBackupCodesHash.splice(idx, 1); // single-use
      ok = true;
    }
  }
  if (!ok) {
    throw ApiError.unauthorized('Incorrect authentication code', 'mfa_invalid');
  }

  user.lastLoginAt = new Date();
  await user.save();
  return buildSession(user);
}

export type ResetMethod = 'email' | 'mfa';

/** Which reset factors are available for an account (email always; MFA if on). */
export async function getResetMethods(emailRaw: string): Promise<ResetMethod[]> {
  const user = await User.findOne({ email: emailRaw.toLowerCase() });
  // For unknown/inactive accounts, return the generic set to avoid enumeration.
  if (!user || !user.active) return ['email'];
  return user.mfaEnabled ? ['email', 'mfa'] : ['email'];
}

/** Email a password-reset OTP. Silent when the account doesn't exist. */
export async function sendResetOtp(emailRaw: string): Promise<void> {
  const user = await User.findOne({ email: emailRaw.toLowerCase() }).select(OTP_SELECT);
  if (!user || !user.active) return;
  await issueAndSendOtp(user, 'reset');
}

export async function resetPassword(
  emailRaw: string,
  method: ResetMethod,
  code: string,
  newPassword: string,
): Promise<void> {
  const user = await User.findOne({ email: emailRaw.toLowerCase() }).select(
    `+password_hash +mfaSecret +mfaBackupCodesHash ${OTP_SELECT}`,
  );
  if (!user || !user.active) {
    throw ApiError.badRequest('Invalid or expired reset request', 'reset_invalid');
  }

  if (method === 'email') {
    if (
      !user.emailOtpHash ||
      user.emailOtpPurpose !== 'reset' ||
      !user.emailOtpExpiresAt ||
      user.emailOtpExpiresAt.getTime() < Date.now()
    ) {
      throw ApiError.badRequest('This reset code has expired. Request a new one.', 'otp_expired');
    }
    if (user.emailOtpAttempts >= OTP_MAX_ATTEMPTS) {
      user.emailOtpHash = null;
      await user.save();
      throw ApiError.badRequest('Too many attempts. Request a new code.', 'otp_attempts');
    }
    if (!(await verifyOtpHash(code, user.emailOtpHash))) {
      user.emailOtpAttempts += 1;
      await user.save();
      throw ApiError.badRequest('Incorrect code. Please try again.', 'otp_invalid');
    }
  } else {
    // method === 'mfa'
    if (!user.mfaEnabled || !user.mfaSecret) {
      throw ApiError.badRequest('MFA is not enabled for this account', 'mfa_not_enabled');
    }
    let ok = verifyTotp(code, user.mfaSecret);
    if (!ok) {
      const idx = matchBackupCode(code, user.mfaBackupCodesHash);
      if (idx >= 0) {
        user.mfaBackupCodesHash.splice(idx, 1); // single-use
        ok = true;
      }
    }
    if (!ok) {
      throw ApiError.unauthorized('Incorrect authentication code', 'mfa_invalid');
    }
  }

  // Factor verified — set the new password and clear transient auth state.
  user.password_hash = await hashPassword(newPassword);
  user.emailOtpHash = null;
  user.emailOtpPurpose = null;
  user.emailOtpExpiresAt = null;
  user.emailOtpAttempts = 0;
  user.failedLoginAttempts = 0;
  user.accountLockedUntil = null;
  await user.save();
}

export async function disableMfa(userId: string, password: string): Promise<void> {
  const user = await User.findById(userId).select(
    '+password_hash +mfaSecret +mfaBackupCodesHash +mfaPending',
  );
  if (!user) throw ApiError.notFound('User not found');
  if (!(await verifyPassword(password, user.password_hash))) {
    throw ApiError.unauthorized('Incorrect password', 'invalid_credentials');
  }
  user.mfaEnabled = false;
  user.mfaPending = false;
  user.mfaSecret = null;
  user.mfaBackupCodesHash = [];
  await user.save();
}
