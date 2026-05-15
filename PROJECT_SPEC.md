# 🗺️ Nhà Bản Đồ — Project Spec

**Codename**: Nhà Bản Đồ (rebrand sau)
**One-liner**: Search engine cho BĐS dự án Việt Nam, project-centric trên Google Maps, free cho end-user, payer là môi giới/sàn/CĐT.
**Owner**: Henry (`henryvn2004-arch`)
**Inspired infra**: tuviminhbao stack (Vercel + Supabase + Claude API + PayPal + Vbee)

---

## 1. Overview

### 1.1 Bài toán đang giải

- End user (người mua nhà) hiện phải lê la 5-7 nguồn: Batdongsan, Nhatot, Google Maps, FB group cư dân, Cafef, môi giới quen → mất time + thông tin không đồng nhất.
- Môi giới hiện đăng listing trên Batdongsan nhưng lead về kém, đang dồn sang FB Page + TikTok riêng → cần platform trung lập có **brand uy tín** để link tới.
- CĐT thiếu kênh sponsored project hub đúng nghĩa ở VN (Batdongsan có nhưng UX kém).

### 1.2 Sản phẩm là gì

Map-first search platform với 2 mặt và **3 transaction modes**:

**3 modes** (toggle trên homepage):
- 🏠 **Mua/Bán** (Sale) — đơn vị `tr/m²`, focus: gia đình mua ở thực + đầu tư dài hạn
- 🔑 **Cho thuê dài hạn** (Long-term rent, ≥ 6 tháng) — đơn vị `tr/tháng`, focus: expat, family relocate, người đi làm
- 🏨 **Cho thuê ngắn hạn** (Short-term rent, ≤ 3 tháng / Airbnb-style) — đơn vị `tr/đêm`, focus: business traveler, tourist (Phase 2)

**End-user side** (free): vào homepage thấy map VN với pin dự án (giống Shopee map UX). Click pin → project hub với 17 nhóm data (giá mua + giá thuê, pháp lý, quy hoạch, phong thủy, review cư dân, môi giới active tại dự án...). Click môi giới → profile page (avatar, social links, video tour, reviews, contact form).

**Seller side** (paid):
- Môi giới cá nhân: bid để top 3 mỗi dự án **per transaction type** (top 3 cho mua/bán + top 3 cho cho thuê — riêng biệt) + pay-per-lead
- Sàn môi giới: team page + bulk subscription
- CĐT: sponsored project hub (chủ yếu cho mua/bán sơ cấp)
- **Chủ căn FSBO** (Phase 2): tự post căn cho thuê — Airbnb-style listing nhưng project-centric

### 1.3 USP vs Batdongsan/Nhatot

| Aspect | Batdongsan | Nhà Bản Đồ |
|---|---|---|
| Trục chính | Listing | **Dự án** |
| UX | List view | **Map-first** |
| Data layers | Cơ bản | **17 nhóm**, có pháp lý + quy hoạch + occupation + phong thủy |
| Môi giới | Đăng listing | **PR profile + bidding ranking** |
| Phong thủy | Không có | **Có (leverage tuviminhbao engine)** |
| AI features | Không | Có (FAQ, sentiment, summary, smart search) |

---

## 2. Tech Stack (final)

| Layer | Tech | Notes |
|---|---|---|
| **Frontend** | Next.js App Router (TypeScript) | Reuse từ tuviminhbao stack |
| **Hosting** | Vercel Hobby | $0 đến traffic medium |
| **Database** | Supabase Postgres + pgvector | New project, separate từ tuvi |
| **Auth** | Supabase Auth | Social login (Google, FB) + email |
| **Maps** | **Google Maps Platform full stack** | Maps JS + Static Maps + Places + Geocoding |
| **AI** | Claude API (Sonnet + Haiku mix) | fetch native, không SDK |
| **Embeddings** | OpenAI `text-embedding-3-small` 1024d | Reuse pipeline tuvi |
| **TTS** | Vbee | Audio tour mỗi dự án |
| **Payments** | PayPal + payOS | payOS cho VN bank, PayPal cho cross-border |
| **Subscription** | Build trên top of PayPal Subscriptions API | Hoặc Stripe nếu sau cần |
| **Scraper** | Python + Playwright + Railway | Tách service, giống tuvi-mix-service |
| **Background jobs** | Vercel Cron | Khảo luận pattern |
| **Image storage** | Supabase Storage | Logo, gallery, banner |
| **Image processing** | Sharp (Next.js) + Replicate (optional) | Resize, WebP |
| **Analytics** | Plausible hoặc Umami self-host | Privacy-friendly |
| **Monitoring** | Sentry (free tier) | |

---

## 3. Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    END USER (free, no login required)         │
│  Homepage Map → Search → Project Hub → Agent Profile → Lead   │
└──────────────────────────────────────────────────────────────┘
                              ↕
┌──────────────────────────────────────────────────────────────┐
│              Next.js (Vercel) — public pages + API            │
│  /                  Homepage map                              │
│  /du-an/[slug]      Project hub                               │
│  /moi-gioi/[slug]   Agent profile                             │
│  /san/[slug]        Agency page                               │
│  /cdt/[slug]        Developer page                            │
│  /tim-kiem          Search/filter results                     │
│  /api/...           Backend routes                            │
└──────────────────────────────────────────────────────────────┘
        ↕               ↕               ↕               ↕
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Supabase    │ │ Google Maps  │ │ Claude API   │ │ Scraper svc  │
│  Postgres    │ │ Platform     │ │ + Vbee TTS   │ │ (Railway)    │
│  + Auth      │ │ (cached)     │ │              │ │              │
│  + Storage   │ │              │ │              │ │              │
│  + pgvector  │ │              │ │              │ │              │
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
        ↕
┌──────────────────────────────────────────────────────────────┐
│               SELLER SIDE (login + KYC required)              │
│  Agent Dashboard │ Agency Dashboard │ Developer Dashboard      │
│  - Edit profile  │ - Team mgmt      │ - Sponsored project mgmt │
│  - Bid slots     │ - Bulk billing   │ - Branded content        │
│  - Lead inbox    │ - Analytics      │ - Announcement publish   │
│  - Analytics     │                  │                          │
│  - Wallet/billing│                  │                          │
└──────────────────────────────────────────────────────────────┘
```

### 3.1 Service breakdown

1. **Next.js monolith** (Vercel): toàn bộ frontend + API routes
2. **Scraper service** (Python, Railway): scrape Batdongsan/Cafef/Nhatot daily + news + FB group reviews
3. **Cron service** (Vercel Cron): khảo luận auto-generate, refresh price history, refresh Google cache quarterly
4. **AI service** (in API routes): Claude calls với prompt templates
5. **Background queue** (Supabase Edge Functions): heavy tasks như embed dự án mới, AI generate FAQ

### 3.2 Data flow ví dụ

**User search "Vinhomes Ocean Park"**:
1. Frontend gọi `/api/search?q=...&filters=...`
2. API: pgvector semantic search trên `projects.embedding_description` + full-text fallback
3. Results merged + ranked → return JSON
4. Frontend render pin trên map + list

**User click pin Vinhomes Ocean Park**:
1. Navigate `/du-an/vinhomes-ocean-park`
2. SSR: query `projects` join `developers`, `project_prices_history` (latest), `project_nearby_amenities` (cached), `agent_specialty_projects` (top 3 bidders + 7 random)
3. Render full hub page
4. Client-side: load JS Maps API for interactive zoom

**User click "Liên hệ" trên agent profile**:
1. Modal: form name/phone/email/message
2. Submit → `/api/leads` create lead, deduct agent wallet ($3-15 theo tier)
3. Notify agent: email + dashboard inbox
4. User redirect: "Đã gửi yêu cầu, môi giới sẽ liên hệ trong 24h"

---

## 4. Data Model (17 nhóm)

> Markers: 🔍 Searchable/Filterable · 📋 Informational · 🎨 Media · ⭐ Phase 1 must-have

### Nhóm 1: Core Identity ⭐

| Field | Type | Marker | Source |
|---|---|---|---|
| id | uuid PK | - | auto |
| slug | text unique | 🔍 | auto from name+location |
| name_official | text | 🔍 | scrape + manual |
| name_aliases | text[] | 🔍 | manual |
| province | enum (63 tỉnh) | 🔍 | scrape + Google |
| district | text | 🔍 | scrape + Google |
| ward | text | 🔍 | Google |
| address_full | text | 📋 | Google |
| lat | numeric(10,7) | 🔍 (map bounds) | Google |
| lng | numeric(10,7) | 🔍 (map bounds) | Google |
| google_place_id | text | 📋 | Google |
| created_at | timestamptz | - | auto |
| updated_at | timestamptz | - | auto |
| data_quality | enum (auto / ai_filled / verified / gold) | - | system |

### Nhóm 2: Developer ⭐

| Field | Type | Marker | Source |
|---|---|---|---|
| developer_id | uuid FK → developers | 🔍 | manual |
| co_developers | uuid[] FK | 🔍 | manual |
| operator_bql | text | 📋 | manual |
| designer | text | 📋 | manual |
| contractor | text | 📋 | manual |

**Table `developers`** riêng: id, name, logo_url, website, description, projects_count.

### Nhóm 3: Project Basics ⭐

| Field | Type | Marker | Source |
|---|---|---|---|
| property_type | enum (chung_cu / biet_thu / lien_ke / shophouse / dat_nen / officetel / condotel) | 🔍 | manual |
| tier | enum (binh_dan / trung_cap / cao_cap / hang_sang) | 🔍 | ai + manual |
| status | enum (sap_mo_ban / dang_mo_ban / dang_xay / da_ban_giao / da_ban_giao_lau) | 🔍 | manual |
| year_start | int2 | 🔍 | scrape |
| year_handover | int2 | 🔍 | scrape + manual |
| total_land_ha | numeric(8,2) | 📋 | manual |
| building_density_pct | numeric(5,2) | 📋 | manual |
| green_density_pct | numeric(5,2) | 📋 | manual |
| total_towers | int2 | 🔍 | manual |
| total_units | int4 | 🔍 | manual |
| total_investment_billion | numeric(12,2) | 📋 | scrape + manual |
| description_short | text | 📋 | ai-filled |
| description_long | text | 📋 | ai-filled |

### Nhóm 4: Pricing ⭐ (refresh daily)

| Field | Type | Marker | Source |
|---|---|---|---|
| price_primary_per_m2_min | int4 (VND) | 🔍 | scrape + manual |
| price_primary_per_m2_max | int4 | 🔍 | scrape + manual |
| price_secondary_per_m2_avg | int4 | 🔍 | scrape Batdongsan |
| price_trend | enum (up / down / flat) | 🔍 | calculated |
| price_trend_pct_6m | numeric(5,2) | 📋 | calculated |
| rent_per_m2_avg | int4 | 🔍 | scrape |
| rental_yield_pct | numeric(5,2) | 🔍 | calculated |

**Table `project_prices_history`** riêng: project_id, date, price_per_m2_avg, listing_count.

### Nhóm 4b: Rental Market ⭐ (refresh daily, KEY for cho thuê mode)

| Field | Type | Marker | Source |
|---|---|---|---|
| rent_studio_avg_monthly_vnd | int4 | 🔍 | scrape |
| rent_1br_avg_monthly_vnd | int4 | 🔍 | scrape |
| rent_2br_avg_monthly_vnd | int4 | 🔍 | scrape |
| rent_3br_avg_monthly_vnd | int4 | 🔍 | scrape |
| rent_penthouse_avg_monthly_vnd | int4 | 📋 | scrape |
| rent_furnished_premium_pct | numeric(5,2) | 📋 | calculated |
| rent_listings_active_count | int4 | 🔍 (sort) | scrape |
| rent_demand_score | int2 (1-10) | 🔍 | calculated from listing velocity |
| rent_trend | enum (up/down/flat) | 🔍 | calculated |
| rent_avg_lease_term_months | int2 | 📋 | scrape |
| short_term_avg_per_night_vnd | int4 | 🔍 | scrape Airbnb (Phase 2) |
| short_term_occupancy_pct | numeric(5,2) | 📋 | scrape (Phase 2) |
| is_expat_friendly | boolean | 🔍 | calculated (% expat + English signage + intl school nearby) |
| expat_concentration_score | int2 (1-10) | 🔍 | calculated |

**Table `project_rental_history`** riêng: project_id, date, avg_rent_2br, avg_rent_3br, listings_count.

**Table `project_rental_segments`** riêng (Phase 2): chia rental theo segment expat / local / corporate.

### Nhóm 5: Pháp lý ⭐ (gold layer)

| Field | Type | Marker | Source |
|---|---|---|---|
| land_origin_type | enum (dat_o / dat_thuong_mai / dat_chuyen_doi / khac) | 🔍 | manual |
| red_book_status | enum (da_cap / chua_cap / dang_lam / vuong_mac) | 🔍 | manual |
| ownership_term | enum (lau_dai / 50_nam / 70_nam / khac) | 🔍 | manual |
| construction_permit_no | text | 📋 | manual |
| investment_approval_no | text | 📋 | manual |
| legal_issues_text | text | 📋 | manual + ai |
| legal_score | int2 (1-10) | 🔍 | ai calculated |
| legal_last_verified | date | 📋 | system |

### Nhóm 6: Tiện ích nội khu ⭐

Boolean fields (🔍 all):
- `has_pool` (+ `pool_type` enum: indoor/outdoor/both/null)
- `has_gym`
- `has_tennis_court`
- `has_basketball_court`
- `has_kid_playground`
- `has_kindergarten`
- `has_school_primary`
- `has_school_secondary`
- `has_school_international`
- `has_mall_internal`
- `has_supermarket_internal`
- `has_cafe_restaurant`
- `has_bbq_area`
- `has_clubhouse`
- `has_library`
- `has_park_garden`
- `has_24h_security`
- `has_smart_home`
- `has_ev_charging`

### Nhóm 7: Surrounding Amenities ⭐ (auto từ Google Places, cache 180d)

| Field | Type | Marker | Source |
|---|---|---|---|
| nearest_metro_m | int4 | 🔍 | Google |
| nearest_metro_name | text | 📋 | Google |
| nearest_public_school_m | int4 | 🔍 | Google |
| nearest_international_school_m | int4 | 🔍 | Google |
| nearest_hospital_m | int4 | 🔍 | Google |
| nearest_mall_m | int4 | 🔍 | Google |
| nearest_supermarket_m | int4 | 🔍 | Google |
| distance_to_cbd_km | numeric(6,2) | 🔍 | Google + calc |
| distance_to_airport_km | numeric(6,2) | 📋 | Google + calc |

**Table `project_nearby_amenities`** riêng: project_id, category (school/hospital/mall/...), name, distance_m, place_id, lat, lng, rating, last_refreshed.

### Nhóm 8: Ban quản lý ⭐

| Field | Type | Marker | Source |
|---|---|---|---|
| service_fee_per_m2_vnd | int4 | 🔍 | manual |
| parking_motorbike_monthly | int4 | 📋 | manual |
| parking_car_monthly | int4 | 📋 | manual |
| water_fee_unit | int4 | 📋 | manual |
| bql_name | text | 📋 | manual |
| bql_rating | numeric(3,2) | 🔍 | manual + review aggregate |

### Nhóm 9: Demographic + Cư dân (Phase 2)

- `occupation_rate_pct` 🔍
- `resident_vs_investor_ratio` 🔍
- `expat_pct` 🔍
- `avg_age_bracket` enum (20-29 / 30-39 / 40-49 / 50+) 🔍
- `income_bracket` enum (mid / high / premium / luxury) 🔍
- `demographic_notes` 📋

### Nhóm 10: Risk Indicators ⭐

| Field | Type | Marker | Source |
|---|---|---|---|
| flood_risk_level | int2 (0-3) | 🔍 | manual + news |
| tide_risk_level | int2 (0-3) — HCM only | 🔍 | manual |
| air_pollution_score | int2 (0-100) | 🔍 | manual + AQI API |
| noise_level | enum (quiet / moderate / noisy) | 🔍 | manual |
| drama_history | jsonb (timeline events) | 📋 | manual + news |

### Nhóm 11: Triển vọng ⭐

| Field | Type | Marker | Source |
|---|---|---|---|
| upcoming_infrastructure | jsonb | 📋 | manual + news |
| competing_projects_nearby | uuid[] FK | 📋 | calc |
| investment_score | int2 (1-10) | 🔍 | ai calculated |
| outlook_text | text | 📋 | ai generated |

### Nhóm 12: Media ⭐

| Field | Type | Marker | Source |
|---|---|---|---|
| logo_url | text | 🎨 | manual |
| banner_url | text | 🎨 | manual |
| gallery_urls | text[] | 🎨 | manual (20-50 ảnh) |
| video_tour_url | text | 🎨 | manual |
| panorama_360_url | text | 🎨 | manual (Phase 2) |
| floor_plan_url | text | 🎨 | manual |
| master_plan_url | text | 🎨 | manual |

### Nhóm 13: Phong thủy ⭐ (leverage tuviminhbao engine)

| Field | Type | Marker | Source |
|---|---|---|---|
| main_direction | enum (8 hướng) | 🔍 | manual |
| towers_directions | jsonb (per tower) | 📋 | manual |
| compatible_can_chi | text[] | 🔍 | **engine** |
| incompatible_can_chi | text[] | 🔍 | **engine** |
| fengshui_notes | text | 📋 | ai + manual |

Engine call: `getCompatibleAges(main_direction)` từ tuviminhbao bát trạch logic.

### Nhóm 14: Reviews (Phase 2)

- Table `project_reviews`: id, project_id, user_id, rating (1-5), pros_text, cons_text, verified_resident (bool), created_at, helpful_count
- Aggregate fields trên `projects`:
  - `review_count` 🔍
  - `review_avg_rating` 🔍
  - `review_pros_summary` (ai-generated từ reviews)
  - `review_cons_summary` (ai-generated)

### Nhóm 15: Môi giới Active ⭐ (relational)

- Table `agent_specialty_projects`: agent_id, project_id, primary_specialty (bool)
- Table `agent_bids`: agent_id, project_id, bid_amount_weekly_vnd, slot_rank (1/2/3/null), starts_at, ends_at, status
- Query `top_3_agents(project_id)`: order by bid_amount DESC LIMIT 3 + rating filter

### Nhóm 16: News + AI Content ⭐

- Table `project_news`: id, project_id, source, url, title, published_at, summary_ai
- Trên `projects`:
  - `ai_faq` jsonb (Q&A pairs)
  - `ai_overview` text
  - `ai_pros_cons` jsonb
  - `ai_audio_url` text (Vbee TTS)
  - `ai_last_generated` timestamptz

### Nhóm 17: Search Vectors ⭐

| Field | Type | Purpose |
|---|---|---|
| embedding_description | vector(1024) | Semantic search |
| search_keywords | tsvector | Full-text search (Vietnamese with `simple` config + custom stem) |
| search_phonetic | text | "vinhom" matches "vinhomes" |

**Index**:
- ivfflat trên `embedding_description`
- GIN trên `search_keywords`
- B-tree trên `province`, `district`, `property_type`, `tier`, `price_secondary_per_m2_avg`, `lat`, `lng`

---

## 5. User Flows

### 5.1 End User — Tìm dự án

```
[Landing /]
   ↓ (auto-detect location → zoom to HCM/HN)
   ↓ (auto-detect intent: default = Mua/Bán, expat IP → Cho thuê)
[Top bar toggle: 🏠 Mua/Bán | 🔑 Cho thuê | 🏨 Ngắn hạn (Phase 2)]
[Map full screen với 200-500 pin clusters]
   - Pin label thay đổi theo mode:
     • Mua/Bán:  "45tr/m² ↑"
     • Cho thuê: "25tr/th ↑"
     • Ngắn hạn: "1.5tr/đêm"
   - Pin color theo mode:
     • Mua/Bán: theo tier giá (xanh/vàng/cam/đỏ)
     • Cho thuê: theo rent_demand_score (đậm = nóng)
   ↓ user pan/zoom
[Load pin dynamically theo viewport bounds + transaction mode filter]
   ↓ click pin
[Bottom sheet mobile / Side panel desktop]
   - Hiển thị data tương ứng mode:
     • Mua/Bán: giá/m², range tổng, xu hướng
     • Cho thuê: giá 1BR/2BR/3BR/tháng, demand score, furnished premium
   ↓ click "Xem chi tiết"
[/du-an/vinhomes-ocean-park?mode=rent]
   - Hero: banner + name + breadcrumb
   - Section 1: Map mini với surrounding amenities
   - Section 2: Tổng quan (CĐT, năm BG, số tòa/căn, tier)
   - Section 3: **Giá** (toggle Mua / Cho thuê inline)
     • Mua: giá/m² + lịch sử 24m + range theo bedroom
     • Cho thuê: giá/tháng theo bedroom + furnished premium + demand score
   - Section 4: Pháp lý + score
   - Section 5: Tiện ích nội khu (grid icons)
   - Section 6: Quy hoạch xung quanh (timeline)
   - Section 7: Phong thủy zone (input tuổi → check hợp)
   - Section 8: Review cư dân (rating + pros/cons summary)
   - Section 9: Risk indicators
   - Section 10: Triển vọng + investment score
   - Section 11: News timeline
   - Section 12: AI FAQ + audio tour
   - Section 13: **Môi giới active** — 2 cụm riêng:
       • Top 3 môi giới Mua/Bán (bidding sale slot)
       • Top 3 môi giới Cho thuê (bidding rental slot)
   - Section 14: Dự án tương tự gần đây
   ↓ click agent
[/moi-gioi/nguyen-van-a]
   - Avatar + bio + verified badge + stats
   - Specialty tags: 🏠 Mua/Bán · 🔑 Cho thuê · 🏨 Ngắn hạn (which they handle)
   - Specialty projects (3-5)
   - Social links (FB/TikTok/YouTube/Zalo)
   - Embed video tour
   - Reviews + rating
   - Q&A board
   - "Liên hệ" button → form lead capture
```

### 5.2 Môi giới — Onboarding

```
[/dang-ky/moi-gioi]
   ↓
[Step 1: Email + password + phone]
   ↓
[Step 2: KYC upload]
   - Ảnh CMT/CCCD mặt trước + sau
   - Selfie cầm CMT
   - Chứng chỉ môi giới (Bộ XD cấp, optional Phase 1)
   ↓ submit → status: pending
[Email confirm + chờ admin duyệt 24-48h]
   ↓ admin approve
[Step 3: Tạo profile]
   - Avatar, bio, năm kinh nghiệm
   - Chọn dự án chuyên (max 5)
   - Social links
   - Languages
   ↓ publish
[Profile live, free tier active]
   ↓
[Dashboard]
   - Bid slots (5 dự án chuyên, mỗi cái thấy bid hiện tại + nút "tham gia bid")
   - Wallet (nạp tiền + lịch sử)
   - Lead inbox (5 free lead/tháng)
   - Analytics (profile views, contact clicks, lead conversion)
   - Premium addons (verified maintenance, featured video, boost article)
```

### 5.3 CĐT — Sales-led onboarding

(Phase 2, B2B sales 1-1)

- Contact form `/cdt/dang-ky` → admin contact
- Demo + contract
- CĐT dashboard: edit project hub, post announcement, manage sponsored content, analytics

---

## 6. UX Design

### 6.1 Homepage layout (mobile-first)

```
┌─────────────────────────────────┐
│ [Logo] [Search ▾]  [☰ Menu]      │ ← Sticky top, 60px
├─────────────────────────────────┤
│ 📍 Đang xem: TP.HCM ▾            │ ← Location bar, 40px
├─────────────────────────────────┤
│                                 │
│                                 │
│         [MAP fullscreen]        │ ← Map area
│      🔴 🟠 🟡  🟢               │
│       cluster → individual      │
│                                 │
│                                 │
├─────────────────────────────────┤
│ [⚙ Lọc 3]   [📋 Danh sách]      │ ← Bottom action bar, 50px
└─────────────────────────────────┘
```

### 6.2 Pin design

- **Mascot/favicon custom** (icon đặc trưng, không dùng pin Google default)
- **Color theo tier giá** (clearly differentiable cho colorblind):
  - 🟢 Green: bình dân (< 30tr/m²)
  - 🟡 Yellow: trung cấp (30-60tr/m²)
  - 🟠 Orange: cao cấp (60-100tr/m²)
  - 🔴 Red: hạng sang (> 100tr/m²)
- **Label trên pin**: `45tr ↑` (giá/m² + arrow trend)
- **Size theo zoom**:
  - Zoom < 10: cluster với count "23"
  - Zoom 10-13: medium pin với label giá
  - Zoom > 13: large pin với label đầy đủ + sparkline mini
- **Hover/tap**: glow + bump animation
- **Active**: pulse animation

### 6.3 Bottom sheet on pin tap (mobile)

```
┌─────────────────────────────────┐
│ ─── (drag handle) ───            │
│ [banner 16:9]                   │
│ Vinhomes Ocean Park    ⭐ 4.5    │
│ Gia Lâm, Hà Nội                 │
│                                 │
│ 💰 45tr/m² ↑ +5% / 6m           │
│ 🏢 Chung cư · Cao cấp           │
│ 📜 Sổ hồng đã cấp ✓             │
│ 👥 87% lấp đầy                  │
│ 🏗 Vinhomes · Bàn giao 2020     │
│                                 │
│ [Xem chi tiết →]    [📌 Lưu]    │
└─────────────────────────────────┘
```

### 6.4 Filter sidebar (cascade theo transaction mode)

**Shared filters** (cả Mua/Bán + Cho thuê):
1. Loại BĐS multi-select
2. Tỉnh/Thành (default user location)
3. Quận/Huyện (cascade)
4. CĐT (top 20 + search "khác")
5. Trạng thái (đã bàn giao only / mới mở bán only / all)
6. Pháp lý (sổ hồng đã cấp ✓)
7. Hợp tuổi (input năm sinh → backend filter `compatible_can_chi`)
8. Khoảng cách CBD slider
9. Tiện ích must-have (multi-check: pool, gym, school, mall)

**Mua/Bán mode — additional filters**:
10. Giá range slider (theo /m² hoặc tổng)
11. Investment score min
12. Rental yield min (cho nhà đầu tư mua-cho thuê)

**Cho thuê mode — additional filters**:
10. Giá thuê/tháng range slider
11. Số phòng ngủ (Studio / 1BR / 2BR / 3BR / 4BR+)
12. Furnished status (đầy đủ / 1 phần / không)
13. Lease term (linh hoạt / 6 tháng / 12 tháng+)
14. Pet allowed
15. Expat-friendly (international school nearby + English support)
16. Khoảng cách trường quốc tế (cho expat family)

**Phase 2 filters**:
- Demographic, occupation rate
- Risk indicators
- Khoảng cách metro/trường/BV
- Short-term mode: số đêm, occupancy rate, instant book

**Phase 2 filters**:
- Demographic, occupation rate
- Risk indicators
- Khoảng cách metro/trường/BV

### 6.5 Project hub layout (`/du-an/[slug]`)

Sticky tabs navigate quick:
`Tổng quan | Giá | Pháp lý | Tiện ích | Quy hoạch | Phong thủy | Review | Risk | Triển vọng | News | Hỏi đáp | Môi giới`

Mỗi tab anchor scroll xuống section tương ứng. Section streaming render (giống tuviminhbao) — content lazy load nếu cần.

### 6.6 Agent profile layout (`/moi-gioi/[slug]`)

```
┌─────────────────────────────────┐
│ [Avatar 120px]  Nguyễn Văn A ✓   │
│                Trùm Vinhomes OP  │
│                ⭐ 4.8 (32 review)│
│                📞 [Liên hệ]      │
├─────────────────────────────────┤
│ 📊 5 năm KN · 87 deal · MB+English│
├─────────────────────────────────┤
│ 🏢 Chuyên: VH Ocean Park, VH SM  │
│ 🔗 [FB] [TikTok] [YouTube] [IG]  │
├─────────────────────────────────┤
│ Bio:                            │
│ [long text]                     │
├─────────────────────────────────┤
│ Video tour Vinhomes Ocean Park: │
│ [embed YouTube/TikTok]          │
├─────────────────────────────────┤
│ Reviews từ buyer:               │
│ ⭐⭐⭐⭐⭐ - "Anh A rất nhiệt..." │
│ [load more]                     │
├─────────────────────────────────┤
│ Q&A board                       │
└─────────────────────────────────┘
```

---

## 7. Pricing & Bidding (5-layer)

### 7.1 Layer 1: Free Base Profile (KYC verified)

- Profile cơ bản hiển thị trong project page
- Random order, cap 10 môi giới hiển thị/dự án
- Contact info: hiển thị nhưng user phải fill quick form (capture lead)
- Mục tiêu: maximize supply

### 7.2 Layer 2: Bidding Top 3 Slot (paid) — **2 slot types riêng biệt**

**Mechanism**:
- Mỗi dự án có **6 slot top** chia 2 loại:
  - 🏠 **Sale slot** × 3 — môi giới chuyên mua/bán
  - 🔑 **Rent slot** × 3 — môi giới chuyên cho thuê
- Auction model: highest bid wins (per slot type)
- Pay-per-week, bid theo tuần
- **Floor bid khác nhau** (cho thuê commission thấp hơn nên bid thấp hơn):
  - Sale slot floor: **100k VND/tuần** (~$4)
  - Rent slot floor: **50k VND/tuần** (~$2)
- Bid được auto-deduct từ agent wallet
- Refund proportional nếu rớt slot trong tuần
- Agent có thể bid **cả 2 loại slot** trên cùng 1 dự án (nếu chuyên cả 2)

**Display rules**:
- Section 13 project hub chia **2 cụm rõ ràng**:
  - Cụm "🏠 Môi giới Mua/Bán" — top 3 sale + 4 random sale specialty
  - Cụm "🔑 Môi giới Cho thuê" — top 3 rent + 4 random rent specialty
- Slot 1: "Trùm" + lớn nhất + glow
- Slot 2-3: medium / standard

**Anti-abuse** (apply cả 2 loại slot):
- Quality gate: bid cao nhưng rating < 3.5 → mất slot
- Spend cap: max 5tr VND/tuần/dự án/cá nhân per slot type
- Slot 3 reserved cho "rising star" rotation nếu < 2 bids

### 7.3 Layer 3: Pay-per-Lead — **giá khác nhau theo mode**

- User fill contact form trên agent profile → lead generated → charge agent wallet
- Tier giá cho **mua/bán** (deal size lớn):
  - **Verified** (user verify email + phone): 200k VND
  - **Anonymous**: 50k VND
  - **Premium project** (>5 tỷ): 300k VND
- Tier giá cho **cho thuê** (commission thấp ~ 1 tháng tiền thuê):
  - **Verified**: 80k VND
  - **Anonymous**: 20k VND
  - **Premium rent** (>50tr/tháng): 150k VND
- Tier giá cho **ngắn hạn** (Phase 2): 30k VND/lead
- 5 lead/tháng free cho mỗi verified agent (count across mode)
- Pay-as-you-go từ wallet
- **Refund nếu lead fake** (user verify post-hoc fail)

### 7.4 Layer 4: Premium Addons

| Addon | Giá/tháng | Mô tả |
|---|---|---|
| Verified maintenance | 100k VND | Giữ verified badge (one-time KYC + monthly fee) |
| Featured video tour | 200k VND/dự án | Embed YouTube/TikTok video tour trong project hub |
| Boost article | 300k VND/article | Article của agent rank cao trong project hub SEO |
| Priority response badge | 100k VND | Badge "Trả lời < 1h" |

### 7.5 Layer 5: Sàn + CĐT (B2B)

**Sàn môi giới**:
- $99-499/tháng theo size team
- Team page với branded color/logo
- Bulk billing cho agents trong sàn
- Centralized analytics
- Lead routing rules

**CĐT (Phase 2)**:
- $500-3000/tháng/dự án
- Sponsored project hub (banner, featured content)
- Verified developer page (official channel)
- News announcement publish
- Lead funnel độc quyền (tách khỏi agent bidding)
- Analytics dashboard

### 7.6 ARPU estimate

Realistic mix sau 12-18 tháng (1000 môi giới active):
- 70% free tier: $0
- 20% Layer 2-3 active: $30-60/tháng
- 10% Layer 2-4 aggressive: $150-300/tháng

**Sale vs Rent agent split** (expected):
- Mua/Bán agents: ~60% of paid base, ARPU $25-35/tháng (higher commission per deal)
- Cho thuê agents: ~30% of paid base, ARPU $10-15/tháng (lower commission, smaller bids)
- Both modes (dual specialist): ~10% of paid base, ARPU $40-60/tháng

ARPU mix overall: ~$15-25/môi giới/tháng.
- 1000 agents = $15-25k MRR
- 50 sàn deals = thêm $10-15k MRR
- 10 CĐT deals = thêm $5-15k MRR (mostly sale-focused)

Year 1 target trajectory: $30-50k MRR cuối năm.

**Rental upside (Phase 2-3)**:
- Short-term rental segment (Airbnb-style) → host can self-list with fee 3-5% per booking
- Corporate housing partnership → high-margin B2B

---

## 8. AI Integration (Claude API)

### 8.1 Use cases

| Use case | Model | Frequency | Cost estimate |
|---|---|---|---|
| Auto-fill project description (initial bulk) | Sonnet | One-time 5000 dự án | $200 |
| Generate FAQ per project | Haiku | Quarterly | $50/quarter |
| Generate pros/cons summary | Haiku | Quarterly | $30/quarter |
| Sentiment analysis reviews | Haiku | Daily incremental | $20/month |
| Smart search semantic parsing | Sonnet | Per query | depends on volume |
| News summarization | Haiku | Daily | $30/month |
| Audio script generation (for Vbee) | Sonnet | Quarterly per project | $40/quarter |
| Khảo luận auto-generate (SEO blog) | Sonnet | 3x/day cron | $100/month |
| Detect duplicate/fake listings | Haiku | Per listing ingest | $30/month |

**Total AI budget**: ~$400-500/tháng ổn định.

### 8.2 Prompt patterns

Tất cả prompt → output JSON structured để parse safely:

```typescript
// /api/ai/generate-faq?project_id=...
const prompt = `
Bạn là chuyên gia BĐS VN. Dựa trên dữ liệu dự án ${name} dưới đây, 
sinh ra 10 câu hỏi-trả lời phổ biến mà người mua sẽ hỏi.

Dữ liệu:
${JSON.stringify(projectData)}

Output JSON theo schema:
{
  "faq": [
    {"q": "...", "a": "...", "category": "phap_ly|gia|tien_ich|..."},
    ...
  ]
}

Trả lời thuần JSON, không markdown.
`;
```

### 8.3 RAG integration

- Embed mỗi dự án description vào `projects.embedding_description`
- Khi user search → embed query → cosine similarity → top 20 → re-rank by filters → return
- Phase 2: embed reviews + news → richer semantic search

---

## 9. Google Maps Cost Engineering

### 9.1 Budget target

- Phase 1 (10-30k MAU): < $100/tháng
- Phase 2 (50-100k MAU): < $300/tháng
- Phase 3 (200k+ MAU): < $600/tháng

### 9.2 Tactics

1. **Static Maps cho homepage** (cluster pins zoom out) — $2/1k thay vì $7/1k
2. **JS API chỉ khi user interact** — zoom in, click pin, project hub map
3. **Cache aggressive**:
   - `lat/lng`: vĩnh viễn
   - `place_id`: 365 ngày
   - Place details: 90 ngày
   - Nearby amenities: 180 ngày
   - Tile bitmap: self-host CDN cho HN/HCM viewport phổ biến
4. **Lazy load**: defer Maps JS load đến scroll/interact
5. **Session Token cho Autocomplete**: tiết kiệm 10x
6. **API key restrictions**:
   - Referer: chỉ `tuviminhbao.com` (hoặc domain final) + `localhost` dev
   - Daily quota cap
7. **Maps Embed API (free)** cho share link nhỏ

### 9.3 Tables cache trên Supabase

- `gmaps_places_cache`: place_id, raw_response jsonb, fetched_at, expires_at
- `gmaps_nearby_cache`: origin_lat, origin_lng, radius_m, category, results jsonb, fetched_at, expires_at
- `gmaps_geocoding_cache`: address_hash, lat, lng, formatted_address, fetched_at

---

## 10. SEO Strategy

### 10.1 URL structure

```
/                                     Homepage
/du-an/[province]/[slug]              Project hub
/moi-gioi/[slug]                      Agent profile
/san/[slug]                           Agency page
/cdt/[slug]                           Developer page
/tim-kiem?q=...&...                   Search results
/khu-vuc/[province]                   Province hub
/khu-vuc/[province]/[district]        District hub
/khao-luan/[slug]                     SEO blog auto-generated
/tin-tuc/[slug]                       News
/loai/[property_type]                 Property type hub
```

### 10.2 Cron khảo luận

Reuse pattern từ tuviminhbao. 3x/day, tags fixed:
- `phap-ly-bds`
- `quy-hoach`
- `dau-tu-bds`
- `du-an-moi`
- `phong-thuy-nha-o`
- `gia-thi-truong`
- `review-du-an`
- `huong-dan-mua-nha`

AI generate 1200-2000 từ/bài. Auto-internal-link tới project hubs + agent profiles relevant.

### 10.3 Sitemap

Dynamic route `/api/sitemap.xml`:
- All projects (5000)
- All agents verified (~1000-2000)
- All agencies + developers
- All khảo luận posts
- Province/district hubs
- Total: 10-20k URLs

Submit Google Search Console + Bing Webmaster.

### 10.4 Schema.org structured data

- `RealEstateListing` schema cho project pages
- `Person` schema cho agent
- `Organization` schema cho agency + developer
- `BreadcrumbList` site-wide
- `LocalBusiness` cho agency physical office (Phase 2)

---

## 11. Verification System

### 11.1 Agent KYC (Phase 1: manual)

Required:
- Mặt trước + sau CMT/CCCD
- Selfie cầm CMT
- Số điện thoại verify OTP
- Email verify
- Optional: chứng chỉ môi giới Bộ Xây dựng

Admin approve:
- 24-48h SLA
- Reject reason gửi email
- Dashboard admin có queue + bulk actions

### 11.2 Verified badge tier

- **Unverified** (default sau signup, chưa KYC)
- **Verified** (KYC pass) → ✓ badge
- **Pro Verified** (Verified + có chứng chỉ + > 12 tháng activity) → ⭐ badge
- **Elite** (top 10 môi giới/dự án, rating > 4.5, > 50 leads) → 💎 badge

### 11.3 Anti-fraud

- Phone number unique constraint
- CMT number unique constraint (hash store)
- Face match selfie ↔ CMT (Phase 2 với AI vision)
- Cross-check Bộ XD công khai danh sách chứng chỉ
- User report → review queue
- Bid pattern anomaly detection
- Lead fraud detection (fake users, bots)

---

## 12. Data Sourcing Pipeline

### 12.1 Step 1: Master list từ Cafef + Batdongsan

Python scraper Railway:
```python
# scrape_project_list.py
# 1. Scrape cafef.vn/du-an chuyên mục → list ~3000 projects
# 2. Scrape batdongsan.com.vn/du-an → list ~5000 projects (có overlap)
# 3. Dedupe by name+location fuzzy match
# 4. Output: master_projects.csv
```

### 12.2 Step 2: AI dedupe + normalize

Claude API process master list:
- Detect duplicate aliases ("Vinhomes Ocean Park 1" vs "VinHomes Ocean Park")
- Normalize CĐT names
- Classify property_type, tier
- Output: cleaned_master.json

### 12.3 Step 3: Google Places enrichment

For each project:
```python
# 1. Query Google Places Text Search "{name} {district} {province}"
# 2. Pick best match (similarity > 0.7)
# 3. Get place_id, lat, lng, formatted_address
# 4. Insert into `projects` + cache `gmaps_places_cache`
```

### 12.4 Step 4: AI auto-fill description fields

Claude Sonnet bulk job (5000 projects):
- Generate `description_short` (50-80 từ)
- Generate `description_long` (300-500 từ)
- Generate `ai_overview`, `ai_pros_cons`, `ai_faq`
- Mark `data_quality = ai_filled`

### 12.5 Step 5: Team manual fill gold layers

Henry's offline team:
- Pháp lý (Nhóm 5)
- Quy hoạch (Nhóm 11 — upcoming_infrastructure)
- Risk indicators (Nhóm 10)
- Occupation rate (Nhóm 9 — Phase 2)
- Photos (Nhóm 12)
- Phong thủy (Nhóm 13 main_direction)

Workflow:
- Admin dashboard với list dự án sort by `data_quality`
- Form fill từng nhóm
- Save → `data_quality = verified` hoặc `gold`

### 12.6 Step 6: Daily refresh

- Scrape giá Batdongsan listings → update `price_secondary_per_m2_avg` + insert vào `project_prices_history`
- Scrape news → insert `project_news`
- AI summarize news mới
- Recalculate price_trend

### 12.7 Step 7: Quarterly refresh

- Refresh Google Places nearby amenities (cache 180d)
- Regenerate AI FAQ, pros/cons, audio
- Re-embed description nếu update lớn

---

## 13. File Structure (Next.js App Router)

```
app/
├── (public)/
│   ├── page.tsx                          # Homepage map
│   ├── du-an/
│   │   └── [province]/
│   │       └── [slug]/page.tsx           # Project hub
│   ├── moi-gioi/
│   │   └── [slug]/page.tsx               # Agent profile
│   ├── san/
│   │   └── [slug]/page.tsx               # Agency page
│   ├── cdt/
│   │   └── [slug]/page.tsx               # Developer page
│   ├── tim-kiem/page.tsx                 # Search results
│   ├── khu-vuc/
│   │   └── [...slug]/page.tsx            # Province/district hub
│   ├── khao-luan/
│   │   └── [slug]/page.tsx               # SEO blog
│   ├── gioi-thieu/page.tsx
│   ├── lien-he/page.tsx
│   └── chinh-sach/page.tsx
│
├── (auth)/
│   ├── dang-nhap/page.tsx
│   ├── dang-ky/
│   │   ├── moi-gioi/page.tsx             # Agent signup + KYC
│   │   └── nguoi-mua/page.tsx            # Buyer signup (optional, lưu wishlist)
│   └── quen-mat-khau/page.tsx
│
├── dashboard/
│   ├── moi-gioi/
│   │   ├── page.tsx                      # Agent dashboard home
│   │   ├── profile/page.tsx              # Edit profile
│   │   ├── bid/page.tsx                  # Bid management
│   │   ├── leads/page.tsx                # Lead inbox
│   │   ├── wallet/page.tsx               # Nạp tiền, lịch sử
│   │   ├── analytics/page.tsx
│   │   └── kyc/page.tsx
│   ├── san/                              # Agency dashboard
│   ├── cdt/                              # Developer dashboard (Phase 2)
│   └── admin/                            # Internal admin
│       ├── kyc-queue/page.tsx
│       ├── projects/page.tsx             # Project data management
│       ├── data-quality/page.tsx
│       └── users/page.tsx
│
├── api/
│   ├── search/route.ts                   # Semantic + filter search
│   ├── projects/
│   │   ├── route.ts                      # List/filter projects
│   │   └── [id]/route.ts                 # Get one
│   ├── agents/
│   │   ├── route.ts
│   │   └── [id]/route.ts
│   ├── leads/route.ts                    # Create lead, charge agent
│   ├── bid/
│   │   ├── place/route.ts                # Place bid
│   │   └── cancel/route.ts
│   ├── wallet/
│   │   ├── topup/route.ts                # PayPal/payOS topup
│   │   └── history/route.ts
│   ├── kyc/
│   │   ├── submit/route.ts
│   │   └── verify/route.ts               # Admin only
│   ├── reviews/route.ts                  # Post review
│   ├── ai/
│   │   ├── faq/route.ts                  # Generate FAQ
│   │   ├── summary/route.ts
│   │   └── audio/route.ts                # Vbee TTS
│   ├── gmaps/
│   │   ├── places/route.ts               # Cached Places API proxy
│   │   ├── nearby/route.ts               # Cached nearby
│   │   └── geocode/route.ts              # Cached geocode
│   ├── webhook/
│   │   ├── paypal/route.ts
│   │   └── payos/route.ts
│   ├── cron/
│   │   ├── refresh-prices/route.ts
│   │   ├── refresh-news/route.ts
│   │   ├── khao-luan/route.ts            # 3x/day SEO content
│   │   └── refresh-gmaps-cache/route.ts  # Quarterly
│   └── sitemap.xml/route.ts
│
├── components/
│   ├── map/
│   │   ├── HomeMap.tsx                   # Main map component
│   │   ├── PinCluster.tsx
│   │   ├── PinMarker.tsx
│   │   ├── ProjectBottomSheet.tsx
│   │   └── MapFilters.tsx
│   ├── project/
│   │   ├── ProjectHub.tsx
│   │   ├── PriceChart.tsx
│   │   ├── LegalSection.tsx
│   │   ├── AmenitiesGrid.tsx
│   │   ├── FengshuiSection.tsx           # Uses tuvi engine
│   │   ├── ReviewsSection.tsx
│   │   ├── AgentsList.tsx
│   │   └── AudioPlayer.tsx
│   ├── agent/
│   │   ├── AgentCard.tsx
│   │   ├── AgentProfile.tsx
│   │   ├── ContactForm.tsx
│   │   └── ReviewsList.tsx
│   ├── shared/
│   │   ├── Nav.tsx
│   │   ├── Footer.tsx
│   │   ├── SearchBox.tsx
│   │   └── LocationPicker.tsx
│   └── dashboard/
│       ├── BidWidget.tsx
│       ├── LeadInbox.tsx
│       └── WalletWidget.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── types.ts
│   ├── gmaps/
│   │   ├── cache.ts                      # Cache wrapper
│   │   ├── places.ts
│   │   ├── geocoding.ts
│   │   └── static-map.ts
│   ├── claude/
│   │   ├── client.ts
│   │   └── prompts.ts
│   ├── fengshui/
│   │   └── compat.ts                     # Wrap tuvi engine
│   ├── auth/
│   │   └── kyc.ts
│   ├── bidding/
│   │   ├── auction.ts
│   │   └── refund.ts
│   ├── payments/
│   │   ├── paypal.ts
│   │   └── payos.ts
│   └── utils/
│       ├── slug.ts
│       ├── price.ts
│       └── geo.ts
│
├── styles/
│   └── globals.css
│
└── public/
    ├── logo.svg
    ├── mascot-pin.svg                    # Custom pin
    ├── favicon.ico
    └── seal.webp
```

---

## 14. Phase Plan (52-week)

### Phase 0: Data Collection (Tuần 1-8)

**Tuần 1-2: Setup**
- GCP project + Maps Platform APIs + billing alerts
- Supabase project mới
- Vercel project mới
- Domain + DNS
- GitHub repo
- Railway scraper service
- Schema deploy (`schema.sql`)

**Tuần 3-4: Scraper master list**
- Python scrape Cafef + Batdongsan
- AI dedupe + normalize
- Output: 3000-5000 dự án master list

**Tuần 5-6: Google Places enrichment**
- Batch query Google Places API cho 5000 projects
- Cache vào `gmaps_places_cache`
- Insert lat/lng + address vào `projects`

**Tuần 7-8: AI auto-fill descriptions**
- Bulk Claude API generate descriptions cho 5000 projects
- Generate initial FAQ, pros/cons cho top 500
- Generate audio cho top 100
- Team mày bắt đầu manual fill gold layers cho top 100 projects

### Phase 1: MVP Launch (Tuần 9-16)

**Tuần 9-10: Homepage + Map**
- Next.js setup, components
- Google Maps integration với cache layer
- Pin clustering + viewport filtering
- Bottom sheet on tap

**Tuần 11-12: Project hub page**
- All 14 sections render
- Sticky tab navigation
- Phong thủy module (port tuvi engine)
- Audio player

**Tuần 13: Search + filter**
- pgvector semantic search
- 10 filters Phase 1
- Search results page

**Tuần 14: Agent profile + KYC**
- Signup flow + KYC manual queue
- Agent profile page
- Contact form lead capture

**Tuần 15: SEO + sitemap**
- Sitemap dynamic
- Schema.org structured data
- Khảo luận cron 3x/day

**Tuần 16: Beta launch**
- Mời 100-300 môi giới KYC free
- Soft launch domain
- Monitor analytics + Sentry
- Iterate UX

### Phase 2: Monetize (Tuần 17-28)

**Tuần 17-19: Bidding system**
- Bid table + auction logic
- Wallet topup PayPal + payOS
- Slot rank cron (daily refresh)
- Agent dashboard bid management

**Tuần 20-21: Lead system**
- Lead capture form (already from Phase 1)
- Pay-per-lead deduction
- Lead inbox dashboard
- Refund flow for fake leads

**Tuần 22-23: Premium addons**
- Verified maintenance subscription
- Featured video embed
- Boost article

**Tuần 24-25: Sàn dashboard**
- Team management
- Bulk billing
- Agency page

**Tuần 26-28: Outreach + iterate**
- Pitch 5-10 sàn deals
- Monitor MRR target $3-5k cuối Phase 2
- Iterate based on agent feedback

### Phase 3: Scale (Tuần 29-44)

**Tuần 29-32: Review system + community**
- User review form (verified resident)
- Aggregate rating
- AI pros/cons summary
- Q&A board

**Tuần 33-36: CĐT B2B**
- Developer dashboard
- Sponsored project hub
- Announcement publishing
- B2B sales 1-1 outreach

**Tuần 37-40: Mở rộng coverage**
- Mở Đà Nẵng, Bình Dương, Long An
- Bổ sung biệt thự/liền kề trong dự án
- Tăng số dự án full data → 1500+

**Tuần 41-44: Advanced AI features**
- Compare 2 dự án side-by-side
- Buyer persona match
- News digest weekly
- Smart search natural language

### Phase 4: Year 2

- Mobile app (React Native)
- API public cho 3rd party
- Mortgage calculator + bank partnership
- Verified transactions program (user submit giá thực → reward)
- Investment portfolio tracking
- Expand to officetel + đất nền phân lô

---

## 15. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Data quality kém ban đầu | High | High | Mark `data_quality` field, team fill từ từ, AI fallback |
| Google Maps cost balloon | Medium | High | Aggressive cache, Static Maps, quota alert |
| Chicken-egg môi giới-user | High | Critical | Free 6 tháng đầu seed supply, SEO traffic-first |
| Verification fake | Medium | High | Manual KYC Phase 1, AI face match Phase 2, public report |
| Batdongsan scraping bị block | Medium | Medium | Residential proxy rotation, fallback Cafef/Nhatot |
| Legal pháp lý disclaimer | Low | Medium | Rõ disclaimer "tham khảo", không phải định giá chính thức |
| Competition Batdongsan launch project-centric | Low | High | Move fast, build phong thủy + AI moat trước |
| Henry burnout | Medium | Critical | Phase 0-1 chỉ Henry + team data, hire dev junior Phase 2 |

---

## 16. Open Questions (Henry quyết sau)

- [ ] Tên brand cuối (Nhà Bản Đồ / RealMap VN / Map.house / khác)
- [ ] Domain final
- [ ] Logo + mascot design
- [ ] Pricing currency: VND only hay support USD (cho expat market)?
- [ ] App mobile native Year 2 hay PWA?
- [ ] Partnership ngân hàng (mortgage calc) Phase 3 hay Year 2?
- [ ] B2B sales person hire khi nào (Phase 2 cuối hay Phase 3 đầu)?

---

**End of spec. Version 1.0 — 2026-05-15**
