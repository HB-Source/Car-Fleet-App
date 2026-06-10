-- FleetPilot — Supabase schema
-- Run this in the Supabase SQL editor (or via `supabase db push`).

create extension if not exists "pgcrypto";

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  vehicle_name text not null,
  plate_number text not null unique,
  status text not null default 'available'
    check (status in ('available', 'in_use', 'maintenance', 'offline')),
  driver text not null default 'Unassigned',
  mileage integer not null default 0,
  location_id text not null default '',
  latitude double precision,
  longitude double precision,
  qr_code_id text not null unique,
  maintenance_notes text,
  registration_date date,
  active boolean not null default true,
  last_updated timestamptz not null default now()
);

create index if not exists vehicles_status_idx on public.vehicles (status);
create index if not exists vehicles_qr_code_idx on public.vehicles (qr_code_id);
create index if not exists vehicles_last_updated_idx on public.vehicles (last_updated desc);

-- Row Level Security.
-- NOTE: these policies allow anonymous read/write so the demo app works with
-- only the anon key. For production, restrict to authenticated users and
-- wire up Supabase Auth in the app.
alter table public.vehicles enable row level security;

drop policy if exists "Allow public read access" on public.vehicles;
create policy "Allow public read access"
  on public.vehicles for select
  using (true);

drop policy if exists "Allow public update access" on public.vehicles;
create policy "Allow public update access"
  on public.vehicles for update
  using (true)
  with check (true);

drop policy if exists "Allow public insert access" on public.vehicles;
create policy "Allow public insert access"
  on public.vehicles for insert
  with check (true);

-- Enable realtime change broadcasts for the vehicles table.
do $$
begin
  alter publication supabase_realtime add table public.vehicles;
exception
  when duplicate_object then null;
end $$;
