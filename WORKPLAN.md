# 🗓️ Nhà Bản Đồ — Workplan v1.0

**Companion to**: `PROJECT_SPEC.md`
**Duration**: 52 weeks (Year 1)
**Status legend**: ⬜ todo · 🟡 in progress · ✅ done · 🔴 blocked · ⏸ deferred

---

## Roles

| Owner | Code | Responsibilities |
|---|---|---|
| **Henry** | H | Final decisions, GitHub upload, Vercel deploy, B2B sales, approve admin actions |
| **Team Data** | TD | Manual fill gold layers (pháp lý, quy hoạch, risk, occupation, phong thủy), photo curation, verify AI output, news monitoring |
| **Claude** | C | Code generation, prompt engineering, AI workflows, architecture iteration |
| **Admin** (future hire Phase 2) | A | KYC review, support, moderation, sales follow-up |

---

## Critical Path

```
P0-T01 (GCP) ──┐
P0-T02 (Supabase) ──┤
P0-T03 (Vercel) ──┼─→ P0-T07 (Scraper Cafef) ──┐
P0-T05 (GitHub) ──┤   P0-T08 (Scraper BDS) ───┤
P0-T06 (Railway) ──┘                          ↓
                                  P0-T09 (AI dedupe)
                                          ↓
                                  P0-T10 (Insert 5k DB)
                                          ↓
                                  P0-T11 (GMaps cache layer)
                                          ↓
                                  P0-T12 (Places enrichment)
                                          ↓
                          ┌───────────────┴───────────────┐
                          ↓                               ↓
                  P0-T14 (AI fill)              P0-T17 (Admin dashboard)
                          ↓                               ↓
                  P0-T15 (FAQ top 500)          P0-T18 (TD fill top 100)
                          └───────────────┬───────────────┘
                                          ↓
                                  Milestone M1 (Week 8)
                                          ↓
                                  P1-T01..21 (MVP)
                                          ↓
                                  M2 (Week 16, soft launch)
```

**Bottleneck risks**: P0-T07/08 (scraping anti-bot) · P0-T18 (team data velocity) · P1-T03 (Maps performance)

---

## Milestones

| ID | Week | Goal | Acceptance |
|---|---|---|---|
| **M1** | 8 | Data foundation | 5000 projects in DB, top 500 AI-filled, top 100 verified by TD |
| **M2** | 16 | MVP soft launch | Site live, 100+ verified agents, all 14 sections render |
| **M3** | 28 | Revenue start | $3-5k MRR, bidding live, 200+ paying agents |
| **M4** | 44 | Scale | $20-30k MRR, multi-city, CĐT deals signed |

---

# 📦 Phase 0: Data Collection (Week 1-8)

## Week 1-2: Infrastructure Setup

### P0-T01: GCP project + Maps Platform APIs
- **Owner**: H
- **Estimate**: 2h
- **Dependencies**: —
- **Deliverables**:
  - GCP project created
  - Maps JS, Static Maps, Places, Geocoding APIs enabled
  - Billing account linked, alerts at $100/$200/$500
  - API key created, restricted by referer + IP
- **AC**: API key returns 200 OK from test query; restricted properly; alerts configured
- **Status**: ⬜

### P0-T02: Supabase project init
- **Owner**: H
- **Estimate**: 30min
- **Dependencies**: `schema.sql` (done)
- **Deliverables**:
  - New Supabase project (NOT reuse tuvi)
  - Run `schema.sql` via SQL Editor
  - Storage buckets: `projects-media`, `agents-kyc` (private), `agents-public`
  - Auth providers: email/password + Google + Facebook
- **AC**: All 28 tables visible; RLS policies enabled; test insert works; buckets accessible
- **Status**: ⬜

### P0-T03: Vercel project + Next.js scaffold
- **Owner**: H + C
- **Estimate**: 4h
- **Dependencies**: P0-T02, P0-T05
- **Deliverables**:
  - `create-next-app` TypeScript App Router
  - Tailwind + shadcn/ui
  - Supabase client setup (`lib/supabase/`)
  - Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `GOOGLE_MAPS_API_KEY`, `ANTHROPIC_API_KEY`, etc.
  - Vercel project linked GitHub
- **AC**: `/` returns "Hello world"; auth login works; deployed to vercel.app domain
- **Status**: ⬜

### P0-T04: Domain + DNS
- **Owner**: H
- **Estimate**: 30min
- **Dependencies**: P0-T03 + brand name decision
- **Deliverables**:
  - Domain registered
  - DNS pointed to Vercel
  - SSL active
- **AC**: Site accessible at custom domain with HTTPS
- **Status**: 🔴 **BLOCKED on brand name decision**

### P0-T05: GitHub repo
- **Owner**: H
- **Estimate**: 15min
- **Deliverables**: Repo `nha-ban-do` (private), branches `main` + `dev`, basic README
- **AC**: Repo ready; Vercel connected
- **Status**: ⬜

### P0-T06: Railway scraper service init
- **Owner**: H + C
- **Estimate**: 2h
- **Deliverables**:
  - Railway project
  - Python 3.11 + Playwright + BeautifulSoup
  - Environment vars: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `BRIGHTDATA_PROXY` (optional)
  - GitHub repo `nha-ban-do-scraper` connected
- **AC**: Hello-world cron runs, can write to Supabase test table
- **Status**: ⬜

---

## Week 3-4: Scraper Master List

### P0-T07: Scraper Cafef.vn projects
- **Owner**: C → H runs on Railway
- **Estimate**: 8h
- **Dependencies**: P0-T06
- **Deliverables**:
  - `scrape_cafef.py`
  - Output: ~3000 projects with `name`, `developer`, `province`, `district`, `property_type` guess, `url_source`
  - Saved to `staging_projects_cafef` table
- **AC**: 95%+ pages parsed without error; data quality manual spot-check 20 random rows
- **Risk**: Anti-bot. Solution: residential proxy if needed
- **Status**: ⬜

### P0-T08: Scraper Batdongsan.com.vn projects
- **Owner**: C → H runs on Railway
- **Estimate**: 12h
- **Dependencies**: P0-T06
- **Deliverables**:
  - `scrape_batdongsan.py` (Playwright headless for JS rendering)
  - Output: ~5000 projects, saved to `staging_projects_bds` table
  - Include `price_range_text`, `total_units`, `year_handover` if parseable
- **AC**: Same as above
- **Risk**: HIGH. Cloudflare protection. Solution: BrightData proxy ($20/month) + delay random 5-15s
- **Status**: ⬜

### P0-T09: AI dedupe + normalize
- **Owner**: C
- **Estimate**: 6h
- **Dependencies**: P0-T07, P0-T08
- **Deliverables**:
  - `dedupe_master.py` (Claude API + fuzzy matching)
  - Merge `staging_projects_cafef` + `staging_projects_bds`
  - Fuzzy match by `(name, district)` similarity > 0.85
  - Normalize developer names ("Vinhomes" vs "Vin Group" vs "Vingroup")
  - Classify `property_type` enum
  - AI infer `tier` from price range
  - Output: `staging_projects_master` (deduplicated, ~4500 rows)
- **AC**: Manual review 50 random rows → < 5% errors
- **Status**: ⬜

### P0-T10: Insert master to `projects` table
- **Owner**: C
- **Estimate**: 2h
- **Dependencies**: P0-T09
- **Deliverables**:
  - Migration script from staging to production `projects`
  - Generate `slug` from name+province
  - Set `data_quality = 'auto'`
  - Set `published = false` (don't show until enriched)
- **AC**: 4500 rows in `projects` table; no duplicate slugs; all have province+name
- **Status**: ⬜

### P0-T10b: Scraper rental listings (Cho thuê)
- **Owner**: C → H runs on Railway
- **Estimate**: 10h
- **Dependencies**: P0-T10
- **Deliverables**:
  - `scrape_rentals_batdongsan.py` — chuyên mục "Cho thuê căn hộ"
  - `scrape_rentals_chotot.py` — Nhatot/Chotot có nhiều rental listing volume
  - Parse: project_name match, bedroom_count, area, monthly_rent, furnished_status, lease_term
  - Aggregate per project → calculate avg by bedroom count
  - Populate `projects.rent_1br_avg_monthly_vnd`, `rent_2br_avg_monthly_vnd`, etc
  - Populate `rent_listings_active_count`, `rent_demand_score` (based on velocity)
  - Insert daily snapshot to `project_rental_history`
- **AC**: Top 500 dự án có rental data; sample 30 → < 10% error vs manual check
- **Status**: ⬜

### P0-T10c: Scraper Airbnb short-term (deferred to Phase 2)
- **Owner**: C
- **Estimate**: 16h
- **Note**: Airbnb anti-scrape rất chặt. Defer to Phase 2. Có thể dùng AirDNA paid data ($30-100/month) thay vì scrape.
- **Status**: ⏸

---

## Week 5-6: Google Places Enrichment

### P0-T11: Google Maps cache layer (TypeScript lib)
- **Owner**: C
- **Estimate**: 8h
- **Dependencies**: P0-T03
- **Deliverables**:
  - `lib/gmaps/cache.ts` — wrapper functions
  - `lib/gmaps/places.ts` — Places API with cache check
  - `lib/gmaps/geocoding.ts` — Geocoding with cache
  - `lib/gmaps/nearby.ts` — Nearby search with cache
  - `lib/gmaps/static-map.ts` — Static Maps URL builder
- **AC**: Test queries hit cache 2nd time; cache TTL respected; unit tests pass
- **Status**: ⬜

### P0-T12: Batch Places enrichment for 5000 projects
- **Owner**: C → H runs
- **Estimate**: 10h (compute) + 4h (review)
- **Dependencies**: P0-T10, P0-T11
- **Deliverables**:
  - `enrich_places.py` (Python, uses cache layer via HTTP)
  - For each project: Places Text Search → best match → fill `lat`, `lng`, `google_place_id`, `address_full`
  - Confidence score per match
  - Manual review queue for matches < 0.7 confidence
- **AC**: 80%+ projects auto-matched; remaining 20% in review queue
- **Cost estimate**: 5000 × $0.017 (Places Text Search) = $85
- **Status**: ⬜

### P0-T13: Nearby amenities enrichment
- **Owner**: C → H runs
- **Estimate**: 6h
- **Dependencies**: P0-T12
- **Deliverables**:
  - `enrich_nearby.py`
  - For each project with lat/lng: Nearby Search for school, hospital, mall, metro (radius 2km)
  - Populate `project_nearby_amenities` + `nearest_*_m` fields on `projects`
- **AC**: 90%+ projects have at least 3 nearby amenity categories filled
- **Cost estimate**: 5000 × 5 categories × $0.032 = $800 (one-time, cached 180d)
- **Status**: ⬜

---

## Week 7-8: AI Auto-Fill + Team Data Start

### P0-T14: AI bulk description generation
- **Owner**: C → H runs
- **Estimate**: 12h
- **Dependencies**: P0-T10
- **Deliverables**:
  - `ai_fill_descriptions.py` (Claude Sonnet bulk)
  - For each project: generate `description_short` (50-80 từ), `description_long` (300-500 từ), `ai_overview`, `ai_pros_cons`
  - Mark `data_quality = 'ai_filled'`
- **AC**: 4500 projects filled; sample 30 → no hallucinated facts (cross-check against scraped data)
- **Cost estimate**: 4500 × ~2k tokens × $0.003/1k = ~$30
- **Status**: ⬜

### P0-T15: AI FAQ + audio top 500
- **Owner**: C → H runs
- **Estimate**: 8h
- **Dependencies**: P0-T14
- **Deliverables**:
  - `ai_fill_faq.py` — generate `ai_faq` for top 500 dự án (by Google rating + listing count)
  - `gen_audio.py` — Vbee TTS audio summary for top 100 (5 min audio mỗi cái)
  - Audio uploaded to Supabase Storage `projects-media/audio/`
- **AC**: Top 500 have FAQ; top 100 have audio
- **Cost**: AI ~$50 + Vbee TTS ~$30
- **Status**: ⬜

### P0-T16: Embed projects to pgvector
- **Owner**: C → H runs
- **Estimate**: 4h
- **Dependencies**: P0-T14
- **Deliverables**:
  - `embed_projects.py` using OpenAI `text-embedding-3-small` (reuse tuvi pipeline)
  - Embed `description_long` → `embedding_description`
- **AC**: All projects have vector; semantic search query returns relevant results
- **Cost**: ~$10
- **Status**: ⬜

### P0-T17: Admin dashboard MVP for team data
- **Owner**: C → H deploys
- **Estimate**: 16h
- **Dependencies**: P0-T03, P0-T10
- **Deliverables**:
  - `/dashboard/admin` route, auth-gated by `user_type = 'admin'`
  - List projects sorted by `data_quality` ascending (worst first)
  - Detail view with form per nhóm 5/10/11/12/13 (Pháp lý, Risk, Triển vọng, Media, Phong thủy)
  - Save → update `data_quality = 'verified'` or `'gold'`
  - Photo upload to Supabase Storage
- **AC**: TD can log in, edit a project, save, see status change
- **Status**: ⬜

### P0-T18: Brief Team Data + start manual fill top 100
- **Owner**: H + TD
- **Estimate**: 1h brief + 100 × 30min = 50h
- **Dependencies**: P0-T17, **`DATA_DICTIONARY.md` (to be created)**
- **Deliverables**:
  - Team brief meeting + slack/email channel
  - Top 100 dự án fully verified (Nhóm 5, 10, 11, 12, 13 filled)
- **AC**: Top 100 projects have `data_quality = 'verified'` or `'gold'`
- **Status**: 🔴 **BLOCKED on Data Dictionary**

### **🚩 Milestone M1 (End of Week 8)**
- ✅ 5000 projects in DB
- ✅ Top 500 AI-filled (FAQ, descriptions)
- ✅ Top 100 verified by TD
- ✅ All projects have lat/lng + nearby amenities
- ✅ Embeddings ready for semantic search
- ✅ Top 500 dự án có rental data (avg theo bedroom count)
- ✅ Rental history snapshot daily cron running

---

# 🚀 Phase 1: MVP Launch (Week 9-16)

## Week 9-10: Homepage + Map

### P1-T01: Next.js base components
- **Owner**: C
- **Estimate**: 8h
- **Deliverables**: `Nav.tsx`, `Footer.tsx`, `Layout.tsx`, theme tokens (CSS vars reused from tuvi), responsive breakpoints
- **AC**: Layout renders correctly mobile + desktop
- **Status**: ⬜

### P1-T02: Auth Supabase integration
- **Owner**: C
- **Estimate**: 6h
- **Deliverables**: Signin/signup pages (`/dang-nhap`, `/dang-ky/nguoi-mua`), session middleware, RLS verified
- **AC**: User signup → email confirm → login → session persist
- **Status**: ⬜

### P1-T03: HomeMap component
- **Owner**: C
- **Estimate**: 18h
- **Dependencies**: P0-T11, P0-T12
- **Deliverables**:
  - `components/map/HomeMap.tsx`
  - **Top toggle: 🏠 Mua/Bán | 🔑 Cho thuê** (state lifted, persists in URL ?mode=)
  - Google Maps JS API loader (lazy load)
  - Pin clusters via MarkerClusterer
  - Geolocation detect → zoom to user city
  - Viewport bounds query `/api/projects/by-bounds?mode=sale|rent_long`
  - Pin label switches: "45tr/m²" (sale mode) vs "25tr/tháng" (rent mode, shows 2BR avg)
  - Custom mascot pin SVG
  - Pin color by tier (sale) or rent_demand_score (rent)
  - Hover/tap animations
- **AC**: Loads in < 3s mobile; toggle smooth; 200+ pins render without lag; clusters correctly
- **Status**: ⬜

### P1-T04: Pin bottom sheet (mobile) / side panel (desktop)
- **Owner**: C
- **Estimate**: 10h
- **Dependencies**: P1-T03
- **Deliverables**:
  - `ProjectBottomSheet.tsx` with snap points, swipe-to-dismiss
  - **Content switches by mode**:
    - Sale mode: giá/m², range tổng, xu hướng, % lấp đầy
    - Rent mode: giá 1BR/2BR/3BR/tháng, demand score, furnished %
- **AC**: Smooth on iOS Safari + Chrome Android; mode switch updates content
- **Status**: ⬜

### P1-T05: Search bar with autocomplete
- **Owner**: C
- **Estimate**: 6h
- **Dependencies**: P1-T03
- **Deliverables**: `SearchBox.tsx` with Supabase RPC `search_projects_autocomplete` (trigram + tsvector)
- **AC**: Type "vinhom" → suggestions show "Vinhomes Ocean Park", etc.
- **Status**: ⬜

---

## Week 11-12: Project Hub Page

### P1-T06: `/du-an/[province]/[slug]` route SSR
- **Owner**: C
- **Estimate**: 8h
- **Deliverables**: SSR page component, joins `projects` + `developers` + `project_prices_history` + nearby amenities
- **AC**: Page loads with full data, SEO meta tags correct
- **Status**: ⬜

### P1-T07: Render project hub sections
- **Owner**: C
- **Estimate**: 26h
- **Dependencies**: P1-T06
- **Deliverables**: Each section component (overview, **price with sale/rent toggle**, legal, amenities, surrounding, fengshui, reviews, risk, outlook, news, FAQ, **agents split into 2 cụm sale + rent**)
- **AC**: All sections render data; lazy-loaded below fold; price section toggle works
- **Status**: ⬜

### P1-T07b: Rental-specific section components
- **Owner**: C
- **Estimate**: 10h
- **Dependencies**: P1-T07
- **Deliverables**:
  - `RentalPriceSection.tsx` — breakdown theo bedroom + furnished premium + demand score
  - `RentalMarketChart.tsx` — line chart 12m rental price trend từ `project_rental_history`
  - `RentalListingsSection.tsx` (Phase 2 placeholder for FSBO listings)
  - `ExpatScoreBadge.tsx` — "Expat-friendly" badge if score > 7
  - Toggle component to switch between Sale price view ↔ Rent price view inline
- **AC**: Rental section renders correctly cho dự án có rental data; gracefully degrades nếu không có data
- **Status**: ⬜

### P1-T08: Phong thủy module (port tuvi engine)
- **Owner**: C
- **Estimate**: 8h
- **Dependencies**: tuvi `tuvi-ansao-engine.js` (read-only reference)
- **Deliverables**:
  - `lib/fengshui/compat.ts` — wraps Bát Trạch logic
  - `FengshuiSection.tsx` — input năm sinh → display compatible/incompatible
- **AC**: Input year → correct can-chi → correct compatibility result
- **Status**: ⬜

### P1-T09: Audio player Vbee integration
- **Owner**: C
- **Estimate**: 4h
- **Deliverables**: `AudioPlayer.tsx` plays from Supabase Storage URL
- **AC**: Audio plays on mobile + desktop; progress bar works
- **Status**: ⬜

### P1-T10: Price chart line component
- **Owner**: C
- **Estimate**: 4h
- **Dependencies**: P1-T06, `project_prices_history` data
- **Deliverables**: Chart.js v4 line chart, 24-month history
- **AC**: Renders smoothly; tooltip works
- **Status**: ⬜

---

## Week 13: Search + Filter

### P1-T11: `/api/search` route
- **Owner**: C
- **Estimate**: 12h
- **Deliverables**:
  - Semantic search: embed query → ivfflat cosine sim → top 50
  - **Mode-aware filter**: `?mode=sale|rent_long|rent_short` switches price field used
  - Filter post-processing: province, type, price range, tier, amenities, hợp tuổi
  - **Rental-mode filters**: bedroom_count, furnished, lease_term, expat_friendly
  - Geo bounds option (when called from map viewport)
  - Return paginated results
- **AC**: Query "căn hộ Vinhomes 2 phòng dưới 5 tỷ Q.9" (sale) + "thuê 2PN dưới 20tr Q.7" (rent) both work
- **Status**: ⬜

### P1-T12: Filter sidebar UI (cascade by mode)
- **Owner**: C
- **Estimate**: 14h
- **Dependencies**: P1-T11
- **Deliverables**:
  - `FilterSidebar.tsx` with shared filters (9) + mode-specific filters
  - Sale mode: price range, investment score, rental yield
  - Rent mode: monthly budget, bedroom count, furnished, lease term, pet, expat-friendly, intl school distance
- **AC**: Filter changes update URL params + results; mode switch resets mode-specific filters; clear all works
- **Status**: ⬜

### P1-T13: `/tim-kiem` results page
- **Owner**: C
- **Estimate**: 6h
- **Deliverables**: Grid/list toggle, sort options (price, rating, newest), pagination
- **AC**: 100+ results page works smoothly
- **Status**: ⬜

---

## Week 14: Agent Profile + KYC

### P1-T14: Agent signup + KYC submit
- **Owner**: C
- **Estimate**: 10h
- **Deliverables**:
  - `/dang-ky/moi-gioi` multi-step form
  - Upload CMT front/back + selfie to Supabase Storage (private bucket)
  - Insert into `agents` with `kyc_status = 'pending'`
  - Email notification to admin
- **AC**: Full signup flow works; files stored securely
- **Status**: ⬜

### P1-T14b: Agent specialty selection in signup
- **Owner**: C
- **Estimate**: 3h
- **Dependencies**: P1-T14
- **Deliverables**:
  - Step in onboarding: chọn `specialty_types` (multi-select: 🏠 Mua/Bán, 🔑 Cho thuê dài hạn, 🏨 Cho thuê ngắn hạn)
  - Optional: `serves_expat`, `english_fluent` (auto-add badge "Serves expat" if both)
  - Save to `agents.specialty_types`
- **AC**: Agent profile displays correct specialty tags
- **Status**: ⬜

### P1-T15: Admin KYC review queue
- **Owner**: C
- **Estimate**: 8h
- **Dependencies**: P0-T17 (admin dashboard base)
- **Deliverables**:
  - `/dashboard/admin/kyc` list pending
  - Detail view shows uploaded docs
  - Approve / Reject with reason
  - Email notify agent
- **AC**: Admin can review + decide; status updates correctly
- **Status**: ⬜

### P1-T16: `/moi-gioi/[slug]` profile page
- **Owner**: C
- **Estimate**: 12h
- **Deliverables**:
  - Full profile layout per SPEC §6.6
  - **Specialty tag badges** prominent (🏠 / 🔑 / 🏨)
  - Stats separated: deals_closed (sale) vs rental_deals_closed
  - Reviews filter by transaction type
- **AC**: All sections render; SEO meta correct; specialty clearly visible
- **Status**: ⬜

### P1-T17: Lead capture form + email
- **Owner**: C
- **Estimate**: 8h
- **Deliverables**:
  - `ContactForm.tsx` modal
  - **Form fields adapt to transaction mode** (sale: budget total; rent: monthly budget + bedroom + move-in date + lease term + furnished pref)
  - `/api/leads` POST → insert `leads` row with `transaction_type` → send email to agent
  - Wallet check: if Phase 1 (no charge yet), just create lead
- **AC**: Form submits; correct intent captured; agent receives email + sees in dashboard
- **Status**: ⬜

---

## Week 15: SEO + Sitemap

### P1-T18: Dynamic sitemap
- **Owner**: C
- **Estimate**: 4h
- **Deliverables**: `/api/sitemap.xml` route, rewrites in `next.config.js`
- **AC**: Sitemap has 5000+ project URLs + agent URLs + khao_luan URLs; submitted to GSC
- **Status**: ⬜

### P1-T19: Schema.org structured data
- **Owner**: C
- **Estimate**: 4h
- **Deliverables**: JSON-LD in project + agent pages
- **AC**: Google Rich Results test passes
- **Status**: ⬜

### P1-T20: Khảo luận cron 3x/day
- **Owner**: C
- **Estimate**: 10h
- **Dependencies**: P1-T18
- **Deliverables**:
  - `/api/cron/khao-luan` route (Vercel cron)
  - AI Claude generate 1200-2000 word articles
  - Tags + auto-link to projects/agents
  - Insert `khao_luan` table
- **AC**: Cron fires 3x/day; articles published; sitemap auto-updates
- **Status**: ⬜

---

## Week 16: Beta Launch

### P1-T21: Outreach 100-300 môi giới
- **Owner**: H
- **Estimate**: 40h
- **Deliverables**: Personal invites via Facebook/Zalo; onboarding video
- **AC**: 100+ môi giới signed up + KYC'd
- **Status**: ⬜

### P1-T22: Monitor + iterate
- **Owner**: H + C
- **Estimate**: ongoing
- **Deliverables**: Plausible analytics, Sentry, user feedback channel
- **AC**: Critical bugs fixed within 24h; UX iterates weekly
- **Status**: ⬜

### **🚩 Milestone M2 (End of Week 16)**
- ✅ Site live at custom domain
- ✅ 100+ verified agents (mix sale + rent specialty)
- ✅ All sections render on project hub (incl. rental price section)
- ✅ Search + filter functional (both sale + rent modes)
- ✅ Map toggle Mua/Bán ↔ Cho thuê working
- ✅ Khảo luận generating SEO content
- ✅ First 1000 organic visitors

---

# 💰 Phase 2: Monetize (Week 17-28)

## Week 17-19: Bidding System

### P2-T01: Bidding logic + DB functions
- **Owner**: C
- **Estimate**: 20h
- **Deliverables**:
  - `lib/bidding/auction.ts` — place bid, cancel bid, refund logic
  - **Supports both slot_type (sale + rent_long + rent_short)** — separate auctions
  - SQL function `resolve_bidding_slots(project_id, slot_type)` (already in schema)
  - Cron `/api/cron/resolve-bids` hourly — calls `resolve_all_bidding_slots` per project
  - Floor bid enforcement: sale=100k, rent_long=50k, rent_short=30k VND/week
- **AC**: Place bid each slot_type → wallet charged → slot rank assigned per type; cancel → refund proportional
- **Status**: ⬜

### P2-T02: Wallet topup PayPal + payOS
- **Owner**: C
- **Estimate**: 16h
- **Deliverables**:
  - `/api/wallet/topup` create payment
  - Webhooks PayPal + payOS update wallet balance
  - Dashboard "Nạp tiền" widget
- **AC**: Topup 500k VND → wallet balance updates; PayPal + payOS both work
- **Status**: ⬜

### P2-T03: Agent dashboard bid management
- **Owner**: C
- **Estimate**: 16h
- **Deliverables**:
  - `/dashboard/moi-gioi/bid` page
  - **Tabs split by slot_type**: 🏠 Sale bids | 🔑 Rent bids | 🏨 Short-term bids
  - Per specialty project per slot_type: current top 3 bids, "Bid now" form, your bid status
  - Bid history table filterable by slot_type
- **AC**: Agent can see + manage all bids across slot types in one place
- **Status**: ⬜

### P2-T03b: Lead pricing config per transaction type
- **Owner**: C
- **Estimate**: 4h
- **Dependencies**: P2-T03
- **Deliverables**:
  - Config table or constants for lead pricing (see SPEC §7.3 update)
  - Sale: 50k/200k/300k
  - Rent: 20k/80k/150k
  - Short-term: 30k flat
- **AC**: Correct charge applied based on lead.transaction_type
- **Status**: ⬜

## Week 20-21: Lead System

### P2-T04: Lead charge logic
- **Owner**: C
- **Estimate**: 8h
- **Dependencies**: P1-T17
- **Deliverables**: Update `/api/leads` to charge wallet ($3-15) when lead created
- **AC**: Lead created → wallet debited correctly per tier; 5 free leads/month respected
- **Status**: ⬜

### P2-T05: Lead inbox dashboard
- **Owner**: C
- **Estimate**: 8h
- **Deliverables**: `/dashboard/moi-gioi/leads` list, mark contacted, request refund button
- **AC**: Agent can manage leads; refund flow works
- **Status**: ⬜

### P2-T06: Lead fraud detection + refund
- **Owner**: C + A
- **Estimate**: 6h
- **Deliverables**: Manual review queue admin; auto-refund if user reports unreachable phone
- **AC**: < 5% lead fraud rate
- **Status**: ⬜

## Week 22-23: Premium Addons

### P2-T07: Verified maintenance subscription
- **Owner**: C
- **Estimate**: 8h
- **Deliverables**: $5/month auto-renew via PayPal Subscriptions API
- **AC**: Subscribe → badge persists; cancel → badge expires
- **Status**: ⬜

### P2-T08: Featured video addon
- **Owner**: C
- **Estimate**: 6h
- **Deliverables**: $10/month per project; embed YouTube/TikTok in agent specialty section
- **AC**: Featured video displays prominently in project hub
- **Status**: ⬜

### P2-T09: Boost article addon
- **Owner**: C
- **Estimate**: 8h
- **Deliverables**: Agent posts article → choose to boost → pay → article ranks top in project hub
- **AC**: Boosted articles render at top; SEO meta correct
- **Status**: ⬜

## Week 24-25: Sàn Dashboard

### P2-T10: Agency signup + admin approval
- **Owner**: C
- **Estimate**: 8h
- **Deliverables**: `/dang-ky/san` form, manual admin approval
- **AC**: Sàn can sign up; admin approves
- **Status**: ⬜

### P2-T11: Team management
- **Owner**: C
- **Estimate**: 10h
- **Deliverables**: Sàn dashboard, invite agents, assign roles, view team analytics
- **AC**: Sàn can add/remove agents; agents see sàn branding
- **Status**: ⬜

### P2-T12: Bulk billing
- **Owner**: C
- **Estimate**: 8h
- **Deliverables**: Sàn pays one bill for all agents under it; subscription tier "agency_pro"
- **AC**: Sàn pays $299/month → all agents under it get Pro features
- **Status**: ⬜

## Week 26-28: Outreach + Iterate

### P2-T13: Sales pitch deck + outreach
- **Owner**: H
- **Estimate**: 40h
- **Deliverables**: Pitch deck, 1-1 outreach 50 sàn potential leads
- **AC**: 5-10 sàn deals signed
- **Status**: ⬜

### P2-T14: Hire Admin (part-time)
- **Owner**: H
- **Estimate**: 20h hiring
- **Deliverables**: Hire Admin for KYC + support
- **AC**: Admin onboarded, handles queue daily
- **Status**: ⬜

### P2-T15: A/B test bidding floor + addon pricing
- **Owner**: C + H
- **Estimate**: ongoing
- **Deliverables**: Adjust prices based on conversion data
- **AC**: ARPU stable at $15-25
- **Status**: ⬜

### **🚩 Milestone M3 (End of Week 28)**
- ✅ Bidding live (cả sale + rent slot types)
- ✅ $3-5k MRR
- ✅ 200+ paying agents (cân bằng sale + rent specialty)
- ✅ 5+ sàn deals
- ✅ Lead fraud rate < 5%
- ✅ Rental data coverage top 1000 dự án

---

# 📈 Phase 3: Scale (Week 29-44)

## Week 29-32: Review System + Community + Rental Expansion

### P3-T01: User review form
- **Owner**: C
- **Estimate**: 8h
- **Deliverables**: Review modal on project page, verified resident toggle
- **AC**: Auth users can post review; rate limit 1/project/user
- **Status**: ⬜

### P3-T02: Aggregate rating cron
- **Owner**: C
- **Estimate**: 4h
- **Deliverables**: Hourly cron recalc `review_avg_rating`, `review_count`
- **AC**: Aggregates update accurately
- **Status**: ⬜

### P3-T03: AI pros/cons summary
- **Owner**: C
- **Estimate**: 6h
- **Deliverables**: Claude AI summarizes review texts into `review_pros_summary` / `review_cons_summary`
- **AC**: Summaries refresh weekly when new reviews; quality acceptable
- **Status**: ⬜

### P3-T04b: FSBO rental listings (chủ căn tự post)
- **Owner**: C
- **Estimate**: 20h
- **Dependencies**: P3-T01
- **Deliverables**:
  - `/dang-tin/cho-thue` form for landlord to post rental
  - Upload photos, set price, lease term, furniture status
  - Auto-link to project (search project name → confirm)
  - 1-2 listing free; subsequent $5/listing
  - Email lead capture
- **AC**: Landlord can post + manage own listings; published listings visible in project hub
- **Status**: ⬜

### P3-T04c: Expat marketing landing pages
- **Owner**: C + H
- **Estimate**: 12h
- **Dependencies**: rental data ready
- **Deliverables**:
  - `/expat/[district-slug]` English landing pages for top 10 expat districts (Q1, Q2, Q7, Thảo Điền, Phú Mỹ Hưng HCM; Tây Hồ, Mỹ Đình HN)
  - English content + currency toggle (VND ↔ USD)
  - SEO target: "apartment for rent Thao Dien", "expat housing Hanoi", etc
  - Auto-list rental projects filtered by `is_expat_friendly = true`
- **AC**: 10 English landing pages live; Google rank top 20 for target keywords within 3 months
- **Status**: ⬜

### P3-T04: Q&A board per project
- **Owner**: C
- **Estimate**: 10h
- **Deliverables**: User asks → agent/community answers; vote helpful
- **AC**: Q&A active on at least top 100 projects
- **Status**: ⬜

## Week 33-36: CĐT B2B

### P3-T05: Developer dashboard
- **Owner**: C
- **Estimate**: 16h
- **Deliverables**: `/dashboard/cdt` — manage sponsored projects, post announcements
- **AC**: CĐT can self-manage; admin approval gate first time
- **Status**: ⬜

### P3-T06: Sponsored project hub
- **Owner**: C
- **Estimate**: 12h
- **Deliverables**: Branded banner, hero CTAs, sponsored content blocks within project hub
- **AC**: Sponsored projects visually differentiate; disclosure label "Sponsored" present
- **Status**: ⬜

### P3-T07: B2B sales outreach 10 CĐT
- **Owner**: H
- **Estimate**: 60h
- **Deliverables**: 3-5 CĐT signed at $500-2000/month
- **AC**: At least 3 sponsored hubs live
- **Status**: ⬜

## Week 37-40: Mở Rộng Coverage

### P3-T08: Add Đà Nẵng, Bình Dương, Long An
- **Owner**: C + TD
- **Estimate**: 80h (40 dev + 40 TD)
- **Deliverables**: Master data + verified data for 500+ projects in new cities
- **AC**: Search results healthy in new cities
- **Status**: ⬜

### P3-T09: Biệt thự/Liền kề data model
- **Owner**: C
- **Estimate**: 16h
- **Deliverables**: Sub-table for villa units within project; different price-per-unit logic (not per-m²)
- **AC**: Villa projects show correctly differently from chung cư
- **Status**: ⬜

### P3-T10: Scale to 1500+ verified projects
- **Owner**: TD
- **Estimate**: ongoing
- **Deliverables**: Verified data layers for 1500+ projects nationwide
- **AC**: 30%+ of master DB at "verified" or "gold" quality
- **Status**: ⬜

## Week 41-44: Advanced AI

### P3-T11: Compare 2 projects side-by-side
- **Owner**: C
- **Estimate**: 12h
- **Deliverables**: `/so-sanh?p1=...&p2=...` route, AI-generated comparison
- **AC**: Comparison clear, includes recommendation
- **Status**: ⬜

### P3-T12: Buyer persona match
- **Owner**: C
- **Estimate**: 16h
- **Deliverables**: Input persona (gia đình trẻ / DINK / nhà đầu tư / expat) → recommend projects
- **AC**: Recommendations relevant to persona
- **Status**: ⬜

### P3-T13: News digest weekly
- **Owner**: C
- **Estimate**: 8h
- **Deliverables**: Saturday cron → AI digest top news of week per region → email subscribers
- **AC**: Newsletter active; open rate > 20%
- **Status**: ⬜

### P3-T14: Smart search natural language
- **Owner**: C
- **Estimate**: 12h
- **Deliverables**: Claude parses NL → filter params → execute search
- **AC**: "căn 2PN view hồ tầng cao Vinhomes dưới 5 tỷ" → correct results
- **Status**: ⬜

### **🚩 Milestone M4 (End of Week 44)**
- ✅ $20-30k MRR
- ✅ Multi-city coverage
- ✅ 3-5 CĐT sponsored deals
- ✅ Review community active
- ✅ Advanced AI features differentiating

---

# 🔧 Year 2 (deferred, sketch)

- **Q1**: Mobile app (React Native)
- **Q2**: Mortgage calculator + bank partnership
- **Q2**: **Short-term rental mode launch** — Airbnb-style flow, host self-listing, booking calendar, instant book, 3-5% fee per booking. Data partnership AirDNA ($30-100/month) hoặc scrape khi anti-bot cho phép.
- **Q3**: API public for 3rd party
- **Q3**: **Corporate housing B2B** — partnership với HR companies serving expat relocations
- **Q4**: Verified transactions program (real sale price submission)
- **Ongoing**: Expand to officetel, đất nền, biệt thự cho thuê (high-end villa rental)

---

# 📋 Weekly Henry Checklist

Every Monday:
- [ ] Review last week tasks completed (status update)
- [ ] Identify blockers (mark 🔴)
- [ ] Brief team data on new asks
- [ ] Plan this week's deployment schedule
- [ ] Check Plausible analytics + Sentry errors
- [ ] Review revenue dashboard (Phase 2+)
- [ ] Outreach: 5 new contact targets (môi giới / sàn / CĐT)

Every Friday:
- [ ] Deploy to Vercel any pending changes
- [ ] Backup Supabase (auto, verify)
- [ ] Sync workplan status with reality
- [ ] Plan next week with Claude

---

# 🚧 Cross-cutting Tasks (ongoing)

| Task | Owner | Cadence |
|---|---|---|
| Bug fixes critical | H + C | as needed, < 24h |
| Scraper maintenance (sale + rental, anti-bot adapt) | C | weekly |
| Rental data refresh cron | C | daily auto |
| Rental demand_score recalculation | C | weekly cron |
| Google Maps cost monitoring | H | weekly review billing |
| Khảo luận content quality check (mix sale + rent topics) | TD | sample 5/week |
| KYC backlog management | A | daily Phase 2+ |
| User feedback triage | H + A | weekly |
| Tax + legal compliance | H | monthly |
| Security audit (API keys, RLS) | C + H | quarterly |

---

**End of Workplan v1.0 — 2026-05-15**
**Next review**: End of Week 8 (Milestone M1)
