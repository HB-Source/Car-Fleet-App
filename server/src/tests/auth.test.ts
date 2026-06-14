import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { authenticator } from 'otplib';
import { buildApp } from '../app.js';
import { lastOtpFor } from '../services/email.service.js';
import { createUserDoc, loginAndGetToken, registerUser, useTestDb } from './helpers/setup.js';

const app = buildApp();
useTestDb();

function secretFromOtpauth(url: string): string {
  return new URL(url).searchParams.get('secret') ?? '';
}

describe('registration + email verification', () => {
  it('registers a driver, emails an OTP, and returns no token yet', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ann', email: 'ann@test.dev', password: 'Password123!' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.requiresEmailVerification).toBe(true);
    expect(res.body.data.accessToken).toBeUndefined();
    expect(lastOtpFor('ann@test.dev')).toMatch(/^\d{6}$/);
  });

  it('rejects duplicate emails and weak input', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ann', email: 'ann@test.dev', password: 'Password123!' });
    const dup = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ann', email: 'ann@test.dev', password: 'Password123!' });
    expect(dup.status).toBe(409);

    const weak = await request(app)
      .post('/api/auth/register')
      .send({ name: 'X', email: 'x@test.dev', password: 'short' });
    expect(weak.status).toBe(400);
  });

  it('verifies the email OTP and auto-issues tokens', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Ann', email: 'ann@test.dev', password: 'Password123!' });
    const code = lastOtpFor('ann@test.dev')!;

    const wrong = await request(app)
      .post('/api/auth/verify-email-otp')
      .send({ email: 'ann@test.dev', code: '000000' });
    expect(wrong.status).toBe(400);

    const res = await request(app)
      .post('/api/auth/verify-email-otp')
      .send({ email: 'ann@test.dev', code });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();
    expect(res.body.data.user.emailVerified).toBe(true);
    expect(res.body.data.user.role).toBe('driver');

    // OTP is single-use.
    const reuse = await request(app)
      .post('/api/auth/verify-email-otp')
      .send({ email: 'ann@test.dev', code });
    expect(reuse.status).toBe(400);
  });
});

describe('login + login OTP', () => {
  it('unverified login triggers email verification, not an OTP login', async () => {
    await createUserDoc({ email: 'u@test.dev', password: 'Password123!', emailVerified: false });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'u@test.dev', password: 'Password123!' });
    expect(res.status).toBe(200);
    expect(res.body.data.requiresEmailVerification).toBe(true);
  });

  it('verified login emails an OTP, which exchanges for tokens', async () => {
    await createUserDoc({ email: 'v@test.dev', password: 'Password123!', emailVerified: true });
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'v@test.dev', password: 'Password123!' });
    expect(login.body.data.requiresOtp).toBe(true);

    const session = await loginAndGetToken(app, 'v@test.dev', 'Password123!');
    expect(session.accessToken).toBeTruthy();
    expect(session.mfaRequired).toBe(false);
  });

  it('rejects wrong passwords and locks the account after 5 failures', async () => {
    await createUserDoc({ email: 'lock@test.dev', password: 'Password123!', emailVerified: true });
    for (let i = 0; i < 5; i++) {
      const r = await request(app)
        .post('/api/auth/login')
        .send({ email: 'lock@test.dev', password: 'WrongPass1!' });
      expect(r.status).toBe(401);
    }
    const locked = await request(app)
      .post('/api/auth/login')
      .send({ email: 'lock@test.dev', password: 'Password123!' });
    expect(locked.status).toBe(429);
    expect(locked.body.message).toMatch(/locked/i);
  });
});

describe('session endpoints', () => {
  it('GET /me requires a token and returns the user', async () => {
    const { token } = await registerUser(app);
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.user.email).toBe('driver@test.dev');

    expect((await request(app).get('/api/auth/me')).status).toBe(401);
  });

  it('refreshes an access token', async () => {
    const { refreshToken } = await registerUser(app);
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });
    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();

    const bad = await request(app).post('/api/auth/refresh').send({ refreshToken: 'nope' });
    expect(bad.status).toBe(401);
  });
});

describe('MFA (TOTP)', () => {
  it('sets up, enables, and enforces MFA at login (TOTP and backup code)', async () => {
    const { token } = await registerUser(app, { email: 'mfa@test.dev' });

    const setup = await request(app)
      .post('/api/auth/mfa/setup')
      .set('Authorization', `Bearer ${token}`);
    expect(setup.status).toBe(200);
    expect(setup.body.data.qrCodeDataUrl).toMatch(/^data:image\/png/);
    expect(setup.body.data.backupCodes).toHaveLength(10);
    const secret = secretFromOtpauth(setup.body.data.otpauthUrl);
    const backupCode = setup.body.data.backupCodes[0] as string;

    const enable = await request(app)
      .post('/api/auth/mfa/verify')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: authenticator.generate(secret) });
    expect(enable.status).toBe(200);

    // Next login now requires MFA after the email OTP.
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'mfa@test.dev', password: 'Password123!' });
    expect(login.body.data.requiresOtp).toBe(true);
    const otp = lastOtpFor('mfa@test.dev')!;
    const otpStep = await request(app)
      .post('/api/auth/verify-email-otp')
      .send({ email: 'mfa@test.dev', code: otp });
    expect(otpStep.body.data.mfaRequired).toBe(true);
    const mfaToken = otpStep.body.data.mfaToken as string;

    const totpLogin = await request(app)
      .post('/api/auth/mfa/verify')
      .send({ mfaToken, code: authenticator.generate(secret) });
    expect(totpLogin.status).toBe(200);
    expect(totpLogin.body.data.accessToken).toBeTruthy();

    // A backup code also works (single-use) on a fresh challenge.
    await request(app).post('/api/auth/login').send({ email: 'mfa@test.dev', password: 'Password123!' });
    const otp2 = lastOtpFor('mfa@test.dev')!;
    const step2 = await request(app)
      .post('/api/auth/verify-email-otp')
      .send({ email: 'mfa@test.dev', code: otp2 });
    const backupLogin = await request(app)
      .post('/api/auth/mfa/verify')
      .send({ mfaToken: step2.body.data.mfaToken, code: backupCode });
    expect(backupLogin.status).toBe(200);
  });
});
