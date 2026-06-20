import { Schema, model, type Document, type Types } from 'mongoose';

export const VEHICLE_EVENT_CATEGORIES = [
  'service',
  'repair',
  'tyres',
  'insurance',
  'accident',
  'inspection',
  'claim',
  'ownership',
  'mileage',
  'note',
  'other',
] as const;

export type VehicleEventCategory = (typeof VEHICLE_EVENT_CATEGORIES)[number];

export interface VehicleEventDoc extends Document<Types.ObjectId> {
  vehicle: Types.ObjectId;
  category: VehicleEventCategory;
  title: string;
  notes: string | null;
  /** The date the event occurred (user-set, ISO yyyy-mm-dd). */
  event_date: string;
  created_by: Types.ObjectId;
  created_at: Date;
}

const vehicleEventSchema = new Schema<VehicleEventDoc>(
  {
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true, index: true },
    category: { type: String, enum: VEHICLE_EVENT_CATEGORIES, default: 'note' },
    title: { type: String, required: true, trim: true },
    notes: { type: String, default: null },
    event_date: { type: String, required: true },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: false } },
);

vehicleEventSchema.index({ vehicle: 1, event_date: -1 });

export const VehicleEvent = model<VehicleEventDoc>('VehicleEvent', vehicleEventSchema);
