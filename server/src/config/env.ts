import { z } from 'zod';

const boolFromString = z
  .enum(['true', 'false'])
  .transform((v) => v === 'true');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/fleetpilot'),

  // Auth — access + refresh tokens use separate secrets.
  JWT_SECRET: z.string().min(1).default('dev-secret-change-me'),
  JWT_REFRESH_SECRET: z.string().min(1).default('dev-refresh-secret-change-me'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  BCRYPT_SALT_ROUNDS: z.coerce.number().int().min(8).max(15).default(12),

  // Email (Resend). When RESEND_API_KEY is empty, the email service falls
  // back to logging OTPs to the server console (handy for dev / CI).
  RESEND_API_KEY: z.string().default(''),
  EMAIL_FROM: z.string().default('FleetPilot <onboarding@resend.dev>'),

  // MFA
  MFA_ISSUER: z.string().default('FleetPilot'),

  CLIENT_URL: z.string().default('https://hb-source.github.io/Car-Fleet-App/'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173,https://hb-source.github.io'),

  SEED_ADMIN_EMAIL: z.string().email().default('admin@fleetpilot.demo'),
  SEED_ADMIN_PASSWORD: z.string().min(8).default('ChangeMe123!'),
  SEED_DRIVER_PASSWORD: z.string().min(8).default('Driver123!'),
  // When true, the server runs the (idempotent) seed on startup. Handy for
  // a hosted first deploy so the database is populated automatically.
  SEED_ON_START: boolFromString.default('false'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:');
  for (const issue of parsed.error.issues) {
    console.error(`   ${issue.path.join('.')}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;

if (env.NODE_ENV === 'production') {
  if (env.JWT_SECRET === 'dev-secret-change-me') {
    console.error('❌ JWT_SECRET must be set to a strong random value in production.');
    process.exit(1);
  }
  if (env.JWT_REFRESH_SECRET === 'dev-refresh-secret-change-me') {
    console.error('❌ JWT_REFRESH_SECRET must be set to a strong random value in production.');
    process.exit(1);
  }
  if (!env.RESEND_API_KEY) {
    console.warn('⚠️  RESEND_API_KEY is not set — OTP emails will be logged, not delivered.');
  }
}

export const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((o) => o.trim())
  .filter(Boolean);
