import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import type { Express } from 'express';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach } from 'vitest';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';

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

export async function registerUser(
  app: Express,
  overrides: Partial<{ email: string; password: string; name: string }> = {},
) {
  const body = {
    email: 'driver@test.dev',
    password: 'Password123!',
    name: 'Test Driver',
    ...overrides,
  };
  const res = await request(app).post('/api/auth/register').send(body);
  return { res, body };
}

/** Creates an admin directly in the DB (registration only makes drivers). */
export async function createAdmin(app: Express) {
  const { User } = await import('../../models/User.js');
  const { hashPassword } = await import('../../utils/password.js');
  await User.create({
    email: 'admin@test.dev',
    name: 'Test Admin',
    role: 'admin',
    password_hash: await hashPassword('AdminPass123!'),
  });
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.dev', password: 'AdminPass123!' });
  return res.body.token as string;
}
