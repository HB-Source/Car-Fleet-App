import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../app.js';
import { createAdmin, registerUser, useTestDb } from './helpers/setup.js';

const app = buildApp();
useTestDb();

let adminToken: string;
let driverToken: string;
let driverId: string;

beforeEach(async () => {
  adminToken = await createAdmin(app);
  const driver = await registerUser(app);
  driverToken = driver.token;
  driverId = driver.user.id;
});

describe('user management', () => {
  it('admin can list users', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.length).toBe(2);
    expect(res.body.meta.total).toBe(2);
  });

  it('driver cannot list users', async () => {
    const res = await request(app).get('/api/users').set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(403);
  });

  it('admin can create another admin', async () => {
    const res = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'boss@test.dev', password: 'Password123!', name: 'Boss', role: 'admin' });
    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('admin');
  });

  it('admin can change a user role and deactivate them', async () => {
    const promote = await request(app)
      .patch(`/api/users/${driverId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ role: 'admin' });
    expect(promote.status).toBe(200);
    expect(promote.body.user.role).toBe('admin');

    const deactivate = await request(app)
      .patch(`/api/users/${driverId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ active: false });
    expect(deactivate.status).toBe(200);

    // Deactivated user's token no longer works
    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(me.status).toBe(401);
  });

  it('driver can update own name but not own role', async () => {
    const name = await request(app)
      .patch(`/api/users/${driverId}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ name: 'New Name' });
    expect(name.status).toBe(200);
    expect(name.body.user.name).toBe('New Name');

    const role = await request(app)
      .patch(`/api/users/${driverId}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ role: 'admin' });
    expect(role.status).toBe(403);
  });

  it('soft-deleting a driver unassigns their vehicles', async () => {
    const vehicle = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        vehicle_name: 'Van',
        plate_number: 'V-1',
        qr_code_id: 'QR-V1',
        assigned_driver_id: driverId,
      });
    expect(vehicle.body.vehicle.assigned_driver_id).toBe(driverId);

    const del = await request(app)
      .delete(`/api/users/${driverId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(204);

    const after = await request(app)
      .get(`/api/vehicles/${vehicle.body.vehicle.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(after.body.vehicle.driver).toBe('Unassigned');
    expect(after.body.vehicle.assigned_driver_id).toBeNull();
  });

  it('admin cannot delete their own account', async () => {
    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${adminToken}`);
    const res = await request(app)
      .delete(`/api/users/${me.body.data.user.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(400);
  });
});
