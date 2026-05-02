-- ============================================================
-- Gari — Supabase Database Setup
-- Run this in your Supabase SQL Editor (project → SQL Editor)
-- ============================================================

-- 1. Vehicles table
CREATE TABLE IF NOT EXISTS public.vehicles (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vin           text,
  make          text NOT NULL,
  model         text NOT NULL,
  year          text NOT NULL,
  trim          text,
  engine        text,
  fuel_type     text,
  body_style    text,
  mileage       integer DEFAULT 0,
  license_plate text,
  created_at    timestamptz DEFAULT now()
);

-- Row-level security: each user can only see/edit their own vehicles
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own vehicles"
  ON public.vehicles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicles"
  ON public.vehicles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles"
  ON public.vehicles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles"
  ON public.vehicles FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Documents table
CREATE TABLE IF NOT EXISTS public.documents (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vehicle_id    uuid NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  document_type text NOT NULL,  -- insurance | ownership | registration | tint_exemption | drivers_license | vehicle_handbook
  file_url      text NOT NULL,  -- path in Supabase Storage bucket "documents"
  file_name     text,
  uploaded_at   timestamptz DEFAULT now(),
  UNIQUE (user_id, vehicle_id, document_type)
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents"
  ON public.documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own documents"
  ON public.documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own documents"
  ON public.documents FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents"
  ON public.documents FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 3. Storage bucket
-- Do this in Supabase Dashboard → Storage → New bucket:
--   Name: documents
--   Public: OFF (private)
--
-- Then add this storage policy (Storage → Policies):
-- ============================================================

-- Storage RLS policies (run these too)
CREATE POLICY "Authenticated users can upload their own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can read their own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'documents' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
