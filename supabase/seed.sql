-- FleetPilot — sample seed data
-- Run after schema.sql in the Supabase SQL editor.

insert into public.vehicles
  (vehicle_name, plate_number, status, driver, mileage, location_id, latitude, longitude, qr_code_id, maintenance_notes, registration_date, active, last_updated)
values
  ('Ford Transit', 'AB-123-CD', 'available', 'Unassigned', 45200, 'ams-central', 52.3676, 4.9041, 'QR-VEHICLE-001', 'Oil change completed at 45,000 km.', '2022-03-15', true, now() - interval '12 minutes'),
  ('Mercedes Sprinter', 'XK-456-LM', 'in_use', 'Eva Janssen', 81930, 'ams-noord', 52.4009, 4.9145, 'QR-VEHICLE-002', null, '2021-07-02', true, now() - interval '3 minutes'),
  ('VW ID. Buzz Cargo', 'EV-789-NL', 'in_use', 'Tom de Vries', 12480, 'ams-zuid', 52.3402, 4.8731, 'QR-VEHICLE-003', null, '2024-01-20', true, now() - interval '1 minute'),
  ('Renault Kangoo', 'RK-321-ZE', 'maintenance', 'Unassigned', 102750, 'haarlem-depot', 52.3874, 4.6462, 'QR-VEHICLE-004', 'Brake pads replacement scheduled. Vehicle at Haarlem depot.', '2019-11-08', true, now() - interval '95 minutes'),
  ('Toyota Proace', 'TP-654-GH', 'available', 'Sanne Bakker', 58320, 'utrecht-hub', 52.0907, 5.1214, 'QR-VEHICLE-005', null, '2022-09-30', true, now() - interval '34 minutes'),
  ('Opel Vivaro', 'OV-987-QR', 'offline', 'Unassigned', 134220, 'rotterdam-port', 51.9244, 4.4777, 'QR-VEHICLE-006', 'Telematics unit not reporting since last week.', '2018-05-17', false, now() - interval '2 days')
on conflict (plate_number) do nothing;
