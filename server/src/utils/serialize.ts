import type { Types } from 'mongoose';
import type { UserDoc } from '../models/User.js';
import type { VehicleDoc } from '../models/Vehicle.js';
import type { VehicleHistoryDoc } from '../models/VehicleHistory.js';

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
  qr_code_id: string;
  maintenance_notes: string | null;
  registration_date: string | null;
  active: boolean;
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
    qr_code_id: vehicle.qr_code_id,
    maintenance_notes: vehicle.maintenance_notes,
    registration_date: vehicle.registration_date,
    active: vehicle.active,
    last_updated: vehicle.last_updated.toISOString(),
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
