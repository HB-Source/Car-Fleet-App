import { Schema, model, type Document, type Types } from 'mongoose';

export type UserRole = 'admin' | 'driver';

export interface UserDoc extends Document<Types.ObjectId> {
  email: string;
  password_hash: string;
  name: string;
  role: UserRole;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDoc>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password_hash: { type: String, required: true, select: false },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['admin', 'driver'],
      default: 'driver',
      index: true,
    },
    active: { type: Boolean, default: true },
  },
  { timestamps: true },
);

export const User = model<UserDoc>('User', userSchema);
