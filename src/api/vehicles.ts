import { apiRequest, ApiRequestError, isApiConfigured } from './client';
import { loadDemoVehicles, saveDemoVehicles } from '../lib/demoData';
import type {
  Vehicle,
  VehicleEvent,
  VehicleEventCategory,
  VehicleHistoryEntry,
  VehicleUpdate,
} from '../types/vehicle';

const POLL_INTERVAL_MS = 15_000;

/** Create a vehicle (admin/manager). Demo mode appends to local storage. */
export async function createVehicle(input: Partial<Vehicle>): Promise<Vehicle> {
  if (!isApiConfigured) {
    await new Promise((r) => setTimeout(r, 300));
    const vehicles = loadDemoVehicles();
    const now = new Date().toISOString();
    const vehicle = {
      id: `local-${Date.now()}`,
      status: 'available',
      driver: 'Unassigned',
      mileage: 0,
      location_id: '',
      latitude: null,
      longitude: null,
      maintenance_notes: null,
      registration_date: null,
      active: true,
      last_updated: now,
      ...input,
    } as Vehicle;
    vehicles.unshift(vehicle);
    saveDemoVehicles(vehicles);
    return vehicle;
  }
  // The server derives `driver` from the assigned-driver reference and owns id/timestamps.
  const payload: Record<string, unknown> = { ...input };
  delete payload.driver;
  delete payload.id;
  delete payload.last_updated;
  const res = await apiRequest<{ vehicle: Vehicle }>('/api/vehicles', {
    method: 'POST',
    body: payload,
  });
  return res.vehicle;
}

export async function fetchVehicleEvents(id: string): Promise<VehicleEvent[]> {
  if (!isApiConfigured) return [];
  const res = await apiRequest<{ data: VehicleEvent[] }>(`/api/vehicles/${id}/events`);
  return res.data;
}

export async function addVehicleEvent(
  id: string,
  input: { category: VehicleEventCategory; title: string; notes?: string; event_date: string },
): Promise<VehicleEvent> {
  const res = await apiRequest<{ event: VehicleEvent }>(`/api/vehicles/${id}/events`, {
    method: 'POST',
    body: input,
  });
  return res.event;
}

export async function deleteVehicleEvent(id: string, eventId: string): Promise<void> {
  await apiRequest<void>(`/api/vehicles/${id}/events/${eventId}`, { method: 'DELETE' });
}

export async function fetchVehicleQr(id: string): Promise<{ payload: string; qrCodeDataUrl: string }> {
  return apiRequest<{ payload: string; qrCodeDataUrl: string }>(`/api/vehicles/${id}/qr`);
}

export async function fetchVehicles(): Promise<Vehicle[]> {
  if (!isApiConfigured) {
    // Simulate network latency so loading states are visible in demo mode.
    await new Promise((r) => setTimeout(r, 400));
    return loadDemoVehicles().sort(
      (a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime(),
    );
  }

  const res = await apiRequest<{ data: Vehicle[] }>('/api/vehicles?limit=200');
  return res.data;
}

export async function fetchVehicleById(id: string): Promise<Vehicle | null> {
  if (!isApiConfigured) {
    await new Promise((r) => setTimeout(r, 250));
    return loadDemoVehicles().find((v) => v.id === id) ?? null;
  }

  try {
    const res = await apiRequest<{ vehicle: Vehicle }>(`/api/vehicles/${id}`);
    return res.vehicle;
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 404) return null;
    throw e;
  }
}

export async function updateVehicle(id: string, changes: VehicleUpdate): Promise<Vehicle> {
  if (!isApiConfigured) {
    await new Promise((r) => setTimeout(r, 300));
    const vehicles = loadDemoVehicles();
    const index = vehicles.findIndex((v) => v.id === id);
    if (index === -1) throw new Error('Vehicle not found');
    vehicles[index] = { ...vehicles[index], ...changes, last_updated: new Date().toISOString() };
    saveDemoVehicles(vehicles);
    return vehicles[index];
  }

  // The API derives the display name from the assigned driver reference.
  const payload = { ...changes };
  delete payload.driver;
  const res = await apiRequest<{ vehicle: Vehicle }>(`/api/vehicles/${id}`, {
    method: 'PATCH',
    body: payload,
  });
  return res.vehicle;
}

/**
 * QR onboarding: look up a vehicle by its QR code identifier and activate it
 * in the fleet. Returns the activated vehicle, or null when no vehicle
 * matches the scanned code.
 */
export async function onboardVehicleByQrCode(qrCodeId: string): Promise<Vehicle | null> {
  const code = qrCodeId.trim();
  if (!code) return null;

  if (!isApiConfigured) {
    await new Promise((r) => setTimeout(r, 500));
    const vehicles = loadDemoVehicles();
    const index = vehicles.findIndex(
      (v) => v.qr_code_id.toLowerCase() === code.toLowerCase(),
    );
    if (index === -1) return null;
    vehicles[index] = {
      ...vehicles[index],
      active: true,
      status: vehicles[index].status === 'offline' ? 'available' : vehicles[index].status,
      last_updated: new Date().toISOString(),
    };
    saveDemoVehicles(vehicles);
    return vehicles[index];
  }

  try {
    const res = await apiRequest<{ vehicle: Vehicle }>('/api/vehicles/onboard', {
      method: 'POST',
      body: { qr_code_id: code },
    });
    return res.vehicle;
  } catch (e) {
    if (e instanceof ApiRequestError && e.status === 404) return null;
    throw e;
  }
}

/** Status/mileage change timeline. Only available in API mode. */
export async function fetchVehicleHistory(id: string): Promise<VehicleHistoryEntry[]> {
  if (!isApiConfigured) return [];
  const res = await apiRequest<{ data: VehicleHistoryEntry[] }>(`/api/vehicles/${id}/history`);
  return res.data;
}

/**
 * Subscribe to vehicle changes. In API mode this polls every 15 seconds and
 * refetches when the tab regains focus. Returns an unsubscribe function.
 */
export function subscribeToVehicles(onChange: () => void): () => void {
  if (!isApiConfigured) return () => {};

  const interval = setInterval(onChange, POLL_INTERVAL_MS);
  const onVisible = () => {
    if (document.visibilityState === 'visible') onChange();
  };
  document.addEventListener('visibilitychange', onVisible);

  return () => {
    clearInterval(interval);
    document.removeEventListener('visibilitychange', onVisible);
  };
}
