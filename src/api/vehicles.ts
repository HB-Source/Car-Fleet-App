import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { loadDemoVehicles, saveDemoVehicles } from '../lib/demoData';
import type { Vehicle, VehicleUpdate } from '../types/vehicle';

const TABLE = 'vehicles';

export async function fetchVehicles(): Promise<Vehicle[]> {
  if (!isSupabaseConfigured || !supabase) {
    // Simulate network latency so loading states are visible in demo mode.
    await new Promise((r) => setTimeout(r, 400));
    return loadDemoVehicles().sort(
      (a, b) => new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime(),
    );
  }

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .order('last_updated', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as Vehicle[];
}

export async function fetchVehicleById(id: string): Promise<Vehicle | null> {
  if (!isSupabaseConfigured || !supabase) {
    await new Promise((r) => setTimeout(r, 250));
    return loadDemoVehicles().find((v) => v.id === id) ?? null;
  }

  const { data, error } = await supabase.from(TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Vehicle | null;
}

export async function updateVehicle(id: string, changes: VehicleUpdate): Promise<Vehicle> {
  const patch = { ...changes, last_updated: new Date().toISOString() };

  if (!isSupabaseConfigured || !supabase) {
    await new Promise((r) => setTimeout(r, 300));
    const vehicles = loadDemoVehicles();
    const index = vehicles.findIndex((v) => v.id === id);
    if (index === -1) throw new Error('Vehicle not found');
    vehicles[index] = { ...vehicles[index], ...patch };
    saveDemoVehicles(vehicles);
    return vehicles[index];
  }

  const { data, error } = await supabase
    .from(TABLE)
    .update(patch)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Vehicle;
}

/**
 * QR onboarding: look up a vehicle by its QR code identifier and activate it
 * in the fleet. Returns the activated vehicle, or null when no vehicle
 * matches the scanned code.
 */
export async function onboardVehicleByQrCode(qrCodeId: string): Promise<Vehicle | null> {
  const code = qrCodeId.trim();
  if (!code) return null;

  if (!isSupabaseConfigured || !supabase) {
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

  const { data, error } = await supabase
    .from(TABLE)
    .select('*')
    .ilike('qr_code_id', code)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const vehicle = data as Vehicle;
  const { data: updated, error: updateError } = await supabase
    .from(TABLE)
    .update({
      active: true,
      status: vehicle.status === 'offline' ? 'available' : vehicle.status,
      last_updated: new Date().toISOString(),
    })
    .eq('id', vehicle.id)
    .select()
    .single();

  if (updateError) throw new Error(updateError.message);
  return updated as Vehicle;
}

/**
 * Subscribe to realtime changes on the vehicles table. Returns an
 * unsubscribe function. No-op in demo mode.
 */
export function subscribeToVehicles(onChange: () => void): () => void {
  if (!isSupabaseConfigured || !supabase) return () => {};

  const channel = supabase
    .channel('vehicles-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: TABLE }, onChange)
    .subscribe();

  return () => {
    supabase?.removeChannel(channel);
  };
}
