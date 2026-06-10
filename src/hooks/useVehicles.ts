import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchVehicles, subscribeToVehicles } from '../api/vehicles';
import type { Vehicle } from '../types/vehicle';

interface UseVehiclesResult {
  vehicles: Vehicle[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useVehicles(): UseVehiclesResult {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mounted = useRef(true);

  const load = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setLoading(true);
    try {
      const data = await fetchVehicles();
      if (!mounted.current) return;
      setVehicles(data);
      setError(null);
    } catch (e) {
      if (!mounted.current) return;
      setError(e instanceof Error ? e.message : 'Failed to load vehicles');
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    load(true);
    const unsubscribe = subscribeToVehicles(() => load(false));
    return () => {
      mounted.current = false;
      unsubscribe();
    };
  }, [load]);

  const refresh = useCallback(() => load(false), [load]);

  return { vehicles, loading, error, refresh };
}
