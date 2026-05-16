# ChonDuAn — Design Spec

> Source of truth cho toàn bộ UI. Mọi component phải follow file này.
> Derived từ mockup "3 Sample Giao Diện" + "Map Search Layouts".

---

## 1. Brand & Colors

| Token | Hex | Dùng cho |
|---|---|---|
| `--blue-primary` | `#1565FF` | CTA button, active state, link, pin selected, badge |
| `--blue-dark` | `#0D1B3D` | Heading text, nav text |
| `--blue-light` | `#3D8BFF` | Hover, secondary accent |
| `--bg-page` | `#F5F7FA` | Page background |
| `--bg-card` | `#FFFFFF` | Card, panel, sidebar background |
| `--border` | `#E2E8F0` | Border mọi nơi |
| `--text-secondary` | `#64748B` | Sub-label, meta, placeholder |
| `--text-muted` | `#94A3B8` | Icon inactive, hint text |
| `--green-badge` | `#22C55E` | Badge "Đang mở bán" |
| `--score-high` | `#1565FF` | Điểm ≥ 8.5 |
| `--score-mid` | `#F59E0B` | Điểm 7–8.4 |

**Font:** Poppins — Bold (700) cho H1/H2, SemiBold (600) cho card title, Medium (500) cho button/label, Regular (400) cho body, Light (300) cho caption.

---

## 2. Layout Grid

- Max width content: `1280px`, centered, `px-6` (desktop) / `px-4` (mobile)
- Nav height: `64px` fixed top
- Sidebar filter width: `240px` (desktop), full-width bottom sheet (mobile)
- Map page: full viewport height minus nav (`h-[calc(100vh-64px)]`)
- Right detail panel (map): `360px` fixed right

---

## 3. Navigation

### 3.1 Homepage Nav (marketing)
```
[Logo]  Dự án  Khu vực  Chủ đầu tư  Tin tức  Bảng giá  Hướng dẫn    [Đăng nhập]  [Đăng ký]
```
- Logo: building icon (blue `#1565FF`) + **ChonDuAn** bold + tagline nhỏ "chọn dự án tốt nhất"
- Nav links: font-medium, `text-[#0D1B3D]`, hover `text-[#1565FF]`
- **Đăng nhập**: ghost button (text only, `text-[#64748B]`)
- **Đăng ký**: filled blue `bg-[#1565FF] text-white px-4 py-2 rounded-lg`
- Border bottom `border-[#E2E8F0]`, `bg-white/95 backdrop-blur`

### 3.2 Map/App Nav (functional)
```
[Logo]     [Search bar — full width centered]     [Vị trí của tôi]  [♥ Yêu thích]  [≡]
```
- Search bar chiếm `flex-1 max-w-2xl`, border rounded-xl, icon kính lúp trái
- "Vị trí của tôi": icon pin + text, outline button
- Icons phải: heart + hamburger menu

### 3.3 Filter Chips Bar (Split View / Mobile map)
```
[TP. Thủ Đức ▼]  [Chung cư ▼]  [40–80 tỷ ▼]  [Tiện ích ▼]  [Chủ đầu tư ▼]  [Bộ lọc]
```
- Mỗi chip: `border border-[#E2E8F0] rounded-full px-3 py-1.5 text-sm bg-white`
- Active chip: `bg-[#1565FF] text-white border-[#1565FF]`
- Chip cuối "Bộ lọc": có icon sliders, luôn visible

---

## 4. Homepage (Landing Page)

### 4.1 Hero Section
- **Layout**: 2 cột — text trái (55%) + ảnh tòa nhà phải (45%), full-width có background gradient nhạt
- **H1**: 
  ```
  Chọn dự án tốt nhất,        ← color: #0D1B3D
  đúng nhu cầu của bạn        ← color: #1565FF
  ```
  Font-size: `text-5xl` (desktop) / `text-3xl` (mobile), font-bold
- **Sub**: `text-lg text-[#64748B]`, max-width 480px
- **Search Card** (floating, shadow-lg, rounded-2xl, bg-white):
  ```
  | 📍 Khu vực ▼ | 🏠 Loại hình ▼ | 💰 Ngân sách ▼ | [🔍 Tìm dự án] |
  ```
  - 3 dropdown fields + 1 CTA button trong 1 row
  - Divider `|` giữa các field
  - Button: `bg-[#1565FF] text-white rounded-xl px-6 py-3`

### 4.2 Value Props (4 items, dưới search card)
```
[icon] Phân tích dữ liệu chuyên sâu
[icon] Gợi ý dự án phù hợp  
[icon] Kết nối môi giới uy tín
[icon] Hoàn toàn miễn phí
```
- Layout: 4 cột, icon nhỏ màu blue, text `text-sm text-[#64748B]`

### 4.3 Dự án nổi bật
- Header: **"Dự án nổi bật"** (H2) + link "Xem tất cả →" right-aligned
- Horizontal scroll carousel với prev/next arrow buttons
- **Project Card** (trong carousel):
  - Thumbnail (ratio 4:3, rounded-xl, overflow-hidden)
  - Badge "Nổi bật" absolute top-left: `bg-[#1565FF] text-white text-xs px-2 py-0.5 rounded-full`
  - Name: font-semibold `text-[#0D1B3D]`
  - Location: `📍 text-xs text-[#64748B]`
  - Price: `text-[#1565FF] font-bold` — "Giá từ 56 triệu/m²"
  - Tags: `text-xs bg-[#EFF6FF] text-[#1565FF] rounded-full px-2 py-0.5`

### 4.4 Quy trình 4 bước
- 4 steps ngang với arrow `→` giữa
- Mỗi step: icon circle (outline blue) + số thứ tự + title + description nhỏ
  1. Nhập nhu cầu
  2. Hệ thống phân tích
  3. Gợi ý dự án phù hợp
  4. Kết nối chuyên gia

---

## 5. Trang Danh Sách Dự Án (`/du-an` hoặc filter page)

### 5.1 Layout
```
[Top bar: Bộ lọc | Xóa bộ lọc | Search | Sắp xếp ▼]
[Sidebar 240px] | [Main content — "Tìm thấy 128 dự án phù hợp" + cards]
```

### 5.2 Sidebar Bộ Lọc
- Header: **"Bộ lọc"** + link "Xóa bộ lọc" (text-sm, text-blue)
- Sections (collapsible, chevron icon):
  - **Khu vực**: checkbox list (TP. Thủ Đức, Quận 1, Quận 2, Quận 7, Bình Thạnh) + "Xem thêm"
  - **Loại hình**: checkbox list (Căn hộ, Nhà phố, Biệt thự, Shophouse)
  - **Khoảng giá**: dual range slider, label "1 tỷ — 50+ tỷ"
  - **Chủ đầu tư**: search input + dropdown
- Divider `border-b border-[#E2E8F0]` giữa các section

### 5.3 Project Card (List View — horizontal)
```
[Thumbnail 200x140] | [Info block] | [Score block]
```
- **Thumbnail**: rounded-xl, ratio fixed, object-cover
- **Info block**:
  - Name: `font-semibold text-[#0D1B3D]` + verified badge ✓ (nếu có)
  - Location: `📍 text-xs text-[#64748B]`
  - Meta badges: type + status + year (`text-xs rounded-full`)
    - "Đang mở bán": `bg-[#DCFCE7] text-[#16A34A]`
    - Type: `bg-[#EFF6FF] text-[#1565FF]`
  - Price: "Giá từ **56 triệu/m²**" — value in bold blue
  - Tags: max 3 tags, `text-xs bg-[#F1F5F9] text-[#64748B] rounded-full`
- **Score block** (right-aligned):
  - Score: `text-2xl font-bold text-[#1565FF]` + `/10`
  - Label: "Điểm phù hợp" `text-xs text-[#94A3B8]`
  - Link: "Xem chi tiết →" `text-sm text-[#1565FF]`
- Card: `bg-white rounded-2xl border border-[#E2E8F0] p-4 hover:shadow-md transition`
- ♥ icon top-right (save/wishlist)

---

## 6. Trang Chi Tiết Dự Án (`/du-an/[province]/[slug]`)

### 6.1 Layout
```
Breadcrumb: Trang chủ > Dự án > Masteri Centre Point

[Gallery 60%] | [Sidebar card 40%]

[Project Info + Tabs]
```

### 6.2 Image Gallery
- Main image: full-width, height ~400px, rounded-2xl, object-cover
- Row thumbnails dưới: 2 ảnh nhỏ + badge **"+18 hình ảnh"** (overlay tối) trên ảnh cuối
- Click mở lightbox

### 6.3 Sidebar Card (sticky, theo scroll)
```
┌─────────────────────────────┐
│  Điểm phù hợp               │
│  ████ 9.2/10                │
│  [Radar chart 5 trục]       │
│  Vị trí • Tiện ích • Giá bán│
│  Pháp lý • (thêm trục)      │
├─────────────────────────────┤
│  Giá bán      Từ 56 tr/m²   │
│  [Nhận thông tin chi tiết]  │
├─────────────────────────────┤
│  Kết nối chuyên viên tư vấn │
│  [Avatar] Nguyễn Hoàng Nam  │
│  Chuyên viên tư vấn BĐS     │
│  ⭐⭐⭐⭐ (126 đánh giá)     │
│  [Gọi ngay][Nhắn Zalo][Chat]│
└─────────────────────────────┘
```
- Card: `bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-sm`
- Score: `text-4xl font-bold text-[#1565FF]`
- Radar chart: 5 trục — Vị trí, Tiện ích, Giá bán, Pháp lý, + 1 trục tùy theo mode
- CTA button: full-width, `bg-[#1565FF] text-white rounded-xl py-3 font-semibold`
- Agent buttons: 3 nút ngang — [Gọi ngay] [Nhắn Zalo] [Chat ngay], icon + text

### 6.4 Project Info (dưới gallery)
- **Name**: `text-2xl font-bold text-[#0D1B3D]` + ✓ verified badge (blue circle)
- **Location**: `📍 Quận 9, TP. Thủ Đức` text-sm
- **Meta badges**: Căn hộ cao cấp | Đang mở bán | Bàn giao: Q4/2025

### 6.5 Tabs Navigation
```
[Tổng quan] [Vị trí] [Mặt bằng] [Tiện ích] [Chủ đầu tư] [Tiến độ] [Đánh giá]
```
- Tab active: `border-b-2 border-[#1565FF] text-[#1565FF] font-medium`
- Tab inactive: `text-[#64748B] hover:text-[#0D1B3D]`
- Sticky khi scroll xuống (below nav)

---

## 7. Map UI

### 7.1 Layout (Full Map — Sample 01)
```
[Nav bar]
[Filter Panel 240px] | [Google Map — flex-1] | [Result List 320px]
```

### 7.2 Filter Panel (Map)
- Slide-in từ trái, có thể collapse
- Các field: dropdown style (không phải checkbox như list page)
- Button CTA cuối panel: **"Xem 128 dự án"** — full-width blue

### 7.3 Map Controls
- **"Tìm kiếm trong khu vực này"** button: floating top-center của map, `bg-white border rounded-full px-4 py-2 shadow-md text-sm`
- Zoom +/−: bottom-right
- "Layers" button: bottom-right, icon + text, `bg-white border rounded-lg`
- Locate me: bottom-right, circle icon button

### 7.4 Map Pins
- **Default pin**: nhỏ, tròn, màu theo tier (xanh/vàng/cam/đỏ), hiển thị giá ngắn "45tr"
- **Hover/Active pin**: card nổi lên — thumbnail nhỏ + tên dự án + giá, `bg-white rounded-xl shadow-lg border border-[#1565FF]`
- **Cluster pin**: circle xanh với số (`bg-[#1565FF] text-white font-bold rounded-full`)

### 7.5 Result List Panel (Map)
- Header: "128 dự án tìm thấy" + sort dropdown
- Cards dọc, compact hơn list page:
  - Thumbnail `80x80` rounded-lg
  - Name (1 dòng, truncate)
  - Location + tags
  - Price bold blue
  - ♥ icon
- Hover card → highlight pin tương ứng trên map

### 7.6 Detail Panel (Map — Sample 03)
- Slide-in từ phải, width `360px`, replace result list
- X button đóng về result list
- Image gallery nhỏ (main + "+18 ảnh" badge)
- Name + verified + location + tags
- Price + stars
- Tabs: Tổng quan | Vị trí | Tiện ích | Mặt bằng | Chủ đầu tư
- Footer actions: [♥ Yêu thích] [⚖ So sánh] [Nhận thông tin — blue]

### 7.7 Left Icon Toolbar (Map compact mode)
Vertical toolbar: icon-only, `bg-white border rounded-xl shadow`
- Bộ lọc (sliders icon)
- Tiện ích (star icon)
- Khu vực (map icon)
- Vị trí (pin icon)

---

## 8. Components Tái Sử Dụng

### Badge / Tag
```tsx
// Type badge (blue)
<span className="text-xs bg-[#EFF6FF] text-[#1565FF] px-2 py-0.5 rounded-full font-medium">
  Căn hộ
</span>

// Status badge (green)
<span className="text-xs bg-[#DCFCE7] text-[#16A34A] px-2 py-0.5 rounded-full font-medium">
  Đang mở bán
</span>

// Neutral tag
<span className="text-xs bg-[#F1F5F9] text-[#64748B] px-2 py-0.5 rounded-full">
  Vị trí đẹp
</span>
```

### Score Display
```tsx
<div className="flex items-baseline gap-1">
  <span className="text-2xl font-bold text-[#1565FF]">9.2</span>
  <span className="text-sm text-[#94A3B8]">/10</span>
</div>
<p className="text-xs text-[#94A3B8]">Điểm phù hợp</p>
```

### CTA Button (Primary)
```tsx
<button className="bg-[#1565FF] text-white font-semibold rounded-xl px-6 py-3 hover:bg-[#0D4FCC] transition-colors">
  Tìm dự án
</button>
```

### Card Base
```tsx
<div className="bg-white rounded-2xl border border-[#E2E8F0] hover:shadow-md transition-shadow">
```

### Verified Badge
```tsx
<span className="inline-flex items-center justify-center w-5 h-5 bg-[#1565FF] text-white rounded-full text-xs">✓</span>
```

### Price Display
```tsx
<p className="text-sm text-[#64748B]">Giá từ</p>
<p className="text-lg font-bold text-[#1565FF]">56 triệu/m²</p>
```

---

## 9. Spacing & Radius

| Token | Value | Dùng cho |
|---|---|---|
| Card radius | `rounded-2xl` (16px) | Card, panel, sidebar |
| Button radius | `rounded-xl` (12px) | Button, input |
| Badge radius | `rounded-full` | Tag, badge, chip |
| Pin radius | `rounded-xl` | Map pin card |
| Section gap | `gap-6` (24px) | Giữa các section |
| Card padding | `p-4` hoặc `p-6` | Tùy card size |
| Page padding | `px-6 py-8` | Desktop |

---

## 10. Responsive Breakpoints

| Breakpoint | Behavior |
|---|---|
| `< 768px` (mobile) | Filter → bottom sheet; Map full-screen; List → bottom scroll panel; Detail → full-screen modal |
| `768–1024px` (tablet) | Filter panel collapsible; Split view có thể toggle |
| `≥ 1024px` (desktop) | Full 3-panel layout; Sidebar fixed left; Detail panel fixed right |

---

## 11. Page-Specific Notes

### Homepage
- Hero background: gradient `from-[#F0F5FF] to-[#F5F7FA]` hoặc dùng ảnh building mờ
- Section "Dự án nổi bật" background: `bg-white`
- Section "Quy trình" background: `bg-[#F5F7FA]`

### Map Page (hiện tại — Sprint S04)
- **Không có** landing page sections — full map ngay từ đầu
- Nav thu gọn (functional style)
- Bottom sheet thay cho sidebar trên mobile

### List Page
- URL: `/du-an?khu-vuc=ho-chi-minh&loai=chung-cu`
- Server-side filter + sort
- Pagination hoặc infinite scroll

### Detail Page
- URL: `/du-an/[province]/[slug]`
- Sidebar sticky với `position: sticky; top: 80px`
- Tabs sticky below nav khi scroll

---

## 12. Icon Set

Dùng inline SVG hoặc Lucide React. Các icon chính:
- 🔍 Search: `Search`
- 📍 Location: `MapPin`
- 🏠 Property type: `Building2`
- 💰 Price: `Banknote`
- ⭐ Rating: `Star`
- ♥ Wishlist: `Heart`
- ✓ Verified: custom circle
- 📞 Call: `Phone`
- 💬 Chat: `MessageCircle`
- 🗺️ Map layers: `Layers`
- 🎯 Locate: `Crosshair`
- ⚖ Compare: `Scale`
- 📊 Chart: `BarChart2`
