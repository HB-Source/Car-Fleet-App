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

async function createVehicle(overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/vehicles')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      vehicle_name: 'Ford Transit',
      plate_number: 'AB-123-CD',
      qr_code_id: 'QR-VEHICLE-001',
      mileage: 45200,
      location_id: 'ams-central',
      latitude: 52.3676,
      longitude: 4.9041,
      ...overrides,
    });
  return res;
}

describe('vehicle CRUD', () => {
  it('admin can create a vehicle; response matches the frontend shape', async () => {
    const res = await createVehicle();
    expect(res.status).toBe(201);
    const v = res.body.vehicle;
    expect(v.id).toBeTruthy();
    expect(v.driver).toBe('Unassigned');
    expect(v.qr_code_id).toBe('QR-VEHICLE-001');
    expect(v.last_updated).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('driver cannot create or delete vehicles', async () => {
    const create = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ vehicle_name: 'X', plate_number: 'X-1', qr_code_id: 'QR-X' });
    expect(create.status).toBe(403);

    const { body } = await createVehicle();
    const del = await request(app)
      .delete(`/api/vehicles/${body.vehicle.id}`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(del.status).toBe(403);
  });

  it('rejects duplicate plate numbers', async () => {
    await createVehicle();
    const dup = await createVehicle({ qr_code_id: 'QR-VEHICLE-099' });
    expect(dup.status).toBe(409);
  });

  it('lists vehicles with filtering and pagination meta', async () => {
    await createVehicle();
    await createVehicle({
      vehicle_name: 'Opel Vivaro',
      plate_number: 'OV-987-QR',
      qr_code_id: 'QR-VEHICLE-006',
      status: 'offline',
    });

    const all = await request(app)
      .get('/api/vehicles')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(all.status).toBe(200);
    expect(all.body.data).toHaveLength(2);
    expect(all.body.meta.total).toBe(2);

    const offline = await request(app)
      .get('/api/vehicles?status=offline')
      .set('Authorization', `Bearer ${driverToken}`);
    expect(offline.body.data).toHaveLength(1);
    expect(offline.body.data[0].vehicle_name).toBe('Opel Vivaro');
  });

  it('requires authentication for all vehicle routes', async () => {
    expect((await request(app).get('/api/vehicles')).status).toBe(401);
  });
});

describe('role-based vehicle updates', () => {
  it('admin can update any field including driver assignment', async () => {
    const { body } = await createVehicle();
    const res = await request(app)
      .patch(`/api/vehicles/${body.vehicle.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ vehicle_name: 'Renamed', assigned_driver_id: driverId, status: 'in_use' });
    expect(res.status).toBe(200);
    expect(res.body.vehicle.vehicle_name).toBe('Renamed');
    expect(res.body.vehicle.driver).toBe('Test Driver');
    expect(res.body.vehicle.assigned_driver_id).toBe(driverId);
  });

  it('driver can update operational fields on their own vehicle', async () => {
    const { body } = await createVehicle({ assigned_driver_id: undefined });
    await request(app)
      .patch(`/api/vehicles/${body.vehicle.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assigned_driver_id: driverId });

    const res = await request(app)
      .patch(`/api/vehicles/${body.vehicle.id}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'in_use', mileage: 45300 });
    expect(res.status).toBe(200);
    expect(res.body.vehicle.status).toBe('in_use');
    expect(res.body.vehicle.mileage).toBe(45300);
  });

  it("driver cannot update someone else's vehicle", async () => {
    const { body } = await createVehicle(); // unassigned
    const res = await request(app)
      .patch(`/api/vehicles/${body.vehicle.id}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ status: 'in_use' });
    expect(res.status).toBe(403);
  });

  it('driver cannot change restricted fields even on their own vehicle', async () => {
    const { body } = await createVehicle();
    await request(app)
      .patch(`/api/vehicles/${body.vehicle.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assigned_driver_id: driverId });

    const res = await request(app)
      .patch(`/api/vehicles/${body.vehicle.id}`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ plate_number: 'HA-CK-ED' });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('restricted_fields');
  });
});

describe('QR onboarding', () => {
  it('activates a vehicle by QR code, case-insensitively, waking offline vehicles', async () => {
    await createVehicle({ status: 'offline', active: false });
    const res = await request(app)
      .post('/api/vehicles/onboard')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ qr_code_id: 'qr-vehicle-001' });
    expect(res.status).toBe(200);
    expect(res.body.vehicle.active).toBe(true);
    expect(res.body.vehicle.status).toBe('available');
  });

  it('returns 404 for unknown codes', async () => {
    const res = await request(app)
      .post('/api/vehicles/onboard')
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ qr_code_id: 'QR-NOPE' });
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('unknown_qr_code');
  });
});

describe('vehicle history', () => {
  it('records status and mileage changes with the actor', async () => {
    const { body } = await createVehicle();
    await request(app)
      .patch(`/api/vehicles/${body.vehicle.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'maintenance', mileage: 46000 });

    const res = await request(app)
      .get(`/api/vehicles/${body.vehicle.id}/history`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(2);
    const fields = res.body.data.map((e: { field: string }) => e.field).sort();
    expect(fields).toEqual(['mileage', 'status']);
    expect(res.body.data[0].changed_by).toBe('Test Admin');
  });

  it('does not record unchanged values', async () => {
    const { body } = await createVehicle();
    await request(app)
      .patch(`/api/vehicles/${body.vehicle.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'available', location_id: 'elsewhere' });

    const res = await request(app)
      .get(`/api/vehicles/${body.vehicle.id}/history`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.data).toHaveLength(0);
  });
});

describe('digital passport extensions', () => {
  it('stores and returns extended vehicle details + location timestamp', async () => {
    const res = await request(app)
      .post('/api/vehicles')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        vehicle_name: 'BMW 3 Series',
        plate_number: 'AB12-CDE',
        qr_code_id: 'QR-BMW-1',
        make: 'BMW',
        car_model: '3 Series',
        year: 2021,
        color: 'Black',
        fuel_type: 'Petrol',
        transmission: 'Automatic',
        latitude: 51.5,
        longitude: -0.12,
        location_note: 'Depot A',
      });
    expect(res.status).toBe(201);
    expect(res.body.vehicle.make).toBe('BMW');
    expect(res.body.vehicle.car_model).toBe('3 Series');
    expect(res.body.vehicle.year).toBe(2021);
    expect(res.body.vehicle.location_note).toBe('Depot A');
    expect(res.body.vehicle.location_updated_at).toBeTruthy();
  });

  it('manages history events with role checks', async () => {
    const { body } = await createVehicle();
    const id = body.vehicle.id;

    const created = await request(app)
      .post(`/api/vehicles/${id}/events`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ category: 'service', title: 'Oil + filter change', event_date: '2026-06-12' });
    expect(created.status).toBe(201);
    expect(created.body.event.category).toBe('service');
    expect(created.body.event.created_by).toBe('Test Admin');

    const list = await request(app)
      .get(`/api/vehicles/${id}/events`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(1);

    // A driver who isn't assigned cannot add events.
    const forbidden = await request(app)
      .post(`/api/vehicles/${id}/events`)
      .set('Authorization', `Bearer ${driverToken}`)
      .send({ category: 'note', title: 'nope', event_date: '2026-06-12' });
    expect(forbidden.status).toBe(403);

    const del = await request(app)
      .delete(`/api/vehicles/${id}/events/${created.body.event.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.status).toBe(204);
  });

  it('generates a QR code data URL for a vehicle', async () => {
    const { body } = await createVehicle({ qr_code_id: 'QR-PASS-1' });
    const res = await request(app)
      .get(`/api/vehicles/${body.vehicle.id}/qr`)
      .set('Authorization', `Bearer ${driverToken}`);
    expect(res.status).toBe(200);
    expect(res.body.payload).toBe('QR-PASS-1');
    expect(res.body.qrCodeDataUrl).toMatch(/^data:image\/png/);
  });
});
