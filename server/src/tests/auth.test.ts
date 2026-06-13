import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import { registerUser, useTestDb } from './helpers/setup.js';

const app = buildApp();
useTestDb();

describe('POST /api/auth/register', () => {
  it('creates a driver account and returns a token', async () => {
    const { res } = await registerUser(app);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTruthy();
    expect(res.body.user.email).toBe('driver@test.dev');
    expect(res.body.user.role).toBe('driver');
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it('rejects duplicate emails', async () => {
    await registerUser(app);
    const { res } = await registerUser(app);
    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('email_taken');
  });

  it('rejects weak passwords and bad emails', async () => {
    const bad1 = await request(app)
      .post('/api/auth/register')
      .send({ email: 'x@test.dev', password: 'short', name: 'X' });
    expect(bad1.status).toBe(400);

    const bad2 = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'Password123!', name: 'X' });
    expect(bad2.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials', async () => {
    await registerUser(app);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'driver@test.dev', password: 'Password123!' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });

  it('rejects wrong password with a generic message', async () => {
    await registerUser(app);
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'driver@test.dev', password: 'WrongPass123!' });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('invalid_credentials');
  });

  it('rejects unknown emails', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@test.dev', password: 'Password123!' });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the current user with a valid token', async () => {
    const { res: reg } = await registerUser(app);
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${reg.body.token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('driver@test.dev');
  });

  it('rejects missing or invalid tokens', async () => {
    expect((await request(app).get('/api/auth/me')).status).toBe(401);
    expect(
      (await request(app).get('/api/auth/me').set('Authorization', 'Bearer nonsense')).status,
    ).toBe(401);
  });
});
