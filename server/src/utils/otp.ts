import bcrypt from 'bcryptjs';
import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { env } from '../config/env.js';

export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
// No cooldown under test so back-to-back OTP issuance in the suite doesn't 429.
export const OTP_RESEND_COOLDOWN_MS = env.NODE_ENV === 'test' ? 0 : 45 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

/** Cryptographically-random six-digit numeric code. */
export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

// OTPs are low-entropy (6 digits) so they must use a slow hash (bcrypt).
export function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, env.BCRYPT_SALT_ROUNDS);
}

export function verifyOtpHash(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

function normalizeBackup(code: string): string {
  return code.replace(/[^a-z0-9]/gi, '').toLowerCase();
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

/** Generate N backup codes with 64 bits of entropy each (e.g. "4f2a-9c1e-..."). */
export function generateBackupCodes(count = 10): string[] {
  return Array.from({ length: count }, () => {
    const raw = randomBytes(8).toString('hex'); // 16 hex chars = 64 bits
    return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8, 12)}-${raw.slice(12)}`;
  });
}

// Backup codes are high-entropy random tokens, so a fast hash (SHA-256) is
// appropriate and secure — and keeps MFA setup instant even on small CPUs.
export function hashBackupCodes(codes: string[]): string[] {
  return codes.map((c) => sha256(normalizeBackup(c)));
}

/** Returns the index of the matching hashed backup code, or -1. */
export function matchBackupCode(code: string, hashes: string[]): number {
  const candidate = Buffer.from(sha256(normalizeBackup(code)), 'hex');
  for (let i = 0; i < hashes.length; i++) {
    const stored = Buffer.from(hashes[i], 'hex');
    if (stored.length === candidate.length && timingSafeEqual(stored, candidate)) {
      return i;
    }
  }
  return -1;
}
