import { Schema, model, type Document, type Types } from 'mongoose';

export type VehicleStatus = 'available' | 'in_use' | 'maintenance' | 'offline';

export const VEHICLE_STATUSES: VehicleStatus[] = [
  'available',
  'in_use',
  'maintenance',
  'offline',
];

export interface VehicleDoc extends Document<Types.ObjectId> {
  vehicle_name: string;
  plate_number: string;
  status: VehicleStatus;
  assigned_driver: Types.ObjectId | null;
  mileage: number;
  location_id: string;
  latitude: number | null;
  longitude: number | null;
  qr_code_id: string;
  maintenance_notes: string | null;
  registration_date: string | null;
  active: boolean;
  created_at: Date;
  last_updated: Date;
}

const vehicleSchema = new Schema<VehicleDoc>(
  {
    vehicle_name: { type: String, required: true, trim: true },
    plate_number: { type: String, required: true, trim: true, unique: true },
    status: {
      type: String,
      enum: VEHICLE_STATUSES,
      default: 'available',
      index: true,
    },
    assigned_driver: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    mileage: { type: Number, min: 0, default: 0 },
    location_id: { type: String, default: '', trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    // Stored uppercase so lookups are case-insensitive.
    qr_code_id: { type: String, required: true, unique: true, uppercase: true, trim: true },
    maintenance_notes: { type: String, default: null },
    registration_date: { type: String, default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'last_updated' } },
);

vehicleSchema.index({ last_updated: -1 });

export const Vehicle = model<VehicleDoc>('Vehicle', vehicleSchema);
