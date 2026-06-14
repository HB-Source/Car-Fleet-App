import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { env } from '../config/env.js';

// Allow a small clock-skew window (±1 step = ±30s).
authenticator.options = { window: 1 };

export interface MfaSetupData {
  secret: string;
  otpauthUrl: string;
  qrCodeDataUrl: string;
}

/** Generate a new TOTP secret + provisioning QR for the given account. */
export async function createMfaSetup(email: string): Promise<MfaSetupData> {
  const secret = authenticator.generateSecret();
  const otpauthUrl = authenticator.keyuri(email, env.MFA_ISSUER, secret);
  const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);
  return { secret, otpauthUrl, qrCodeDataUrl };
}

export function verifyTotp(code: string, secret: string): boolean {
  try {
    return authenticator.verify({ token: code.replace(/\s/g, ''), secret });
  } catch {
    return false;
  }
}
