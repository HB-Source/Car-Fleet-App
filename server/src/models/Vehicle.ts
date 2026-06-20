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
  location_note: string | null;
  location_updated_at: Date | null;
  qr_code_id: string;
  maintenance_notes: string | null;
  registration_date: string | null;
  active: boolean;

  // --- Digital passport / extended details ---
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

  created_at: Date;
  last_updated: Date;
}

const vehicleSchema = new Schema<VehicleDoc>(
  {
    vehicle_name: { type: String, required: true, trim: true },
    plate_number: { type: String, required: true, trim: true, unique: true },
    status: { type: String, enum: VEHICLE_STATUSES, default: 'available', index: true },
    assigned_driver: { type: Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    mileage: { type: Number, min: 0, default: 0 },
    location_id: { type: String, default: '', trim: true },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    location_note: { type: String, default: null },
    location_updated_at: { type: Date, default: null },
    // Stored uppercase so lookups are case-insensitive.
    qr_code_id: { type: String, required: true, unique: true, uppercase: true, trim: true },
    maintenance_notes: { type: String, default: null },
    registration_date: { type: String, default: null },
    active: { type: Boolean, default: true },

    make: { type: String, default: null, trim: true },
    car_model: { type: String, default: null, trim: true },
    year: { type: Number, default: null },
    vin: { type: String, default: null, trim: true },
    color: { type: String, default: null, trim: true },
    fuel_type: { type: String, default: null, trim: true },
    transmission: { type: String, default: null, trim: true },
    vehicle_category: { type: String, default: null, trim: true },
    ownership_status: { type: String, default: null, trim: true },
    insurance_expiry: { type: String, default: null },
    road_tax_expiry: { type: String, default: null },
    mot_expiry: { type: String, default: null },
    purchase_date: { type: String, default: null },
    purchase_price: { type: Number, default: null },
    current_value: { type: Number, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'last_updated' } },
);

vehicleSchema.index({ last_updated: -1 });

export const Vehicle = model<VehicleDoc>('Vehicle', vehicleSchema);
