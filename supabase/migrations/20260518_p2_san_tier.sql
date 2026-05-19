-- Migration: P2 Sàn/Agency Tier
-- Run in Supabase SQL Editor

-- 1. Add admin_user_id to agencies (links agency to its creator/admin)
ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS admin_user_id uuid references auth.users(id) on delete set null,
  ADD COLUMN IF NOT EXISTS agency_subscription_id text,
  ADD COLUMN IF NOT EXISTS agency_subscription_status text,
  ADD COLUMN IF NOT EXISTS agency_subscription_tier text;  -- 'basic' | 'pro'

CREATE INDEX IF NOT EXISTS idx_agencies_admin_user ON agencies(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_agencies_subscription_id ON agencies(agency_subscription_id) WHERE agency_subscription_id IS NOT NULL;

-- 2. RLS on agencies
ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

-- Public can read verified agencies
CREATE POLICY "agencies_select_public" ON agencies
  FOR SELECT USING (verified = true);

-- Agency admin can read their own (even unverified)
CREATE POLICY "agencies_select_own" ON agencies
  FOR SELECT USING (admin_user_id = auth.uid());

-- Agency admin can update their own
CREATE POLICY "agencies_update_own" ON agencies
  FOR UPDATE USING (admin_user_id = auth.uid());

-- Service role bypass (admin dashboard uses service client)

-- 3. Allow agency admin to view agents in their agency
-- (agents table already has RLS — this adds a policy for agency admin to see their agents)
CREATE POLICY "agents_select_by_agency_admin" ON agents
  FOR SELECT USING (
    agency_id IN (SELECT id FROM agencies WHERE admin_user_id = auth.uid())
  );
