-- =====================================================================
-- NHÀ BẢN ĐỒ — Supabase Schema v1.0
-- Run on a fresh Supabase project. Order matters.
-- =====================================================================

-- Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "vector";
create extension if not exists "pg_trgm";  -- fuzzy text search

-- =====================================================================
-- ENUMS
-- =====================================================================

create type property_type as enum (
  'chung_cu', 'biet_thu', 'lien_ke', 'shophouse',
  'dat_nen', 'officetel', 'condotel'
);

create type project_tier as enum (
  'binh_dan', 'trung_cap', 'cao_cap', 'hang_sang'
);

create type project_status as enum (
  'sap_mo_ban', 'dang_mo_ban', 'dang_xay',
  'da_ban_giao', 'da_ban_giao_lau'
);

create type land_origin_type as enum (
  'dat_o', 'dat_thuong_mai', 'dat_chuyen_doi', 'khac'
);

create type red_book_status as enum (
  'da_cap', 'chua_cap', 'dang_lam', 'vuong_mac'
);

create type ownership_term as enum (
  'lau_dai', 'nam_50', 'nam_70', 'khac'
);

create type price_trend as enum ('up', 'down', 'flat');

-- =====================================================================
-- RENTAL ENUMS
-- =====================================================================

create type transaction_type as enum ('sale', 'rent_long', 'rent_short');

create type furniture_status as enum ('full', 'partial', 'unfurnished');

create type lease_term as enum (
  'flexible', 'short_3m', 'medium_6m', 'long_12m_plus'
);

create type bedroom_count as enum (
  'studio', '1br', '2br', '3br', '4br_plus', 'penthouse'
);

create type bid_slot_type as enum ('sale', 'rent_long', 'rent_short');

create type agent_specialty_type as enum ('sale', 'rent_long', 'rent_short');

create type direction as enum (
  'dong', 'tay', 'nam', 'bac',
  'dong_bac', 'dong_nam', 'tay_bac', 'tay_nam'
);

create type data_quality_level as enum (
  'auto', 'ai_filled', 'verified', 'gold'
);

create type kyc_status as enum (
  'pending', 'approved', 'rejected', 'suspended'
);

create type agent_tier as enum (
  'unverified', 'verified', 'pro_verified', 'elite'
);

create type subscription_tier as enum (
  'free', 'basic', 'pro', 'top', 'agency', 'developer'
);

create type bid_status as enum (
  'active', 'expired', 'cancelled', 'lost'
);

create type lead_status as enum (
  'new', 'contacted', 'qualified', 'converted', 'lost', 'fraud'
);

create type payment_method as enum ('paypal', 'payos');

create type payment_status as enum (
  'pending', 'completed', 'failed', 'refunded'
);

-- =====================================================================
-- CORE TABLES — Developers (CĐT)
-- =====================================================================

create table developers (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  short_name text,
  logo_url text,
  website text,
  description text,
  founded_year int2,
  hq_address text,
  total_projects_count int4 default 0,
  ranking_tier project_tier,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_developers_slug on developers(slug);
create index idx_developers_name_trgm on developers using gin (name gin_trgm_ops);

-- =====================================================================
-- CORE TABLES — Projects (master)
-- =====================================================================

create table projects (
  id uuid primary key default uuid_generate_v4(),

  -- Nhóm 1: Core ID
  slug text unique not null,
  name_official text not null,
  name_aliases text[] default '{}',
  province text not null,
  district text,
  ward text,
  address_full text,
  lat numeric(10,7),
  lng numeric(10,7),
  google_place_id text,
  data_quality data_quality_level default 'auto',

  -- Nhóm 2: Developer
  developer_id uuid references developers(id),
  co_developers uuid[] default '{}',
  operator_bql text,
  designer text,
  contractor text,

  -- Nhóm 3: Project basics
  property_type property_type not null,
  tier project_tier,
  status project_status,
  year_start int2,
  year_handover int2,
  total_land_ha numeric(8,2),
  building_density_pct numeric(5,2),
  green_density_pct numeric(5,2),
  total_towers int2,
  total_units int4,
  total_investment_billion numeric(12,2),
  description_short text,
  description_long text,

  -- Nhóm 4: Pricing — Sale (current snapshot — history in separate table)
  price_primary_per_m2_min int4,
  price_primary_per_m2_max int4,
  price_secondary_per_m2_avg int4,
  price_trend price_trend,
  price_trend_pct_6m numeric(5,2),
  rent_per_m2_avg int4,
  rental_yield_pct numeric(5,2),

  -- Nhóm 4b: Rental Market (long-term + short-term)
  rent_studio_avg_monthly_vnd int4,
  rent_1br_avg_monthly_vnd int4,
  rent_2br_avg_monthly_vnd int4,
  rent_3br_avg_monthly_vnd int4,
  rent_4br_plus_avg_monthly_vnd int4,
  rent_penthouse_avg_monthly_vnd int4,
  rent_furnished_premium_pct numeric(5,2),  -- e.g. 25 = furnished costs 25% more
  rent_listings_active_count int4 default 0,
  rent_demand_score int2 check (rent_demand_score between 1 and 10),
  rent_trend price_trend,
  rent_avg_lease_term_months int2,
  -- Short-term (Airbnb-style) — Phase 2
  short_term_avg_per_night_vnd int4,
  short_term_occupancy_pct numeric(5,2),
  short_term_listings_count int4 default 0,
  -- Expat segment
  is_expat_friendly boolean default false,
  expat_concentration_score int2 check (expat_concentration_score between 0 and 10),
  english_signage boolean default false,
  has_western_management boolean default false,

  -- Nhóm 5: Pháp lý
  land_origin_type land_origin_type,
  red_book_status red_book_status,
  ownership_term ownership_term,
  construction_permit_no text,
  investment_approval_no text,
  legal_issues_text text,
  legal_score int2 check (legal_score between 1 and 10),
  legal_last_verified date,

  -- Nhóm 6: Tiện ích nội khu
  has_pool boolean default false,
  pool_type text,  -- indoor/outdoor/both
  has_gym boolean default false,
  has_tennis_court boolean default false,
  has_basketball_court boolean default false,
  has_kid_playground boolean default false,
  has_kindergarten boolean default false,
  has_school_primary boolean default false,
  has_school_secondary boolean default false,
  has_school_international boolean default false,
  has_mall_internal boolean default false,
  has_supermarket_internal boolean default false,
  has_cafe_restaurant boolean default false,
  has_bbq_area boolean default false,
  has_clubhouse boolean default false,
  has_library boolean default false,
  has_park_garden boolean default false,
  has_24h_security boolean default true,
  has_smart_home boolean default false,
  has_ev_charging boolean default false,

  -- Nhóm 7: Surrounding (cached from Google Places)
  nearest_metro_m int4,
  nearest_metro_name text,
  nearest_public_school_m int4,
  nearest_international_school_m int4,
  nearest_hospital_m int4,
  nearest_mall_m int4,
  nearest_supermarket_m int4,
  distance_to_cbd_km numeric(6,2),
  distance_to_airport_km numeric(6,2),

  -- Nhóm 8: Ban quản lý
  service_fee_per_m2_vnd int4,
  parking_motorbike_monthly int4,
  parking_car_monthly int4,
  water_fee_unit int4,
  bql_name text,
  bql_rating numeric(3,2) check (bql_rating between 0 and 5),

  -- Nhóm 9: Demographic (Phase 2 — nullable)
  occupation_rate_pct numeric(5,2),
  resident_vs_investor_ratio numeric(5,2),
  expat_pct numeric(5,2),
  avg_age_bracket text,  -- '20-29' / '30-39' / '40-49' / '50+'
  income_bracket text,   -- mid/high/premium/luxury
  demographic_notes text,

  -- Nhóm 10: Risk
  flood_risk_level int2 check (flood_risk_level between 0 and 3),
  tide_risk_level int2 check (tide_risk_level between 0 and 3),
  air_pollution_score int2 check (air_pollution_score between 0 and 100),
  noise_level text,  -- quiet/moderate/noisy
  drama_history jsonb default '[]',

  -- Nhóm 11: Triển vọng
  upcoming_infrastructure jsonb default '[]',
  competing_projects_nearby uuid[] default '{}',
  investment_score int2 check (investment_score between 1 and 10),
  outlook_text text,

  -- Nhóm 12: Media
  logo_url text,
  banner_url text,
  gallery_urls text[] default '{}',
  video_tour_url text,
  panorama_360_url text,
  floor_plan_url text,
  master_plan_url text,

  -- Nhóm 13: Phong thủy
  main_direction direction,
  towers_directions jsonb default '{}',
  compatible_can_chi text[] default '{}',
  incompatible_can_chi text[] default '{}',
  fengshui_notes text,

  -- Nhóm 14: Reviews aggregate
  review_count int4 default 0,
  review_avg_rating numeric(3,2),
  review_pros_summary text,
  review_cons_summary text,

  -- Nhóm 16: AI content
  ai_faq jsonb default '[]',
  ai_overview text,
  ai_pros_cons jsonb default '{"pros": [], "cons": []}',
  ai_audio_url text,
  ai_last_generated timestamptz,

  -- Nhóm 17: Search
  embedding_description vector(1024),
  search_keywords tsvector,
  search_phonetic text,

  -- System
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  published boolean default false
);

-- Indexes
create index idx_projects_slug on projects(slug);
create index idx_projects_province on projects(province);
create index idx_projects_district on projects(district);
create index idx_projects_property_type on projects(property_type);
create index idx_projects_tier on projects(tier);
create index idx_projects_status on projects(status);
create index idx_projects_price_avg on projects(price_secondary_per_m2_avg);
create index idx_projects_lat_lng on projects(lat, lng);
create index idx_projects_developer on projects(developer_id);
create index idx_projects_published on projects(published) where published = true;
create index idx_projects_keywords_gin on projects using gin (search_keywords);
create index idx_projects_name_trgm on projects using gin (name_official gin_trgm_ops);
create index idx_projects_embedding_ivfflat on projects
  using ivfflat (embedding_description vector_cosine_ops)
  with (lists = 100);

-- Auto-update search_keywords
create or replace function update_projects_search_keywords() returns trigger as $$
begin
  new.search_keywords := to_tsvector('simple',
    coalesce(new.name_official, '') || ' ' ||
    coalesce(array_to_string(new.name_aliases, ' '), '') || ' ' ||
    coalesce(new.province, '') || ' ' ||
    coalesce(new.district, '') || ' ' ||
    coalesce(new.ward, '') || ' ' ||
    coalesce(new.description_short, '')
  );
  new.updated_at := now();
  return new;
end;
$$ language plpgsql;

create trigger trg_projects_keywords
  before insert or update on projects
  for each row execute function update_projects_search_keywords();

-- =====================================================================
-- Price history
-- =====================================================================

create table project_prices_history (
  id bigserial primary key,
  project_id uuid references projects(id) on delete cascade,
  date date not null,
  price_per_m2_avg int4 not null,
  price_per_m2_min int4,
  price_per_m2_max int4,
  listing_count int4,
  unique(project_id, date)
);

create index idx_prices_history_project_date on project_prices_history(project_id, date desc);

-- =====================================================================
-- Rental price history (separate from sale history, refresh daily)
-- =====================================================================

create table project_rental_history (
  id bigserial primary key,
  project_id uuid references projects(id) on delete cascade,
  date date not null,
  rent_studio_avg int4,
  rent_1br_avg int4,
  rent_2br_avg int4,
  rent_3br_avg int4,
  rent_per_m2_avg int4,
  listings_count int4,
  furnished_listings_count int4,
  short_term_avg_per_night int4,
  short_term_listings_count int4,
  unique(project_id, date)
);

create index idx_rental_history_project_date on project_rental_history(project_id, date desc);

-- =====================================================================
-- Rental unit listings (Phase 2 — individual rental units for FSBO)
-- =====================================================================

create table rental_listings (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  posted_by_user_id uuid references auth.users(id) on delete cascade,
  posted_by_agent_id uuid references agents(id) on delete set null,
  -- Unit detail
  tower text,
  floor int2,
  unit_code text,
  bedroom_count bedroom_count,
  bathroom_count int2,
  area_sqm numeric(6,2),
  direction direction,
  view_description text,
  -- Pricing
  transaction_type transaction_type default 'rent_long',
  price_monthly_vnd int4,  -- for long-term rent
  price_per_night_vnd int4,  -- for short-term
  deposit_months int2,
  -- Terms
  furniture_status furniture_status,
  lease_term lease_term,
  utilities_included text[],  -- ['water', 'internet', 'cable', 'parking']
  pet_allowed boolean default false,
  smoking_allowed boolean default false,
  min_lease_months int2,
  -- Media
  photos_urls text[] default '{}',
  video_url text,
  -- Status
  available_from date,
  is_available boolean default true,
  view_count int4 default 0,
  contact_count int4 default 0,
  published boolean default false,
  expires_at timestamptz default now() + interval '60 days',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_rental_listings_project on rental_listings(project_id) where is_available = true;
create index idx_rental_listings_type on rental_listings(transaction_type, is_available);
create index idx_rental_listings_price on rental_listings(price_monthly_vnd) where is_available = true;
create index idx_rental_listings_agent on rental_listings(posted_by_agent_id);

-- =====================================================================
-- Surrounding amenities detail (cache from Google Places)
-- =====================================================================

create table project_nearby_amenities (
  id bigserial primary key,
  project_id uuid references projects(id) on delete cascade,
  category text not null,  -- school/hospital/mall/metro/bus_stop/etc
  name text not null,
  distance_m int4,
  place_id text,
  lat numeric(10,7),
  lng numeric(10,7),
  rating numeric(3,2),
  metadata jsonb default '{}',
  last_refreshed timestamptz default now(),
  expires_at timestamptz default now() + interval '180 days'
);

create index idx_nearby_project on project_nearby_amenities(project_id, category);
create index idx_nearby_expires on project_nearby_amenities(expires_at);

-- =====================================================================
-- News
-- =====================================================================

create table project_news (
  id bigserial primary key,
  project_id uuid references projects(id) on delete cascade,
  source text,
  url text,
  title text not null,
  published_at timestamptz,
  summary_ai text,
  full_text text,
  scraped_at timestamptz default now()
);

create index idx_news_project on project_news(project_id, published_at desc);
create unique index idx_news_url_unique on project_news(url) where url is not null;

-- =====================================================================
-- Users (extends Supabase auth.users with public profile)
-- =====================================================================

create table user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  phone text,
  phone_verified boolean default false,
  email_verified boolean default false,
  user_type text default 'buyer',  -- buyer / agent / agency_admin / developer_admin / admin
  birth_year int2,  -- for phong thủy filter
  birth_can_chi text,  -- calculated
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_user_profiles_phone on user_profiles(phone);
create index idx_user_profiles_type on user_profiles(user_type);

-- =====================================================================
-- Agencies (sàn môi giới)
-- =====================================================================

create table agencies (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  logo_url text,
  banner_url text,
  description text,
  founded_year int2,
  hq_province text,
  hq_address text,
  website text,
  phone text,
  email text,
  brand_color text,
  agents_count int4 default 0,
  subscription_tier subscription_tier default 'free',
  subscription_expires_at timestamptz,
  verified boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_agencies_slug on agencies(slug);
create index idx_agencies_province on agencies(hq_province);
create index idx_agencies_subscription on agencies(subscription_tier, subscription_expires_at);

-- =====================================================================
-- Agents (môi giới)
-- =====================================================================

create table agents (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid unique references auth.users(id) on delete cascade,
  slug text unique not null,
  display_name text not null,
  avatar_url text,
  cover_url text,
  bio text,
  years_experience int2,
  deals_closed_count int4,
  rental_deals_closed_count int4 default 0,  -- separate counter for rental
  languages text[] default '{vi}',
  phone text not null,
  zalo text,
  email text,
  agency_id uuid references agencies(id),

  -- Specialty
  specialty_types agent_specialty_type[] default '{sale}',  -- ['sale'], ['rent_long'], or ['sale','rent_long','rent_short']
  serves_expat boolean default false,
  english_fluent boolean default false,

  -- KYC
  kyc_status kyc_status default 'pending',
  kyc_submitted_at timestamptz,
  kyc_approved_at timestamptz,
  kyc_rejected_reason text,
  cmt_number_hash text,  -- hash for uniqueness, not store raw
  cmt_front_url text,
  cmt_back_url text,
  selfie_url text,
  license_url text,  -- chứng chỉ môi giới Bộ XD (optional)

  -- Tier
  tier agent_tier default 'unverified',
  verified_badge_active boolean default false,
  verified_badge_expires_at timestamptz,

  -- Social
  social_facebook text,
  social_tiktok text,
  social_youtube text,
  social_instagram text,
  social_threads text,
  social_linkedin text,

  -- Stats
  profile_views_count int4 default 0,
  contact_clicks_count int4 default 0,
  leads_received_count int4 default 0,
  avg_rating numeric(3,2),
  reviews_count int4 default 0,
  response_time_avg_minutes int4,

  -- Search
  embedding_bio vector(1024),
  search_keywords tsvector,

  -- System
  published boolean default false,
  suspended boolean default false,
  suspended_reason text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_agents_slug on agents(slug);
create index idx_agents_kyc on agents(kyc_status);
create index idx_agents_tier on agents(tier);
create index idx_agents_agency on agents(agency_id);
create index idx_agents_published on agents(published) where published = true;
create index idx_agents_keywords_gin on agents using gin (search_keywords);
create index idx_agents_embedding on agents
  using ivfflat (embedding_bio vector_cosine_ops)
  with (lists = 50);

-- =====================================================================
-- Agent specialty projects (M-N)
-- =====================================================================

create table agent_specialty_projects (
  agent_id uuid references agents(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  is_primary boolean default false,
  years_specializing int2,
  deals_in_project_count int4 default 0,
  created_at timestamptz default now(),
  primary key (agent_id, project_id)
);

create index idx_specialty_project on agent_specialty_projects(project_id);
create index idx_specialty_agent on agent_specialty_projects(agent_id);

-- =====================================================================
-- Bidding system
-- =====================================================================

create table agent_bids (
  id uuid primary key default uuid_generate_v4(),
  agent_id uuid references agents(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  slot_type bid_slot_type not null default 'sale',  -- separate auctions per type
  bid_amount_weekly_vnd int4 not null check (bid_amount_weekly_vnd >= 50000),  -- floor adjusted: rent slots 50k, sale slots 100k enforced in app logic
  slot_rank int2 check (slot_rank in (1, 2, 3)),  -- null = lost
  status bid_status default 'active',
  starts_at timestamptz default now(),
  ends_at timestamptz,
  auto_renew boolean default true,
  created_at timestamptz default now(),
  -- Agent can bid for both sale + rent on same project
  unique(agent_id, project_id, slot_type, starts_at)
);

create index idx_bids_agent on agent_bids(agent_id) where status = 'active';
create index idx_bids_project_slot_rank on agent_bids(project_id, slot_type, slot_rank) where status = 'active';
create index idx_bids_ends on agent_bids(ends_at) where status = 'active';

create table agent_bid_history (
  id bigserial primary key,
  bid_id uuid references agent_bids(id),
  agent_id uuid references agents(id),
  project_id uuid references projects(id),
  slot_type bid_slot_type,
  bid_amount_weekly_vnd int4,
  slot_rank int2,
  charged_vnd int4,
  refunded_vnd int4 default 0,
  period_start timestamptz,
  period_end timestamptz,
  notes text,
  created_at timestamptz default now()
);

create index idx_bid_history_agent on agent_bid_history(agent_id, created_at desc);
create index idx_bid_history_project on agent_bid_history(project_id, slot_type, created_at desc);

-- =====================================================================
-- Wallet
-- =====================================================================

create table wallets (
  id uuid primary key default uuid_generate_v4(),
  owner_type text not null,  -- agent / agency / developer
  owner_id uuid not null,
  balance_vnd int8 default 0,
  total_topped_up_vnd int8 default 0,
  total_spent_vnd int8 default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(owner_type, owner_id)
);

create index idx_wallets_owner on wallets(owner_type, owner_id);

create table wallet_transactions (
  id bigserial primary key,
  wallet_id uuid references wallets(id) on delete cascade,
  type text not null,  -- topup / bid_charge / lead_charge / subscription / refund / bonus
  amount_vnd int8 not null,  -- positive = credit, negative = debit
  balance_after_vnd int8,
  reference_id uuid,  -- bid_id / lead_id / payment_id / etc
  reference_type text,
  notes text,
  created_at timestamptz default now()
);

create index idx_wallet_tx_wallet on wallet_transactions(wallet_id, created_at desc);
create index idx_wallet_tx_reference on wallet_transactions(reference_type, reference_id);

-- =====================================================================
-- Leads
-- =====================================================================

create table leads (
  id uuid primary key default uuid_generate_v4(),
  agent_id uuid references agents(id) on delete set null,
  project_id uuid references projects(id) on delete set null,
  user_id uuid references auth.users(id) on delete set null,  -- nullable for anonymous
  rental_listing_id uuid references rental_listings(id) on delete set null,  -- if from a specific rental listing

  -- Intent
  transaction_type transaction_type default 'sale',
  -- Rental-specific intent
  preferred_bedrooms bedroom_count,
  budget_monthly_vnd int4,  -- for rent intent
  budget_total_vnd int8,  -- for sale intent
  preferred_move_in_date date,
  preferred_lease_term lease_term,
  needs_furnished boolean,

  -- Contact info captured
  contact_name text not null,
  contact_phone text not null,
  contact_email text,
  message text,

  -- Lead quality
  is_verified boolean default false,
  user_phone_verified boolean default false,
  user_email_verified boolean default false,
  charge_amount_vnd int4,  -- pricing varies by transaction_type (see SPEC §7.3)

  -- Status
  status lead_status default 'new',
  agent_contacted_at timestamptz,
  agent_response_notes text,
  user_feedback text,
  user_feedback_rating int2 check (user_feedback_rating between 1 and 5),

  -- System
  source_url text,
  user_agent text,
  ip_country text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_leads_agent on leads(agent_id, created_at desc);
create index idx_leads_project on leads(project_id, created_at desc);
create index idx_leads_status on leads(status);
create index idx_leads_user on leads(user_id);

-- =====================================================================
-- Reviews (Phase 2)
-- =====================================================================

create table project_reviews (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  rating int2 not null check (rating between 1 and 5),
  pros_text text,
  cons_text text,
  general_text text,
  verified_resident boolean default false,
  resident_since_year int2,
  helpful_count int4 default 0,
  reported_count int4 default 0,
  hidden boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_reviews_project on project_reviews(project_id) where hidden = false;
create index idx_reviews_user on project_reviews(user_id);

create table agent_reviews (
  id uuid primary key default uuid_generate_v4(),
  agent_id uuid references agents(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  lead_id uuid references leads(id),
  rating int2 not null check (rating between 1 and 5),
  text text,
  helpful_count int4 default 0,
  hidden boolean default false,
  created_at timestamptz default now()
);

create index idx_agent_reviews_agent on agent_reviews(agent_id) where hidden = false;

-- =====================================================================
-- User saved projects (wishlist)
-- =====================================================================

create table user_saved_projects (
  user_id uuid references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete cascade,
  notes text,
  saved_at timestamptz default now(),
  primary key (user_id, project_id)
);

create index idx_saved_project on user_saved_projects(project_id);

-- =====================================================================
-- Search history (analytics)
-- =====================================================================

create table user_search_history (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete set null,
  session_id text,
  query text,
  filters jsonb,
  results_count int4,
  clicked_project_ids uuid[],
  created_at timestamptz default now()
);

create index idx_search_history_session on user_search_history(session_id, created_at desc);

-- =====================================================================
-- Subscriptions (premium addons, agency, developer)
-- =====================================================================

create table subscriptions (
  id uuid primary key default uuid_generate_v4(),
  owner_type text not null,  -- agent/agency/developer
  owner_id uuid not null,
  tier subscription_tier not null,
  product_code text not null,  -- 'verified_maintenance' / 'featured_video_VIN_OP' / 'agency_pro' / 'developer_sponsored_VIN'
  amount_monthly_vnd int4,
  starts_at timestamptz default now(),
  ends_at timestamptz,
  auto_renew boolean default true,
  status text default 'active',  -- active/cancelled/expired/suspended
  payment_method payment_method,
  external_subscription_id text,  -- PayPal subscription ID
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_subscriptions_owner on subscriptions(owner_type, owner_id);
create index idx_subscriptions_ends on subscriptions(ends_at) where status = 'active';

-- =====================================================================
-- Payments (raw transaction log)
-- =====================================================================

create table payments (
  id uuid primary key default uuid_generate_v4(),
  payer_type text not null,
  payer_id uuid not null,
  amount_vnd int8 not null,
  method payment_method,
  status payment_status default 'pending',
  external_payment_id text,  -- PayPal capture ID / payOS transaction ID
  external_order_id text,
  subscription_id uuid references subscriptions(id),
  wallet_topup boolean default false,
  metadata jsonb default '{}',
  created_at timestamptz default now(),
  completed_at timestamptz
);

create index idx_payments_payer on payments(payer_type, payer_id, created_at desc);
create index idx_payments_external on payments(external_payment_id);
create index idx_payments_status on payments(status);

-- =====================================================================
-- AI content cache
-- =====================================================================

create table ai_content_cache (
  id bigserial primary key,
  entity_type text not null,  -- project / agent / khao_luan
  entity_id uuid not null,
  content_type text not null,  -- faq / overview / pros_cons / audio_script / summary
  content jsonb,
  text_content text,
  model_used text,
  tokens_used int4,
  generated_at timestamptz default now(),
  expires_at timestamptz,
  unique(entity_type, entity_id, content_type)
);

create index idx_ai_cache_entity on ai_content_cache(entity_type, entity_id);
create index idx_ai_cache_expires on ai_content_cache(expires_at);

-- =====================================================================
-- Google Maps cache layers
-- =====================================================================

create table gmaps_places_cache (
  place_id text primary key,
  name text,
  formatted_address text,
  lat numeric(10,7),
  lng numeric(10,7),
  types text[],
  rating numeric(3,2),
  user_ratings_total int4,
  raw_response jsonb,
  fetched_at timestamptz default now(),
  expires_at timestamptz default now() + interval '90 days'
);

create index idx_gmaps_places_expires on gmaps_places_cache(expires_at);

create table gmaps_nearby_cache (
  id bigserial primary key,
  origin_lat numeric(10,7) not null,
  origin_lng numeric(10,7) not null,
  radius_m int4 not null,
  category text not null,
  results jsonb not null,
  fetched_at timestamptz default now(),
  expires_at timestamptz default now() + interval '180 days',
  unique(origin_lat, origin_lng, radius_m, category)
);

create index idx_gmaps_nearby_expires on gmaps_nearby_cache(expires_at);

create table gmaps_geocoding_cache (
  address_hash text primary key,
  query_text text,
  lat numeric(10,7),
  lng numeric(10,7),
  formatted_address text,
  place_id text,
  fetched_at timestamptz default now()
);

-- =====================================================================
-- Khảo luận (SEO blog auto-generated)
-- =====================================================================

create table khao_luan (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  title text not null,
  excerpt text,
  content_markdown text,
  content_html text,
  tags text[] default '{}',
  related_project_ids uuid[] default '{}',
  related_agent_ids uuid[] default '{}',
  hero_image_url text,
  audio_url text,
  views_count int4 default 0,
  published boolean default true,
  ai_model_used text,
  generated_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index idx_khao_luan_slug on khao_luan(slug);
create index idx_khao_luan_tags on khao_luan using gin (tags);
create index idx_khao_luan_published on khao_luan(published, generated_at desc) where published = true;

-- =====================================================================
-- Admin: KYC queue, data quality, reports
-- =====================================================================

create table admin_kyc_queue (
  id bigserial primary key,
  agent_id uuid unique references agents(id) on delete cascade,
  priority int2 default 5,
  assigned_admin_id uuid references auth.users(id),
  notes text,
  created_at timestamptz default now()
);

create table user_reports (
  id bigserial primary key,
  reporter_user_id uuid references auth.users(id) on delete set null,
  target_type text not null,  -- agent / agency / review / news / project
  target_id uuid not null,
  reason text not null,
  details text,
  status text default 'pending',  -- pending/reviewed/actioned/dismissed
  admin_notes text,
  created_at timestamptz default now(),
  resolved_at timestamptz
);

create index idx_reports_target on user_reports(target_type, target_id);
create index idx_reports_status on user_reports(status);

-- =====================================================================
-- Functions
-- =====================================================================

-- Get top 3 agents for project + slot type (sale or rent)
create or replace function get_top_agents(
  p_project_id uuid,
  p_slot_type bid_slot_type default 'sale'
)
returns table (
  agent_id uuid,
  slug text,
  display_name text,
  avatar_url text,
  tier agent_tier,
  bid_amount int4,
  slot_rank int2
) language sql stable as $$
  select
    a.id,
    a.slug,
    a.display_name,
    a.avatar_url,
    a.tier,
    b.bid_amount_weekly_vnd,
    b.slot_rank
  from agent_bids b
  join agents a on a.id = b.agent_id
  where b.project_id = p_project_id
    and b.slot_type = p_slot_type
    and b.status = 'active'
    and a.published = true
    and a.suspended = false
    and coalesce(a.avg_rating, 5) >= 3.5
    and p_slot_type::text = any(a.specialty_types::text[])
  order by b.slot_rank asc nulls last, b.bid_amount_weekly_vnd desc
  limit 3;
$$;

-- Get random non-bidding agents for project (rotation pool, filtered by specialty)
create or replace function get_random_agents(
  p_project_id uuid,
  p_slot_type bid_slot_type default 'sale',
  p_limit int default 4
)
returns table (
  agent_id uuid,
  slug text,
  display_name text,
  avatar_url text,
  tier agent_tier
) language sql stable as $$
  select
    a.id,
    a.slug,
    a.display_name,
    a.avatar_url,
    a.tier
  from agents a
  join agent_specialty_projects sp on sp.agent_id = a.id
  where sp.project_id = p_project_id
    and a.published = true
    and a.suspended = false
    and p_slot_type::text = any(a.specialty_types::text[])
    and a.id not in (
      select agent_id from agent_bids
      where project_id = p_project_id
        and slot_type = p_slot_type
        and status = 'active'
        and slot_rank is not null
    )
  order by random()
  limit p_limit;
$$;

-- Auction resolution per slot type (run hourly via cron)
create or replace function resolve_bidding_slots(
  p_project_id uuid,
  p_slot_type bid_slot_type
)
returns void language plpgsql as $$
begin
  -- Assign slot ranks 1-3 to top 3 active bids of this slot type with rating >= 3.5
  with ranked as (
    select b.id, row_number() over (order by b.bid_amount_weekly_vnd desc) as rn
    from agent_bids b
    join agents a on a.id = b.agent_id
    where b.project_id = p_project_id
      and b.slot_type = p_slot_type
      and b.status = 'active'
      and coalesce(a.avg_rating, 5) >= 3.5
      and a.suspended = false
      and p_slot_type::text = any(a.specialty_types::text[])
  )
  update agent_bids b
  set slot_rank = case
    when r.rn = 1 then 1
    when r.rn = 2 then 2
    when r.rn = 3 then 3
    else null
  end
  from ranked r
  where b.id = r.id;
end;
$$;

-- Convenience wrapper: resolve both slot types in one call
create or replace function resolve_all_bidding_slots(p_project_id uuid)
returns void language plpgsql as $$
begin
  perform resolve_bidding_slots(p_project_id, 'sale');
  perform resolve_bidding_slots(p_project_id, 'rent_long');
  perform resolve_bidding_slots(p_project_id, 'rent_short');
end;
$$;

-- =====================================================================
-- RLS Policies
-- =====================================================================

alter table user_profiles enable row level security;
alter table agents enable row level security;
alter table agencies enable row level security;
alter table agent_bids enable row level security;
alter table wallets enable row level security;
alter table wallet_transactions enable row level security;
alter table leads enable row level security;
alter table project_reviews enable row level security;
alter table agent_reviews enable row level security;
alter table user_saved_projects enable row level security;
alter table subscriptions enable row level security;
alter table payments enable row level security;
alter table rental_listings enable row level security;

-- Rental listings: anyone reads published, only owner edits
create policy "rental_listings_read_published" on rental_listings
  for select using (published = true and is_available = true);
create policy "rental_listings_self_write" on rental_listings
  for all using (
    posted_by_user_id = auth.uid()
    or posted_by_agent_id in (select id from agents where user_id = auth.uid())
  );

-- Public read for projects, developers, khao_luan, agents (published)
alter table projects enable row level security;
create policy "projects_read_published" on projects for select using (published = true);

alter table developers enable row level security;
create policy "developers_read_all" on developers for select using (true);

alter table khao_luan enable row level security;
create policy "khao_luan_read_published" on khao_luan for select using (published = true);

create policy "agents_read_published" on agents for select using (published = true and suspended = false);

create policy "agencies_read_all" on agencies for select using (true);

-- User can read/write their own profile
create policy "user_profiles_self" on user_profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

-- Agent can edit own data
create policy "agents_self_update" on agents
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Wallet self-access (read only via dashboard)
create policy "wallets_self_read" on wallets
  for select using (
    (owner_type = 'agent' and owner_id in (select id from agents where user_id = auth.uid()))
    or (owner_type = 'agency' and owner_id in (
      select agency_id from agents where user_id = auth.uid()
    ))
  );

-- Leads: agent sees their own leads
create policy "leads_agent_read" on leads
  for select using (
    agent_id in (select id from agents where user_id = auth.uid())
    or user_id = auth.uid()
  );

-- Reviews: anyone can read non-hidden, only authenticated can post
create policy "project_reviews_read" on project_reviews
  for select using (hidden = false);
create policy "project_reviews_post" on project_reviews
  for insert with check (auth.uid() = user_id);

create policy "agent_reviews_read" on agent_reviews
  for select using (hidden = false);
create policy "agent_reviews_post" on agent_reviews
  for insert with check (auth.uid() = user_id);

-- Saved projects: own only
create policy "saved_projects_self" on user_saved_projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Bids: agent reads/writes own
create policy "bids_self" on agent_bids
  for all using (agent_id in (select id from agents where user_id = auth.uid()))
  with check (agent_id in (select id from agents where user_id = auth.uid()));

-- =====================================================================
-- Seed: Province enum-like reference (optional, for autocomplete)
-- =====================================================================

create table provinces (
  code text primary key,
  name text not null,
  region text,  -- 'mien_bac' / 'mien_trung' / 'mien_nam'
  lat numeric(10,7),
  lng numeric(10,7)
);

-- Top markets (populate full 63 later)
insert into provinces (code, name, region, lat, lng) values
  ('HN',  'Hà Nội',         'mien_bac',   21.0285, 105.8542),
  ('HCM', 'TP. Hồ Chí Minh','mien_nam',   10.7769, 106.7009),
  ('DN',  'Đà Nẵng',        'mien_trung', 16.0544, 108.2022),
  ('HP',  'Hải Phòng',      'mien_bac',   20.8449, 106.6881),
  ('CT',  'Cần Thơ',        'mien_nam',   10.0452, 105.7469),
  ('BD',  'Bình Dương',     'mien_nam',   11.3254, 106.4770),
  ('DNa', 'Đồng Nai',       'mien_nam',   11.0686, 107.1676),
  ('LA',  'Long An',        'mien_nam',   10.6957, 106.2431),
  ('BR',  'Bà Rịa-VT',      'mien_nam',   10.5417, 107.2429),
  ('QN',  'Quảng Ninh',     'mien_bac',   21.0064, 107.2925)
on conflict do nothing;

-- =====================================================================
-- DONE
-- Run order: extensions → enums → tables → indexes → functions → policies → seed
-- =====================================================================
