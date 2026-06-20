export type VehicleStatus = 'available' | 'in_use' | 'maintenance' | 'offline';

export interface Vehicle {
  id: string;
  vehicle_name: string;
  plate_number: string;
  status: VehicleStatus;
  driver: string;
  /** Reference to the assigned driver's user account (API mode only). */
  assigned_driver_id?: string | null;
  mileage: number;
  location_id: string;
  latitude: number | null;
  longitude: number | null;
  location_note?: string | null;
  location_updated_at?: string | null;
  qr_code_id: string;
  maintenance_notes: string | null;
  registration_date: string | null;
  active: boolean;
  last_updated: string;

  // --- Digital passport / extended details ---
  make?: string | null;
  car_model?: string | null;
  year?: number | null;
  vin?: string | null;
  color?: string | null;
  fuel_type?: string | null;
  transmission?: string | null;
  vehicle_category?: string | null;
  ownership_status?: string | null;
  insurance_expiry?: string | null;
  road_tax_expiry?: string | null;
  mot_expiry?: string | null;
  purchase_date?: string | null;
  purchase_price?: number | null;
  current_value?: number | null;
}

export type VehicleUpdate = Partial<Omit<Vehicle, 'id' | 'last_updated'>>;

export interface VehicleHistoryEntry {
  id: string;
  field: 'status' | 'mileage';
  old_value: string | number | null;
  new_value: string | number | null;
  changed_by: string | null;
  recorded_at: string;
}

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

export interface VehicleEvent {
  id: string;
  category: VehicleEventCategory;
  title: string;
  notes: string | null;
  event_date: string;
  created_by: string | null;
  created_at: string;
}

export const EVENT_CATEGORY_LABELS: Record<VehicleEventCategory, string> = {
  service: 'Service',
  repair: 'Repair',
  tyres: 'Tyres',
  insurance: 'Insurance',
  accident: 'Accident',
  inspection: 'Inspection',
  claim: 'Insurance claim',
  ownership: 'Ownership',
  mileage: 'Mileage',
  note: 'Note',
  other: 'Other',
};

export const PHOTO_CATEGORIES = [
  'main',
  'front',
  'rear',
  'side',
  'interior',
  'dashboard',
  'damage',
  'custom',
] as const;

export type PhotoCategory = (typeof PHOTO_CATEGORIES)[number];

export interface VehiclePhoto {
  id: string;
  category: PhotoCategory;
  /** Data URL (local-only storage in this phase). */
  dataUrl: string;
  caption?: string;
  added_at: string;
}

export const DOCUMENT_TYPES = [
  'registration',
  'insurance',
  'inspection',
  'purchase_invoice',
  'repair_receipt',
  'other',
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

export interface VehicleDocument {
  id: string;
  type: DocumentType;
  name: string;
  /** Data URL (local-only storage in this phase). */
  dataUrl: string;
  added_at: string;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  registration: 'Registration',
  insurance: 'Insurance',
  inspection: 'Inspection',
  purchase_invoice: 'Purchase invoice',
  repair_receipt: 'Repair receipt',
  other: 'Other',
};

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
