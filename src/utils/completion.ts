import type { Vehicle } from '../types/vehicle';

interface CompletionField {
  key: string;
  label: string;
  filled: (v: Vehicle, hasPhotos: boolean) => boolean;
}

const FIELDS: CompletionField[] = [
  { key: 'make', label: 'Make', filled: (v) => !!v.make },
  { key: 'car_model', label: 'Model', filled: (v) => !!v.car_model },
  { key: 'year', label: 'Year', filled: (v) => v.year != null },
  { key: 'color', label: 'Colour', filled: (v) => !!v.color },
  { key: 'vin', label: 'VIN', filled: (v) => !!v.vin },
  { key: 'fuel_type', label: 'Fuel type', filled: (v) => !!v.fuel_type },
  { key: 'transmission', label: 'Transmission', filled: (v) => !!v.transmission },
  { key: 'driver', label: 'Assigned driver', filled: (v) => !!v.driver && v.driver !== 'Unassigned' },
  { key: 'location', label: 'Location', filled: (v) => v.latitude != null && v.longitude != null },
  { key: 'insurance_expiry', label: 'Insurance expiry', filled: (v) => !!v.insurance_expiry },
  { key: 'mot_expiry', label: 'MOT / inspection date', filled: (v) => !!v.mot_expiry },
  { key: 'photos', label: 'Photos', filled: (_v, hasPhotos) => hasPhotos },
];

export interface CompletionResult {
  percent: number;
  missing: string[];
}

export function computeCompletion(vehicle: Vehicle, hasPhotos: boolean): CompletionResult {
  const filled = FIELDS.filter((f) => f.filled(vehicle, hasPhotos));
  const missing = FIELDS.filter((f) => !f.filled(vehicle, hasPhotos)).map((f) => f.label);
  return {
    percent: Math.round((filled.length / FIELDS.length) * 100),
    missing,
  };
}
