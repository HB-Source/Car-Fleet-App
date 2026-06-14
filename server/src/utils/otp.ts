import bcrypt from 'bcryptjs';
import { randomInt, randomBytes } from 'node:crypto';
import { env } from '../config/env.js';

export const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
// No cooldown under test so back-to-back OTP issuance in the suite doesn't 429.
export const OTP_RESEND_COOLDOWN_MS = env.NODE_ENV === 'test' ? 0 : 45 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

/** Cryptographically-random six-digit numeric code. */
export function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, '0');
}

export function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, env.BCRYPT_SALT_ROUNDS);
}

export function verifyOtpHash(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

/** Generate N human-friendly backup codes (e.g. "4f2a-9c1e"). */
export function generateBackupCodes(count = 10): string[] {
  return Array.from({ length: count }, () => {
    const raw = randomBytes(4).toString('hex'); // 8 hex chars
    return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  });
}

export function hashBackupCodes(codes: string[]): Promise<string[]> {
  return Promise.all(codes.map((c) => bcrypt.hash(c.replace(/-/g, '').toLowerCase(), env.BCRYPT_SALT_ROUNDS)));
}

/** Returns the index of the matching hashed backup code, or -1. */
export async function matchBackupCode(code: string, hashes: string[]): Promise<number> {
  const normalized = code.replace(/[-\s]/g, '').toLowerCase();
  for (let i = 0; i < hashes.length; i++) {
    if (await bcrypt.compare(normalized, hashes[i])) return i;
  }
  return -1;
}
