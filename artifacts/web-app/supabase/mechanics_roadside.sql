-- ── Mechanics table ──────────────────────────────────────────────────────────
create table if not exists mechanics (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  vehicle_id  uuid not null references vehicles(id) on delete cascade,
  name        text not null,
  shop_name   text,
  phone       text,
  address     text,
  hours       text,
  notes       text,
  created_at  timestamptz default now()
);

alter table mechanics enable row level security;

create policy "Users can read own mechanics"
  on mechanics for select
  using (auth.uid() = user_id);

create policy "Users can insert own mechanics"
  on mechanics for insert
  with check (auth.uid() = user_id);

create policy "Users can update own mechanics"
  on mechanics for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own mechanics"
  on mechanics for delete
  using (auth.uid() = user_id);

-- ── Roadside Assistance table ─────────────────────────────────────────────────
create table if not exists roadside_assistance (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  provider_name   text not null,
  member_number   text,
  phone           text,
  coverage_notes  text,
  created_at      timestamptz default now()
);

alter table roadside_assistance enable row level security;

create policy "Users can read own roadside"
  on roadside_assistance for select
  using (auth.uid() = user_id);

create policy "Users can insert own roadside"
  on roadside_assistance for insert
  with check (auth.uid() = user_id);

create policy "Users can update own roadside"
  on roadside_assistance for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own roadside"
  on roadside_assistance for delete
  using (auth.uid() = user_id);
