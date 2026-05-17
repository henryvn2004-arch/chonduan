-- Migration: P2 Monetize — Lead refund + Agent subscription fields
-- Run in Supabase SQL Editor

-- 1. Extend lead_status enum
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'refunded';
ALTER TYPE lead_status ADD VALUE IF NOT EXISTS 'flagged';

-- 2. Add lead refund + charge tracking columns
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS credits_charged int4 default 0,
  ADD COLUMN IF NOT EXISTS refund_reason text;

-- 3. Update existing leads with charge_amount_vnd → credits_charged (1 credit = 1000 VND)
-- (only run if migrating existing data)
UPDATE leads SET credits_charged = COALESCE(charge_amount_vnd / 1000, 0) WHERE credits_charged IS NULL;

-- 4. Agent subscription columns for PayPal recurring billing
ALTER TABLE agents
  ADD COLUMN IF NOT EXISTS subscription_id text,        -- PayPal subscription ID
  ADD COLUMN IF NOT EXISTS subscription_status text,    -- ACTIVE | CANCELLED | SUSPENDED | APPROVAL_PENDING
  ADD COLUMN IF NOT EXISTS subscription_plan text,      -- 'verified_badge' | future plans
  ADD COLUMN IF NOT EXISTS subscription_price_usd numeric(10,2);

-- Note: verified_badge_active and verified_badge_expires_at already exist in schema
-- subscription_id index for webhook lookups
CREATE INDEX IF NOT EXISTS idx_agents_subscription_id ON agents(subscription_id) WHERE subscription_id IS NOT NULL;

-- 5. Ensure leads.credits_charged is indexed for refund queries
CREATE INDEX IF NOT EXISTS idx_leads_agent_status ON leads(agent_id, status, created_at DESC);
