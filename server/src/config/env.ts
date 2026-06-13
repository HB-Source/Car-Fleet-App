import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/fleetpilot'),
  JWT_SECRET: z.string().min(1).default('dev-secret-change-me'),
  JWT_EXPIRES_IN: z.string().default('24h'),
  CORS_ORIGINS: z
    .string()
    .default('http://localhost:5173,https://hb-source.github.io'),
  SEED_ADMIN_EMAIL: z.string().email().default('admin@fleetpilot.demo'),
  SEED_ADMIN_PASSWORD: z.string().min(8).default('ChangeMe123!'),
  SEED_DRIVER_PASSWORD: z.string().min(8).default('Driver123!'),
  // When true, the server runs the (idempotent) seed on startup. Handy for
  // a hosted first deploy so the database is populated automatically.
  SEED_ON_START: z
    .enum(['true', 'false'])
    .default('false')
    .transform((v) => v === 'true'),
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

if (env.NODE_ENV === 'production' && env.JWT_SECRET === 'dev-secret-change-me') {
  console.error('❌ JWT_SECRET must be set to a strong random value in production.');
  process.exit(1);
}

export const corsOrigins = env.CORS_ORIGINS.split(',')
  .map((o) => o.trim())
  .filter(Boolean);
