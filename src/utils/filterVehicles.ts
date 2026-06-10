import type { Vehicle, VehicleStatus } from '../types/vehicle';

export type StatusFilter = VehicleStatus | 'all';
export type SortOrder = 'latest' | 'name' | 'mileage';

export function filterVehicles(
  vehicles: Vehicle[],
  search: string,
  status: StatusFilter,
  sort: SortOrder = 'latest',
): Vehicle[] {
  const query = search.trim().toLowerCase();

  const filtered = vehicles.filter((v) => {
    if (status !== 'all' && v.status !== status) return false;
    if (!query) return true;
    return (
      v.vehicle_name.toLowerCase().includes(query) ||
      v.plate_number.toLowerCase().includes(query) ||
      v.driver.toLowerCase().includes(query) ||
      v.location_id.toLowerCase().includes(query)
    );
  });

  return filtered.sort((a, b) => {
    switch (sort) {
      case 'name':
        return a.vehicle_name.localeCompare(b.vehicle_name);
      case 'mileage':
        return b.mileage - a.mileage;
      case 'latest':
      default:
        return new Date(b.last_updated).getTime() - new Date(a.last_updated).getTime();
    }
  });
}
