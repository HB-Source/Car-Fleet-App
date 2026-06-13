import { Vehicle, type VehicleDoc } from '../models/Vehicle.js';
import { VehicleHistory } from '../models/VehicleHistory.js';
import { User, type UserDoc } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import {
  DRIVER_EDITABLE_FIELDS,
  type CreateVehicleInput,
  type UpdateVehicleInput,
} from '../schemas/vehicle.schema.js';

const DRIVER_POPULATE = { path: 'assigned_driver', select: 'name email role active' };

interface ListVehiclesParams {
  status?: string;
  active?: 'true' | 'false';
  q?: string;
  page: number;
  limit: number;
}

export async function listVehicles(params: ListVehiclesParams) {
  const filter: Record<string, unknown> = {};
  if (params.status) filter.status = params.status;
  if (params.active) filter.active = params.active === 'true';
  if (params.q) {
    const rx = new RegExp(params.q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filter.$or = [{ vehicle_name: rx }, { plate_number: rx }, { location_id: rx }];
  }

  const [vehicles, total] = await Promise.all([
    Vehicle.find(filter)
      .sort({ last_updated: -1 })
      .skip((params.page - 1) * params.limit)
      .limit(params.limit)
      .populate(DRIVER_POPULATE),
    Vehicle.countDocuments(filter),
  ]);

  return { vehicles, total };
}

export async function getVehicle(id: string): Promise<VehicleDoc> {
  const vehicle = await Vehicle.findById(id).populate(DRIVER_POPULATE);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  return vehicle;
}

async function resolveDriverId(driverId: string | null | undefined) {
  if (driverId === undefined) return undefined;
  if (driverId === null) return null;
  const driver = await User.findById(driverId);
  if (!driver || !driver.active) {
    throw ApiError.badRequest('Assigned driver not found or inactive', 'invalid_driver');
  }
  return driver._id;
}

export async function createVehicle(input: CreateVehicleInput): Promise<VehicleDoc> {
  const assigned = await resolveDriverId(input.assigned_driver_id);
  const vehicle = await Vehicle.create({
    vehicle_name: input.vehicle_name,
    plate_number: input.plate_number,
    status: input.status,
    assigned_driver: assigned ?? null,
    mileage: input.mileage,
    location_id: input.location_id,
    latitude: input.latitude ?? null,
    longitude: input.longitude ?? null,
    qr_code_id: input.qr_code_id,
    maintenance_notes: input.maintenance_notes ?? null,
    registration_date: input.registration_date ?? null,
    active: input.active,
  });
  return vehicle.populate(DRIVER_POPULATE);
}

export async function updateVehicle(
  id: string,
  input: UpdateVehicleInput,
  actor: UserDoc,
): Promise<VehicleDoc> {
  const vehicle = await getVehicle(id);

  if (actor.role !== 'admin') {
    const assignedId =
      vehicle.assigned_driver && typeof vehicle.assigned_driver === 'object' && '_id' in vehicle.assigned_driver
        ? (vehicle.assigned_driver as unknown as UserDoc)._id
        : vehicle.assigned_driver;
    if (!assignedId || assignedId.toString() !== actor._id.toString()) {
      throw ApiError.forbidden('You can only update vehicles assigned to you');
    }
    const illegal = Object.keys(input).filter(
      (k) => !(DRIVER_EDITABLE_FIELDS as readonly string[]).includes(k),
    );
    if (illegal.length > 0) {
      throw ApiError.forbidden(
        `Drivers cannot change: ${illegal.join(', ')}`,
        'restricted_fields',
      );
    }
  }

  const previous = { status: vehicle.status, mileage: vehicle.mileage };

  if (input.vehicle_name !== undefined) vehicle.vehicle_name = input.vehicle_name;
  if (input.plate_number !== undefined) vehicle.plate_number = input.plate_number;
  if (input.status !== undefined) vehicle.status = input.status as VehicleDoc['status'];
  if (input.mileage !== undefined) vehicle.mileage = input.mileage;
  if (input.location_id !== undefined) vehicle.location_id = input.location_id;
  if (input.latitude !== undefined) vehicle.latitude = input.latitude;
  if (input.longitude !== undefined) vehicle.longitude = input.longitude;
  if (input.qr_code_id !== undefined) vehicle.qr_code_id = input.qr_code_id;
  if (input.maintenance_notes !== undefined) vehicle.maintenance_notes = input.maintenance_notes;
  if (input.registration_date !== undefined) vehicle.registration_date = input.registration_date;
  if (input.active !== undefined) vehicle.active = input.active;
  if (input.assigned_driver_id !== undefined) {
    const resolved = await resolveDriverId(input.assigned_driver_id);
    vehicle.assigned_driver = resolved ?? null;
  }

  await vehicle.save();

  // Record status / mileage changes for the history timeline.
  const historyEntries = [];
  if (input.status !== undefined && input.status !== previous.status) {
    historyEntries.push({
      vehicle: vehicle._id,
      changed_by: actor._id,
      field: 'status' as const,
      old_value: previous.status,
      new_value: input.status,
    });
  }
  if (input.mileage !== undefined && input.mileage !== previous.mileage) {
    historyEntries.push({
      vehicle: vehicle._id,
      changed_by: actor._id,
      field: 'mileage' as const,
      old_value: previous.mileage,
      new_value: input.mileage,
    });
  }
  if (historyEntries.length > 0) {
    await VehicleHistory.insertMany(historyEntries);
  }

  return vehicle.populate(DRIVER_POPULATE);
}

export async function deleteVehicle(id: string): Promise<void> {
  const vehicle = await Vehicle.findByIdAndDelete(id);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');
  await VehicleHistory.deleteMany({ vehicle: vehicle._id });
}

/** QR onboarding: look up by code, activate, wake from offline. */
export async function onboardByQrCode(code: string): Promise<VehicleDoc | null> {
  const vehicle = await Vehicle.findOne({ qr_code_id: code.trim().toUpperCase() });
  if (!vehicle) return null;

  vehicle.active = true;
  if (vehicle.status === 'offline') vehicle.status = 'available';
  await vehicle.save();

  return vehicle.populate(DRIVER_POPULATE);
}

export async function getVehicleHistory(id: string, page: number, limit: number) {
  const vehicle = await Vehicle.findById(id);
  if (!vehicle) throw ApiError.notFound('Vehicle not found');

  const [entries, total] = await Promise.all([
    VehicleHistory.find({ vehicle: vehicle._id })
      .sort({ recorded_at: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({ path: 'changed_by', select: 'name' }),
    VehicleHistory.countDocuments({ vehicle: vehicle._id }),
  ]);

  return { entries, total };
}
