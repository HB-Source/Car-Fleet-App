import { z } from 'zod';
import { VEHICLE_STATUSES } from '../models/Vehicle.js';

const statusEnum = z.enum(VEHICLE_STATUSES as [string, ...string[]]);

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');

export const createVehicleSchema = z.object({
  vehicle_name: z.string().trim().min(1).max(120),
  plate_number: z.string().trim().min(1).max(20),
  status: statusEnum.default('available'),
  assigned_driver_id: objectId.nullable().optional(),
  mileage: z.number().int().min(0).default(0),
  location_id: z.string().trim().max(120).default(''),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  qr_code_id: z.string().trim().min(1).max(64),
  maintenance_notes: z.string().max(2000).nullable().optional(),
  registration_date: z.string().max(30).nullable().optional(),
  active: z.boolean().default(true),
});

export const updateVehicleSchema = createVehicleSchema.partial();

/** Fields a driver may update on their own vehicle. */
export const DRIVER_EDITABLE_FIELDS = [
  'status',
  'mileage',
  'latitude',
  'longitude',
  'location_id',
  'maintenance_notes',
] as const;

export const onboardSchema = z.object({
  qr_code_id: z.string().trim().min(1).max(64),
});

export const listVehiclesQuerySchema = z.object({
  status: statusEnum.optional(),
  active: z.enum(['true', 'false']).optional(),
  q: z.string().max(120).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(500).default(200),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
