import { Schema, model, type Document, type Types } from 'mongoose';

export interface VehicleHistoryDoc extends Document<Types.ObjectId> {
  vehicle: Types.ObjectId;
  changed_by: Types.ObjectId;
  field: 'status' | 'mileage';
  old_value: unknown;
  new_value: unknown;
  recorded_at: Date;
}

const vehicleHistorySchema = new Schema<VehicleHistoryDoc>(
  {
    vehicle: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    changed_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    field: { type: String, enum: ['status', 'mileage'], required: true },
    old_value: { type: Schema.Types.Mixed },
    new_value: { type: Schema.Types.Mixed },
  },
  { timestamps: { createdAt: 'recorded_at', updatedAt: false } },
);

vehicleHistorySchema.index({ vehicle: 1, recorded_at: -1 });

export const VehicleHistory = model<VehicleHistoryDoc>('VehicleHistory', vehicleHistorySchema);
