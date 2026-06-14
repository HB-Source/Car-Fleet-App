import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach } from 'vitest';

let mongod: MongoMemoryServer;

/** Boots an in-memory MongoDB for the suite and wipes data between tests. */
export function useTestDb() {
  beforeAll(async () => {
    mongod = await MongoMemoryServer.create();
    await mongoose.connect(mongod.getUri('fleetpilot-test'));
  });

  beforeEach(async () => {
    const collections = await mongoose.connection.db!.collections();
    await Promise.all(collections.map((c) => c.deleteMany({})));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongod.stop();
  });
}

interface SeedUser {
  email?: string;
  password?: string;
  name?: string;
  role?: 'admin' | 'manager' | 'driver' | 'viewer';
  emailVerified?: boolean;
}

/** Create a user directly in the DB (bypassing the email-verification flow). */
export async function createUserDoc(opts: SeedUser = {}) {
  const { User } = await import('../../models/User.js');
  const { hashPassword } = await import('../../utils/password.js');
  return User.create({
    email: opts.email ?? 'user@test.dev',
    name: opts.name ?? 'Test User',
    role: opts.role ?? 'driver',
    password_hash: await hashPassword(opts.password ?? 'Password123!'),
    emailVerified: opts.emailVerified ?? true,
  });
}

/** Drive login → email OTP → verify, returning the access token. */
export async function loginAndGetToken(app: Express, email: string, password: string) {
  const { lastOtpFor } = await import('../../services/email.service.js');
  const login = await request(app).post('/api/auth/login').send({ email, password });
  if (login.status !== 200) throw new Error(`login failed: ${login.status} ${login.text}`);

  const code = lastOtpFor(email);
  if (!code) throw new Error('no OTP captured for ' + email);
  const verify = await request(app).post('/api/auth/verify-email-otp').send({ email, code });
  if (verify.status !== 200) throw new Error(`verify failed: ${verify.status} ${verify.text}`);
  return verify.body.data as {
    accessToken: string;
    refreshToken: string;
    user: { id: string; role: string };
    mfaRequired: boolean;
  };
}

/** Create a verified admin and return an access token. */
export async function createAdmin(app: Express) {
  await createUserDoc({
    email: 'admin@test.dev',
    name: 'Test Admin',
    role: 'admin',
    password: 'AdminPass123!',
    emailVerified: true,
  });
  const session = await loginAndGetToken(app, 'admin@test.dev', 'AdminPass123!');
  return session.accessToken;
}

/** Register a brand-new driver through the real flow and return token + user. */
export async function registerUser(
  app: Express,
  overrides: Partial<{ email: string; password: string; name: string }> = {},
) {
  const { lastOtpFor } = await import('../../services/email.service.js');
  const body = {
    email: 'driver@test.dev',
    password: 'Password123!',
    name: 'Test Driver',
    ...overrides,
  };
  const reg = await request(app).post('/api/auth/register').send(body);
  if (reg.status !== 201) throw new Error(`register failed: ${reg.status} ${reg.text}`);

  const code = lastOtpFor(body.email);
  if (!code) throw new Error('no verification OTP captured');
  const verify = await request(app)
    .post('/api/auth/verify-email-otp')
    .send({ email: body.email, code });
  if (verify.status !== 200) throw new Error(`verify failed: ${verify.status} ${verify.text}`);

  return {
    token: verify.body.data.accessToken as string,
    refreshToken: verify.body.data.refreshToken as string,
    user: verify.body.data.user as { id: string; role: string; email: string },
    body,
  };
}
