-- Run this in your Supabase SQL Editor to create the diagnostics table.
-- Navigate to: Supabase Dashboard → SQL Editor → New Query → paste and run.

create table if not exists public.diagnostics (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  vehicle_id    uuid not null,
  type          text not null default 'issue',
  title         text not null,
  description   text,
  severity      text not null default 'medium',
  status        text not null default 'ongoing',
  date_noticed  date,
  date_resolved date,
  created_at    timestamptz not null default now()
);

-- Index for fast per-vehicle lookups
create index if not exists diagnostics_vehicle_id_idx on public.diagnostics(vehicle_id);

-- Row-level security: users can only see and modify their own diagnostics
alter table public.diagnostics enable row level security;

create policy "Users can view own diagnostics"
  on public.diagnostics for select
  using (auth.uid() = user_id);

create policy "Users can insert own diagnostics"
  on public.diagnostics for insert
  with check (auth.uid() = user_id);

create policy "Users can update own diagnostics"
  on public.diagnostics for update
  using (auth.uid() = user_id);

create policy "Users can delete own diagnostics"
  on public.diagnostics for delete
  using (auth.uid() = user_id);
