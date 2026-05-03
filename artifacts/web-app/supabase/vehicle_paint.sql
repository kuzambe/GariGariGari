-- Add paint name + paint code to vehicles
alter table vehicles add column if not exists paint_name text;
alter table vehicles add column if not exists paint_code text;
