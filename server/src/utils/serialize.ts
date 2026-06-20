import type { Types } from 'mongoose';
import type { UserDoc } from '../models/User.js';
import type { VehicleDoc } from '../models/Vehicle.js';
import type { VehicleHistoryDoc } from '../models/VehicleHistory.js';
import type { VehicleEventDoc } from '../models/VehicleEvent.js';

export interface UserJson {
  id: string;
  email: string;
  name: string;
  role: string;
  active: boolean;
  emailVerified: boolean;
  mfaEnabled: boolean;
  lastLoginAt: string | null;
  created_at: string;
}

export function serializeUser(user: UserDoc): UserJson {
  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
    active: user.active,
    emailVerified: user.emailVerified,
    mfaEnabled: user.mfaEnabled,
    lastLoginAt: user.lastLoginAt ? user.lastLoginAt.toISOString() : null,
    created_at: user.createdAt.toISOString(),
  };
}

/**
 * Matches the frontend's Vehicle interface (src/types/vehicle.ts).
 * `driver` is the populated driver's display name; `assigned_driver_id`
 * carries the reference for role checks and admin assignment.
 */
export interface VehicleJson {
  id: string;
  vehicle_name: string;
  plate_number: string;
  status: string;
  driver: string;
  assigned_driver_id: string | null;
  mileage: number;
  location_id: string;
  latitude: number | null;
  longitude: number | null;
  location_note: string | null;
  location_updated_at: string | null;
  qr_code_id: string;
  maintenance_notes: string | null;
  registration_date: string | null;
  active: boolean;
  make: string | null;
  car_model: string | null;
  year: number | null;
  vin: string | null;
  color: string | null;
  fuel_type: string | null;
  transmission: string | null;
  vehicle_category: string | null;
  ownership_status: string | null;
  insurance_expiry: string | null;
  road_tax_expiry: string | null;
  mot_expiry: string | null;
  purchase_date: string | null;
  purchase_price: number | null;
  current_value: number | null;
  last_updated: string;
}

type MaybePopulatedDriver = Types.ObjectId | (UserDoc & { name: string }) | null;

function isPopulatedDriver(driver: MaybePopulatedDriver): driver is UserDoc {
  return Boolean(driver && typeof driver === 'object' && 'name' in driver);
}

export function serializeVehicle(vehicle: VehicleDoc): VehicleJson {
  const driverRef = vehicle.assigned_driver as MaybePopulatedDriver;
  const populated = isPopulatedDriver(driverRef) ? driverRef : null;

  return {
    id: vehicle._id.toString(),
    vehicle_name: vehicle.vehicle_name,
    plate_number: vehicle.plate_number,
    status: vehicle.status,
    driver: populated?.name ?? 'Unassigned',
    assigned_driver_id: populated
      ? populated._id.toString()
      : driverRef
        ? driverRef.toString()
        : null,
    mileage: vehicle.mileage,
    location_id: vehicle.location_id,
    latitude: vehicle.latitude,
    longitude: vehicle.longitude,
    location_note: vehicle.location_note,
    location_updated_at: vehicle.location_updated_at
      ? vehicle.location_updated_at.toISOString()
      : null,
    qr_code_id: vehicle.qr_code_id,
    maintenance_notes: vehicle.maintenance_notes,
    registration_date: vehicle.registration_date,
    active: vehicle.active,
    make: vehicle.make,
    car_model: vehicle.car_model,
    year: vehicle.year,
    vin: vehicle.vin,
    color: vehicle.color,
    fuel_type: vehicle.fuel_type,
    transmission: vehicle.transmission,
    vehicle_category: vehicle.vehicle_category,
    ownership_status: vehicle.ownership_status,
    insurance_expiry: vehicle.insurance_expiry,
    road_tax_expiry: vehicle.road_tax_expiry,
    mot_expiry: vehicle.mot_expiry,
    purchase_date: vehicle.purchase_date,
    purchase_price: vehicle.purchase_price,
    current_value: vehicle.current_value,
    last_updated: vehicle.last_updated.toISOString(),
  };
}

export function serializeEvent(event: VehicleEventDoc & { created_by?: unknown }) {
  const by = event.created_by;
  const byName =
    by && typeof by === 'object' && 'name' in by ? String((by as { name: string }).name) : null;
  return {
    id: event._id.toString(),
    category: event.category,
    title: event.title,
    notes: event.notes,
    event_date: event.event_date,
    created_by: byName,
    created_at: event.created_at.toISOString(),
  };
}

export function serializeHistory(entry: VehicleHistoryDoc & { changed_by?: unknown }) {
  const changedBy = entry.changed_by;
  const changedByName =
    changedBy && typeof changedBy === 'object' && 'name' in changedBy
      ? String((changedBy as { name: string }).name)
      : null;

  return {
    id: entry._id.toString(),
    field: entry.field,
    old_value: entry.old_value,
    new_value: entry.new_value,
    changed_by: changedByName,
    recorded_at: entry.recorded_at.toISOString(),
  };
}
