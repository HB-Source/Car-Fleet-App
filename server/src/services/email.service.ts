import { Resend } from 'resend';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

export interface SentEmail {
  to: string;
  subject: string;
  code?: string;
  at: Date;
}

/**
 * In-memory record of the most recent emails. Used by tests to read OTP codes
 * and useful for local debugging. Not a delivery mechanism.
 */
export const outbox: SentEmail[] = [];

export function lastOtpFor(email: string): string | undefined {
  for (let i = outbox.length - 1; i >= 0; i--) {
    if (outbox[i].to.toLowerCase() === email.toLowerCase() && outbox[i].code) {
      return outbox[i].code;
    }
  }
  return undefined;
}

type OtpPurpose = 'verify' | 'login' | 'reset';

const OTP_HEADINGS: Record<OtpPurpose, string> = {
  verify: 'Verify your email',
  login: 'Your login code',
  reset: 'Reset your password',
};

const OTP_INTROS: Record<OtpPurpose, string> = {
  verify: 'Use the code below to verify your FleetPilot account.',
  login: 'Use the code below to finish signing in to FleetPilot.',
  reset: 'Use the code below to reset your FleetPilot password.',
};

function otpEmailHtml(name: string, code: string, purpose: OtpPurpose): string {
  const heading = OTP_HEADINGS[purpose];
  const intro = OTP_INTROS[purpose];
  return `
  <div style="font-family:Inter,system-ui,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#0f172a">
    <h1 style="font-size:20px;margin:0 0 4px">${heading}</h1>
    <p style="color:#64748b;margin:0 0 20px">Hi ${name || 'there'}, ${intro}</p>
    <div style="font-size:34px;font-weight:800;letter-spacing:10px;text-align:center;
                background:#eef2ff;color:#4f46e5;border-radius:16px;padding:18px 0">${code}</div>
    <p style="color:#94a3b8;font-size:13px;margin:20px 0 0">
      This code expires in 10 minutes. If you didn't request it, you can ignore this email.
    </p>
  </div>`;
}

async function deliver(to: string, subject: string, html: string, code?: string): Promise<void> {
  outbox.push({ to, subject, code, at: new Date() });
  if (outbox.length > 100) outbox.shift();

  if (!resend) {
    // Dev / CI fallback: no Resend key configured.
    if (env.NODE_ENV !== 'test') {
      console.log(`📧 [email:dev] to=${to} subject="${subject}"${code ? ` code=${code}` : ''}`);
    }
    return;
  }

  let sendError: unknown = null;
  try {
    const { error } = await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html });
    sendError = error;
  } catch (err) {
    sendError = err;
  }
  if (sendError) {
    // Surface the precise Resend reason in the server logs (e.g. unverified
    // sender domain, or onboarding@resend.dev only allowing your own address),
    // while returning a clean, non-500 error to the client.
    console.error('❌ Resend email failed:', JSON.stringify(sendError));
    throw new ApiError(
      502,
      'We could not send the email. Please verify the email sender configuration and try again.',
      'email_send_failed',
    );
  }
}

const OTP_SUBJECTS: Record<OtpPurpose, string> = {
  verify: 'Verify your FleetPilot email',
  login: 'Your FleetPilot login code',
  reset: 'Reset your FleetPilot password',
};

export function sendOtpEmail(
  to: string,
  name: string,
  code: string,
  purpose: OtpPurpose,
): Promise<void> {
  return deliver(to, subject(purpose), otpEmailHtml(name, code, purpose), code);
}

function subject(purpose: OtpPurpose): string {
  return OTP_SUBJECTS[purpose];
}
