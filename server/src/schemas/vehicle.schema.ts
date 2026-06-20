import { z } from 'zod';
import { VEHICLE_STATUSES } from '../models/Vehicle.js';
import { VEHICLE_EVENT_CATEGORIES } from '../models/VehicleEvent.js';

const statusEnum = z.enum(VEHICLE_STATUSES as [string, ...string[]]);
const objectId = z.string().regex(/^[a-f0-9]{24}$/i, 'Invalid id');

// Optional free-text passport fields (nullable).
const text = (max: number) => z.string().trim().max(max).nullable().optional();

export const createVehicleSchema = z.object({
  vehicle_name: z.string().trim().min(1).max(120),
  plate_number: z.string().trim().min(1).max(20),
  status: statusEnum.default('available'),
  assigned_driver_id: objectId.nullable().optional(),
  mileage: z.number().int().min(0).default(0),
  location_id: z.string().trim().max(120).default(''),
  latitude: z.number().min(-90).max(90).nullable().optional(),
  longitude: z.number().min(-180).max(180).nullable().optional(),
  location_note: text(200),
  qr_code_id: z.string().trim().min(1).max(64),
  maintenance_notes: z.string().max(2000).nullable().optional(),
  registration_date: text(30),

  make: text(60),
  car_model: text(60),
  year: z.number().int().min(1900).max(2100).nullable().optional(),
  vin: text(40),
  color: text(40),
  fuel_type: text(40),
  transmission: text(40),
  vehicle_category: text(40),
  ownership_status: text(40),
  insurance_expiry: text(30),
  road_tax_expiry: text(30),
  mot_expiry: text(30),
  purchase_date: text(30),
  purchase_price: z.number().min(0).nullable().optional(),
  current_value: z.number().min(0).nullable().optional(),

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
  'location_note',
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

export const createEventSchema = z.object({
  category: z.enum(VEHICLE_EVENT_CATEGORIES as unknown as [string, ...string[]]).default('note'),
  title: z.string().trim().min(1).max(120),
  notes: z.string().max(2000).nullable().optional(),
  event_date: z.string().trim().min(1).max(30),
});

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;
export type CreateEventInput = z.infer<typeof createEventSchema>;
