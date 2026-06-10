import type { Vehicle } from '../types/vehicle';

/**
 * Local demo dataset used when no Supabase credentials are configured.
 * Edits are persisted to localStorage so the demo behaves like a real backend.
 */
const STORAGE_KEY = 'fleetpilot-demo-vehicles';

const now = Date.now();
const minutesAgo = (m: number) => new Date(now - m * 60_000).toISOString();

const SEED: Vehicle[] = [
  {
    id: 'b9a4f3a0-0001-4f7e-9d1a-000000000001',
    vehicle_name: 'Ford Transit',
    plate_number: 'AB-123-CD',
    status: 'available',
    driver: 'Unassigned',
    mileage: 45200,
    location_id: 'ams-central',
    latitude: 52.3676,
    longitude: 4.9041,
    qr_code_id: 'QR-VEHICLE-001',
    maintenance_notes: 'Oil change completed at 45,000 km.',
    registration_date: '2022-03-15',
    active: true,
    last_updated: minutesAgo(12),
  },
  {
    id: 'b9a4f3a0-0002-4f7e-9d1a-000000000002',
    vehicle_name: 'Mercedes Sprinter',
    plate_number: 'XK-456-LM',
    status: 'in_use',
    driver: 'Eva Janssen',
    mileage: 81930,
    location_id: 'ams-noord',
    latitude: 52.4009,
    longitude: 4.9145,
    qr_code_id: 'QR-VEHICLE-002',
    maintenance_notes: null,
    registration_date: '2021-07-02',
    active: true,
    last_updated: minutesAgo(3),
  },
  {
    id: 'b9a4f3a0-0003-4f7e-9d1a-000000000003',
    vehicle_name: 'VW ID. Buzz Cargo',
    plate_number: 'EV-789-NL',
    status: 'in_use',
    driver: 'Tom de Vries',
    mileage: 12480,
    location_id: 'ams-zuid',
    latitude: 52.3402,
    longitude: 4.8731,
    qr_code_id: 'QR-VEHICLE-003',
    maintenance_notes: null,
    registration_date: '2024-01-20',
    active: true,
    last_updated: minutesAgo(1),
  },
  {
    id: 'b9a4f3a0-0004-4f7e-9d1a-000000000004',
    vehicle_name: 'Renault Kangoo',
    plate_number: 'RK-321-ZE',
    status: 'maintenance',
    driver: 'Unassigned',
    mileage: 102750,
    location_id: 'haarlem-depot',
    latitude: 52.3874,
    longitude: 4.6462,
    qr_code_id: 'QR-VEHICLE-004',
    maintenance_notes: 'Brake pads replacement scheduled. Vehicle at Haarlem depot.',
    registration_date: '2019-11-08',
    active: true,
    last_updated: minutesAgo(95),
  },
  {
    id: 'b9a4f3a0-0005-4f7e-9d1a-000000000005',
    vehicle_name: 'Toyota Proace',
    plate_number: 'TP-654-GH',
    status: 'available',
    driver: 'Sanne Bakker',
    mileage: 58320,
    location_id: 'utrecht-hub',
    latitude: 52.0907,
    longitude: 5.1214,
    qr_code_id: 'QR-VEHICLE-005',
    maintenance_notes: null,
    registration_date: '2022-09-30',
    active: true,
    last_updated: minutesAgo(34),
  },
  {
    id: 'b9a4f3a0-0006-4f7e-9d1a-000000000006',
    vehicle_name: 'Opel Vivaro',
    plate_number: 'OV-987-QR',
    status: 'offline',
    driver: 'Unassigned',
    mileage: 134220,
    location_id: 'rotterdam-port',
    latitude: 51.9244,
    longitude: 4.4777,
    qr_code_id: 'QR-VEHICLE-006',
    maintenance_notes: 'Telematics unit not reporting since last week.',
    registration_date: '2018-05-17',
    active: false,
    last_updated: minutesAgo(2880),
  },
];

export function loadDemoVehicles(): Vehicle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Vehicle[];
  } catch {
    // corrupted storage — fall through to seed
  }
  return SEED.map((v) => ({ ...v }));
}

export function saveDemoVehicles(vehicles: Vehicle[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(vehicles));
  } catch {
    // storage full or unavailable — demo data just won't persist
  }
}
