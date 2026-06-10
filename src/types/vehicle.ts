export type VehicleStatus = 'available' | 'in_use' | 'maintenance' | 'offline';

export interface Vehicle {
  id: string;
  vehicle_name: string;
  plate_number: string;
  status: VehicleStatus;
  driver: string;
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

export type VehicleUpdate = Partial<
  Omit<Vehicle, 'id' | 'last_updated'>
>;

export const VEHICLE_STATUSES: VehicleStatus[] = [
  'available',
  'in_use',
  'maintenance',
  'offline',
];

export const STATUS_LABELS: Record<VehicleStatus, string> = {
  available: 'Available',
  in_use: 'In Use',
  maintenance: 'Maintenance',
  offline: 'Offline',
};
