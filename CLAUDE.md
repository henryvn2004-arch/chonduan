# Nhà Bản Đồ — CLAUDE.md

## Dự án là gì

**Chọn Dự Án** — Map-first search platform cho bất động sản dự án Việt Nam.
- End-user (free): tìm dự án trên map theo 3 modes, xem project hub 17 nhóm data, kết nối môi giới
- Seller (paid): môi giới bid top slot (sale + rent riêng biệt), pay-per-lead, sàn/CĐT subscription
- Tagline: "Chọn dự án tốt nhất"
- Owner: Henry (`henryvn2004-arch`)

## Tech Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js App Router (TypeScript) |
| Hosting | Vercel Pro |
| Database | Supabase Postgres + pgvector (project riêng, KHÔNG reuse tuvi) |
| Auth | Supabase Auth (Google + Facebook + email) |
| Maps | Google Maps Platform (Maps JS + Static Maps + Places + Geocoding) |
| AI | Claude API — fetch native, KHÔNG dùng SDK |
| Embeddings | OpenAI `text-embedding-3-small` 1024d |
| TTS | Vbee |
| Payments | PayPal + payOS |
| Scraper | Python + Playwright + Railway (service riêng) |
| Styling | Tailwind CSS + shadcn/ui |

## Transaction Modes

3 modes, toggle trên homepage + persist trong URL `?mode=`:

| Mode | Param | Đơn vị giá | Pin label | Target user |
|---|---|---|---|---|
| 🏠 Mua/Bán | `sale` | tr/m² | `45tr/m² ↑` | Người mua ở + nhà đầu tư |
| 🔑 Cho thuê dài hạn | `rent_long` | tr/tháng | `25tr/tháng` (2BR) | Expat, gia đình relocate |
| 🏨 Cho thuê ngắn hạn | `rent_short` | tr/đêm | `1.5tr/đêm` | Phase 2 |

**Mode ảnh hưởng tới toàn bộ app**: pin label, pin color, filter sidebar, bottom sheet content, project hub giá section, agent cụm, lead form fields, bidding slot type.

## Brand

- **Primary Blue**: `#1565FF` — CTA, logo, accent
- **Dark Blue**: `#0D1B3D` — text chính
- **Light Blue**: `#3D8BFF` — hover, secondary
- **Background**: `#F5F7FA`
- **Font**: Poppins (Bold H1, Medium H2, Regular body, Light caption)
- Logo: tòa nhà high-rise + wordmark "ChonDuAn" (brand name TBD)
- Pin sale: màu theo tier 🟢/🟡/🟠/🔴
- Pin rent: màu theo `rent_demand_score` (đậm = nóng)

## File Structure (Next.js App Router)

```
app/
├── (public)/           # Homepage map, project hub, agent profile, search
├── (auth)/             # Đăng nhập, đăng ký môi giới + KYC
├── dashboard/
│   ├── moi-gioi/       # Agent: bid, leads, wallet, analytics
│   ├── san/            # Agency dashboard
│   └── admin/          # KYC queue, data quality, user management
├── api/
│   ├── search/         # Semantic + filter search (mode-aware: ?mode=sale|rent_long)
│   ├── projects/
│   ├── agents/
│   ├── leads/          # Create lead, charge wallet (pricing per transaction_type)
│   ├── bid/            # place/cancel — slot_type required
│   ├── wallet/
│   ├── ai/             # FAQ, summary, audio (Vbee)
│   ├── gmaps/          # Cached Places/Nearby/Geocode proxy
│   ├── webhook/        # PayPal + payOS
│   ├── cron/           # refresh-prices, refresh-rentals, refresh-news, khao-luan, refresh-gmaps
│   └── sitemap.xml/
├── components/
│   ├── map/            # HomeMap (mode toggle), PinCluster, PinMarker, BottomSheet, Filters
│   ├── project/        # ProjectHub, PriceChart, RentalPriceSection, RentalMarketChart, LegalSection, FengshuiSection...
│   ├── agent/          # AgentCard, AgentProfile (specialty tags), ContactForm (mode-aware)
│   └── dashboard/      # BidWidget (per slot_type), LeadInbox, WalletWidget
└── lib/
    ├── supabase/        # client.ts, server.ts, types.ts
    ├── gmaps/           # cache.ts — LUÔN check cache trước khi gọi API
    ├── claude/          # client.ts, prompts.ts — fetch native
    ├── fengshui/        # compat.ts — wrap bát trạch engine từ tuvi
    ├── bidding/         # auction.ts, refund.ts
    └── payments/        # paypal.ts, payos.ts
```

## Rules quan trọng

### Google Maps — Cost Engineering
- **LUÔN** check cache trước khi gọi bất kỳ Maps API nào
- `lat/lng`: cache vĩnh viễn; `place_id`: 365 ngày; Place details: 90 ngày; Nearby: 180 ngày
- Homepage dùng **Static Maps** (rẻ hơn 3.5x), chỉ load Maps JS khi user interact
- Session Token cho Autocomplete — bắt buộc
- Budget target Phase 1: < $100/tháng

### Claude API
- Gọi **fetch native**, không dùng Anthropic SDK
- Tất cả prompt → output JSON structured (không markdown)
- Haiku cho: FAQ, pros/cons, sentiment, news summary, duplicate detect
- Sonnet cho: description bulk, audio script, search semantic parsing, khảo luận
- Prompt caching cho các template lặp lại nhiều

### Database
- Schema đã có tại `schema.sql` — 30+ tables, RLS đã enable
- Key tables: `projects`, `project_rental_history`, `rental_listings`, `agents`, `agent_bids`, `wallets`, `leads`, `khao_luan`
- `projects.published = false` cho đến khi data đủ chất lượng
- `data_quality` enum: `auto` → `ai_filled` → `verified` → `gold`
- pgvector: `embedding_description vector(1024)` trên projects, cosine similarity
- `agent_bids.slot_type` enum: `sale` | `rent_long` | `rent_short` — **mỗi loại là auction riêng biệt**
- `agents.specialty_types agent_specialty_type[]` — agent có thể chuyên nhiều loại
- `leads.transaction_type` — quyết định pricing và form fields

### Bidding — Dual Slot System
- Mỗi dự án có **6 slot top** = 3 sale + 3 rent (Phase 1 chỉ cần sale + rent_long)
- Floor bid: sale=100k VND/tuần, rent_long=50k, rent_short=30k
- Function DB: `resolve_bidding_slots(project_id, slot_type)` — gọi riêng per type
- `resolve_all_bidding_slots(project_id)` — wrapper gọi cả 3
- Cron hourly gọi `resolve_all_bidding_slots` cho toàn bộ projects có active bids

### Lead Pricing (per transaction_type)
- Sale verified: 200k · anonymous: 50k · premium (>5 tỷ): 300k VND
- Rent verified: 80k · anonymous: 20k · premium (>50tr/tháng): 150k VND
- Short-term: 30k flat
- 5 free leads/tháng per agent (count across all types)

### Phong thủy
- Port logic Bát Trạch từ tuviminhbao engine vào `lib/fengshui/compat.ts`
- `compatible_can_chi[]` và `incompatible_can_chi[]` đã có trong schema
- Input: năm sinh user → tính can chi → filter projects hợp

### Authentication
- Admin gate: `user_type = 'admin'` trong `user_profiles`
- Agent gate: `kyc_status = 'approved'` trong `agents`
- RLS policies đã setup trong schema — luôn verify khi viết query server-side

### SEO
- URL: `/du-an/[province]/[slug]` — province trong URL là bắt buộc
- Schema.org `RealEstateListing` cho project pages
- Sitemap dynamic tại `/api/sitemap.xml`
- Khảo luận cron 3x/day, tags cố định (8 tags), 1200-2000 từ/bài

## Current Phase

**Phase 0 — Infrastructure Setup (Week 1-2)**

Tasks theo thứ tự ưu tiên:
1. P0-T01: GCP + Maps Platform APIs (Henry)
2. P0-T02: Supabase project init + run schema.sql (Henry)
3. P0-T03: Next.js scaffold + Vercel + env vars (Claude + Henry)
4. P0-T05: GitHub repo (Henry)
5. P0-T06: Railway scraper service (Claude + Henry)

**Blocked**: P0-T04 Domain (chờ brand name final)

Milestone M1 target: End of Week 8:
- 5000 projects in DB, top 500 AI-filled, top 100 verified
- **Top 500 dự án có rental data** (avg theo bedroom count)
- Rental history snapshot daily cron running

## Workplan Reference

Xem `WORKPLAN.md` cho full task list với estimate, dependencies, acceptance criteria.
Xem `PROJECT_SPEC.md` cho full spec 17 data groups, pricing model, user flows.
Xem `schema.sql` cho database schema đầy đủ.

## Conventions

- Component files: PascalCase (`HomeMap.tsx`)
- API routes: kebab-case (`/api/refresh-prices`)
- Database columns: snake_case
- Tiếng Việt cho UI copy, tiếng Anh cho code/comments
- Không mock database trong tests — dùng Supabase test project thật
- Không add feature ngoài scope task hiện tại
