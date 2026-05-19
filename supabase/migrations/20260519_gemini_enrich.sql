-- ============================================================
-- Migration: Gemini Flash enrichment pipeline
-- Applied: 2026-05-19 via Supabase MCP apply_migration
-- ============================================================

-- 1. Extend data_quality_level enum: add 'estimated' BEFORE 'ai_filled'
ALTER TYPE data_quality_level ADD VALUE IF NOT EXISTS 'estimated' BEFORE 'ai_filled';

-- 2. New enum for queue status
DO $$ BEGIN
  CREATE TYPE enrichment_status_enum AS ENUM ('pending', 'processing', 'enriched', 'failed', 'skipped');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 3. Add enrichment queue columns to projects
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS enrichment_status enrichment_status_enum NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS enrichment_attempts smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS enrichment_last_error text,
  ADD COLUMN IF NOT EXISTS enrichment_queued_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS enrichment_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS enrichment_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS enrichment_priority smallint NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS enrichment_provider text;

UPDATE projects SET enrichment_priority = CASE
  WHEN province IN ('Hà Nội', 'TP. Hồ Chí Minh') THEN 10
  WHEN published = true THEN 5
  ELSE 0
END WHERE enrichment_priority = 0;

CREATE INDEX IF NOT EXISTS idx_projects_enrich_queue
  ON projects (enrichment_priority DESC, enrichment_queued_at ASC)
  WHERE enrichment_status = 'pending';

CREATE INDEX IF NOT EXISTS idx_projects_enrich_status
  ON projects (enrichment_status);

-- 4. Stuck-job reaper
CREATE OR REPLACE FUNCTION reap_stuck_enrichments()
RETURNS int LANGUAGE plpgsql AS $$
DECLARE reaped int;
BEGIN
  WITH reaped_rows AS (
    UPDATE projects
    SET enrichment_status = 'pending',
        enrichment_started_at = NULL,
        enrichment_last_error = COALESCE(enrichment_last_error, '') || ' [reaped: stuck > 10min]'
    WHERE enrichment_status = 'processing'
      AND enrichment_started_at < now() - interval '10 minutes'
    RETURNING id
  )
  SELECT count(*) INTO reaped FROM reaped_rows;
  RETURN reaped;
END $$;

-- 5. Atomic claim function with SKIP LOCKED
-- NOTE: lat/lng are numeric(10,7) in projects, NOT double precision.
DROP FUNCTION IF EXISTS claim_enrichment_batch(int);
CREATE OR REPLACE FUNCTION claim_enrichment_batch(p_batch_size int DEFAULT 5)
RETURNS TABLE (
  id uuid,
  name_official text,
  province text,
  district text,
  ward text,
  lat numeric,
  lng numeric,
  property_type text,
  tier text,
  status text
) LANGUAGE plpgsql AS $$
BEGIN
  PERFORM reap_stuck_enrichments();

  RETURN QUERY
  WITH claimed AS (
    SELECT p.id
    FROM projects p
    WHERE p.enrichment_status = 'pending'
      AND p.enrichment_attempts < 3
    ORDER BY p.enrichment_priority DESC, p.enrichment_queued_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  )
  UPDATE projects p
  SET enrichment_status = 'processing',
      enrichment_started_at = now(),
      enrichment_attempts = p.enrichment_attempts + 1
  FROM claimed
  WHERE p.id = claimed.id
  RETURNING
    p.id,
    p.name_official,
    p.province,
    p.district,
    p.ward,
    p.lat,
    p.lng,
    p.property_type::text,
    p.tier::text,
    p.status::text;
END $$;

-- 6. Stats view
CREATE OR REPLACE VIEW enrichment_stats AS
SELECT
  enrichment_status,
  count(*) AS rows,
  count(*) FILTER (WHERE enrichment_attempts >= 3) AS exhausted_attempts,
  min(enrichment_queued_at) AS oldest,
  max(enrichment_completed_at) AS latest_completed
FROM projects
GROUP BY enrichment_status;
