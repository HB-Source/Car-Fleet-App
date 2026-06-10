import { describe, expect, it } from 'vitest';
import { filterVehicles } from '../utils/filterVehicles';
import type { Vehicle } from '../types/vehicle';

function makeVehicle(overrides: Partial<Vehicle>): Vehicle {
  return {
    id: 'id-1',
    vehicle_name: 'Ford Transit',
    plate_number: 'AB-123-CD',
    status: 'available',
    driver: 'Unassigned',
    mileage: 45200,
    location_id: 'ams-central',
    latitude: 52.3676,
    longitude: 4.9041,
    qr_code_id: 'QR-VEHICLE-001',
    maintenance_notes: null,
    registration_date: '2022-03-15',
    active: true,
    last_updated: '2026-06-10T12:00:00Z',
    ...overrides,
  };
}

const fleet: Vehicle[] = [
  makeVehicle({ id: 'a', vehicle_name: 'Ford Transit', last_updated: '2026-06-10T10:00:00Z' }),
  makeVehicle({
    id: 'b',
    vehicle_name: 'Mercedes Sprinter',
    plate_number: 'XK-456-LM',
    status: 'in_use',
    driver: 'Eva Janssen',
    mileage: 81930,
    last_updated: '2026-06-10T12:00:00Z',
  }),
  makeVehicle({
    id: 'c',
    vehicle_name: 'Renault Kangoo',
    status: 'maintenance',
    location_id: 'haarlem-depot',
    mileage: 102750,
    last_updated: '2026-06-09T08:00:00Z',
  }),
];

describe('filterVehicles', () => {
  it('returns all vehicles sorted by latest update by default', () => {
    const result = filterVehicles(fleet, '', 'all');
    expect(result.map((v) => v.id)).toEqual(['b', 'a', 'c']);
  });

  it('filters by status', () => {
    const result = filterVehicles(fleet, '', 'maintenance');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('c');
  });

  it('searches across name, plate, driver and location', () => {
    expect(filterVehicles(fleet, 'sprinter', 'all')).toHaveLength(1);
    expect(filterVehicles(fleet, 'XK-456', 'all')).toHaveLength(1);
    expect(filterVehicles(fleet, 'eva', 'all')).toHaveLength(1);
    expect(filterVehicles(fleet, 'haarlem', 'all')).toHaveLength(1);
    expect(filterVehicles(fleet, 'nonexistent', 'all')).toHaveLength(0);
  });

  it('combines search and status filter', () => {
    expect(filterVehicles(fleet, 'ford', 'maintenance')).toHaveLength(0);
    expect(filterVehicles(fleet, 'ford', 'available')).toHaveLength(1);
  });

  it('sorts by name and mileage', () => {
    expect(filterVehicles(fleet, '', 'all', 'name')[0].vehicle_name).toBe('Ford Transit');
    expect(filterVehicles(fleet, '', 'all', 'mileage')[0].mileage).toBe(102750);
  });
});
