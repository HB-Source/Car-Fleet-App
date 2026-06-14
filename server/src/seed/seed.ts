/**
 * Idempotent seed: creates the initial admin, three demo drivers and the
 * six demo vehicles (matching the frontend's demo dataset). Safe to re-run —
 * existing records are matched by email / qr_code_id and left in place.
 *
 *   npm run seed
 */
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Vehicle } from '../models/Vehicle.js';
import { hashPassword } from '../utils/password.js';

const DRIVERS = [
  { name: 'Eva Janssen', email: 'eva@fleetpilot.demo' },
  { name: 'Tom de Vries', email: 'tom@fleetpilot.demo' },
  { name: 'Sanne Bakker', email: 'sanne@fleetpilot.demo' },
];

const VEHICLES = [
  {
    vehicle_name: 'Ford Transit',
    plate_number: 'AB-123-CD',
    status: 'available',
    driverEmail: null,
    mileage: 45200,
    location_id: 'ams-central',
    latitude: 52.3676,
    longitude: 4.9041,
    qr_code_id: 'QR-VEHICLE-001',
    maintenance_notes: 'Oil change completed at 45,000 km.',
    registration_date: '2022-03-15',
    active: true,
  },
  {
    vehicle_name: 'Mercedes Sprinter',
    plate_number: 'XK-456-LM',
    status: 'in_use',
    driverEmail: 'eva@fleetpilot.demo',
    mileage: 81930,
    location_id: 'ams-noord',
    latitude: 52.4009,
    longitude: 4.9145,
    qr_code_id: 'QR-VEHICLE-002',
    maintenance_notes: null,
    registration_date: '2021-07-02',
    active: true,
  },
  {
    vehicle_name: 'VW ID. Buzz Cargo',
    plate_number: 'EV-789-NL',
    status: 'in_use',
    driverEmail: 'tom@fleetpilot.demo',
    mileage: 12480,
    location_id: 'ams-zuid',
    latitude: 52.3402,
    longitude: 4.8731,
    qr_code_id: 'QR-VEHICLE-003',
    maintenance_notes: null,
    registration_date: '2024-01-20',
    active: true,
  },
  {
    vehicle_name: 'Renault Kangoo',
    plate_number: 'RK-321-ZE',
    status: 'maintenance',
    driverEmail: null,
    mileage: 102750,
    location_id: 'haarlem-depot',
    latitude: 52.3874,
    longitude: 4.6462,
    qr_code_id: 'QR-VEHICLE-004',
    maintenance_notes: 'Brake pads replacement scheduled. Vehicle at Haarlem depot.',
    registration_date: '2019-11-08',
    active: true,
  },
  {
    vehicle_name: 'Toyota Proace',
    plate_number: 'TP-654-GH',
    status: 'available',
    driverEmail: 'sanne@fleetpilot.demo',
    mileage: 58320,
    location_id: 'utrecht-hub',
    latitude: 52.0907,
    longitude: 5.1214,
    qr_code_id: 'QR-VEHICLE-005',
    maintenance_notes: null,
    registration_date: '2022-09-30',
    active: true,
  },
  {
    vehicle_name: 'Opel Vivaro',
    plate_number: 'OV-987-QR',
    status: 'offline',
    driverEmail: null,
    mileage: 134220,
    location_id: 'rotterdam-port',
    latitude: 51.9244,
    longitude: 4.4777,
    qr_code_id: 'QR-VEHICLE-006',
    maintenance_notes: 'Telematics unit not reporting since last week.',
    registration_date: '2018-05-17',
    active: false,
  },
] as const;

export async function runSeed(): Promise<void> {
  // Admin
  const adminEmail = env.SEED_ADMIN_EMAIL.toLowerCase();
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      email: adminEmail,
      name: 'Fleet Admin',
      role: 'admin',
      password_hash: await hashPassword(env.SEED_ADMIN_PASSWORD),
      emailVerified: true,
    });
    console.log(`✔ Created admin ${adminEmail}`);
  } else {
    console.log(`• Admin ${adminEmail} already exists`);
  }

  // Drivers
  const driversByEmail = new Map<string, string>();
  for (const d of DRIVERS) {
    let user = await User.findOne({ email: d.email });
    if (!user) {
      user = await User.create({
        email: d.email,
        name: d.name,
        role: 'driver',
        password_hash: await hashPassword(env.SEED_DRIVER_PASSWORD),
        emailVerified: true,
      });
      console.log(`✔ Created driver ${d.email}`);
    } else {
      console.log(`• Driver ${d.email} already exists`);
    }
    driversByEmail.set(d.email, user._id.toString());
  }

  // Vehicles
  for (const v of VEHICLES) {
    const existing = await Vehicle.findOne({ qr_code_id: v.qr_code_id });
    if (existing) {
      console.log(`• Vehicle ${v.qr_code_id} already exists`);
      continue;
    }
    await Vehicle.create({
      vehicle_name: v.vehicle_name,
      plate_number: v.plate_number,
      status: v.status,
      assigned_driver: v.driverEmail ? driversByEmail.get(v.driverEmail) : null,
      mileage: v.mileage,
      location_id: v.location_id,
      latitude: v.latitude,
      longitude: v.longitude,
      qr_code_id: v.qr_code_id,
      maintenance_notes: v.maintenance_notes,
      registration_date: v.registration_date,
      active: v.active,
    });
    console.log(`✔ Created vehicle ${v.vehicle_name} (${v.qr_code_id})`);
  }
}

// Run directly via `npm run seed` (not when imported by dev-memory).
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  const { connectDb, disconnectDb } = await import('../db/connect.js');
  await connectDb();
  try {
    await runSeed();
    console.log('Seed complete.');
  } finally {
    await disconnectDb();
  }
}
