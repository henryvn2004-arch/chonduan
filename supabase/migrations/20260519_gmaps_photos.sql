-- ============================================================
-- Migration: Google Places Photos backfill pipeline
-- Goal: backfill ~10k projects với ảnh thật từ Google Places
--       trong 2 tháng, tận dụng $200 free credit/tháng.
-- Cost: ~$240 chia 2 tháng = $120/tháng (Find Place $17/1k + Photo $7/1k)
-- ============================================================

-- 1. Queue status enum
DO $$ BEGIN
  CREATE TYPE gmaps_photos_status_enum AS ENUM (
    'pending', 'processing', 'done', 'not_found', 'failed', 'skipped'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Add photo backfill columns to projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS gmaps_place_id text,
  ADD COLUMN IF NOT EXISTS gmaps_photo_url text,
  ADD COLUMN IF NOT EXISTS gmaps_photo_attribution text,
  ADD COLUMN IF NOT EXISTS gmaps_photos_status gmaps_photos_status_enum NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS gmaps_photos_attempts smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gmaps_photos_last_error text,
  ADD COLUMN IF NOT EXISTS gmaps_photos_queued_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS gmaps_photos_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS gmaps_photos_fetched_at timestamptz,
  ADD COLUMN IF NOT EXISTS gmaps_photos_priority smallint NOT NULL DEFAULT 0;

-- Skip projects without lat/lng or name
UPDATE projects
SET gmaps_photos_status = 'skipped'
WHERE (lat IS NULL OR lng IS NULL OR name_official IS NULL OR length(trim(name_official)) = 0)
  AND gmaps_photos_status = 'pending';

-- Priority ordering:
--   30 = published + HCM/HN (highest)
--   20 = published + other province
--   10 = unpublished + HCM/HN
--    0 = rest
UPDATE projects SET gmaps_photos_priority = CASE
  WHEN published = true AND province IN ('Hà Nội', 'TP. Hồ Chí Minh') THEN 30
  WHEN published = true THEN 20
  WHEN province IN ('Hà Nội', 'TP. Hồ Chí Minh') THEN 10
  ELSE 0
END
WHERE gmaps_photos_priority = 0 AND gmaps_photos_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_projects_gmaps_photos_queue
  ON projects (gmaps_photos_priority DESC, gmaps_photos_queued_at ASC)
  WHERE gmaps_photos_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_projects_gmaps_photos_status
  ON projects (gmaps_photos_status);

-- 3. Daily cost guard table
CREATE TABLE IF NOT EXISTS gmaps_api_usage_daily (
  day date PRIMARY KEY,
  find_place_calls int NOT NULL DEFAULT 0,
  photo_calls int NOT NULL DEFAULT 0,
  estimated_cost_usd numeric(10, 4) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION track_gmaps_usage(
  p_find_place int DEFAULT 0,
  p_photo int DEFAULT 0
) RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO gmaps_api_usage_daily (day, find_place_calls, photo_calls, estimated_cost_usd)
  VALUES (
    current_date,
    p_find_place,
    p_photo,
    (p_find_place * 0.017) + (p_photo * 0.007)
  )
  ON CONFLICT (day) DO UPDATE SET
    find_place_calls = gmaps_api_usage_daily.find_place_calls + EXCLUDED.find_place_calls,
    photo_calls = gmaps_api_usage_daily.photo_calls + EXCLUDED.photo_calls,
    estimated_cost_usd = gmaps_api_usage_daily.estimated_cost_usd + EXCLUDED.estimated_cost_usd,
    updated_at = now();
END $$;

-- Check current month spend (USD)
CREATE OR REPLACE FUNCTION gmaps_month_spend_usd()
RETURNS numeric LANGUAGE sql STABLE AS $$
  SELECT COALESCE(SUM(estimated_cost_usd), 0)
  FROM gmaps_api_usage_daily
  WHERE day >= date_trunc('month', current_date);
$$;

-- 4. Stuck-job reaper
CREATE OR REPLACE FUNCTION reap_stuck_gmaps_photos()
RETURNS int LANGUAGE plpgsql AS $$
DECLARE reaped int;
BEGIN
  WITH reaped_rows AS (
    UPDATE projects
    SET gmaps_photos_status = 'pending',
        gmaps_photos_started_at = NULL,
        gmaps_photos_last_error = COALESCE(gmaps_photos_last_error, '') || ' [reaped: stuck > 10min]'
    WHERE gmaps_photos_status = 'processing'
      AND gmaps_photos_started_at < now() - interval '10 minutes'
    RETURNING id
  )
  SELECT count(*) INTO reaped FROM reaped_rows;
  RETURN reaped;
END $$;

-- 5. Atomic claim function — SKIP LOCKED
DROP FUNCTION IF EXISTS claim_gmaps_photos_batch(int);
CREATE OR REPLACE FUNCTION claim_gmaps_photos_batch(p_batch_size int DEFAULT 7)
RETURNS TABLE (
  id uuid,
  name_official text,
  province text,
  district text,
  address_full text,
  lat numeric,
  lng numeric,
  gmaps_place_id text
) LANGUAGE plpgsql AS $$
BEGIN
  PERFORM reap_stuck_gmaps_photos();

  RETURN QUERY
  WITH claimed AS (
    SELECT p.id
    FROM projects p
    WHERE p.gmaps_photos_status = 'pending'
      AND p.gmaps_photos_attempts < 3
      AND p.lat IS NOT NULL
      AND p.lng IS NOT NULL
      AND p.name_official IS NOT NULL
    ORDER BY p.gmaps_photos_priority DESC, p.gmaps_photos_queued_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  UPDATE projects p
  SET gmaps_photos_status = 'processing',
      gmaps_photos_started_at = now(),
      gmaps_photos_attempts = p.gmaps_photos_attempts + 1
  FROM claimed
  WHERE p.id = claimed.id
  RETURNING
    p.id,
    p.name_official,
    p.province,
    p.district,
    p.address_full,
    p.lat,
    p.lng,
    p.gmaps_place_id;
END $$;

-- 6. Storage bucket for project photos (public read)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-photos',
  'project-photos',
  true,
  5242880, -- 5MB cap per photo
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public read policy (bucket already public, but explicit policy for safety)
DO $$ BEGIN
  CREATE POLICY "public read project-photos"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'project-photos');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Service role can write (default behavior, no policy needed for service_role)
