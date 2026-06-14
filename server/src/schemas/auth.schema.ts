import { z } from 'zod';

const email = z.string().email().max(254);
const password = z.string().min(8).max(128);
const otpCode = z.string().regex(/^\d{6}$/, 'Code must be 6 digits');

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email,
  password,
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1).max(128),
});

export const sendEmailOtpSchema = z.object({ email });

export const verifyEmailOtpSchema = z.object({ email, code: otpCode });

export const mfaVerifySchema = z.object({
  // Setup flow uses an authenticated session + code.
  // Login flow passes the mfaToken issued after the email-OTP step.
  code: z.string().trim().min(1).max(20),
  mfaToken: z.string().optional(),
});

export const mfaDisableSchema = z.object({ password });

export const refreshSchema = z.object({ refreshToken: z.string().min(1) });

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
