'use client'

import { useState, useCallback } from 'react'
import type { FilterState, Mode } from '@/types/maps'

// ─── Static option lists ────────────────────────────────────────────────────

const PROPERTY_TYPES = [
  { value: '',           label: 'Tất cả' },
  { value: 'chung_cu',   label: 'Chung cư' },
  { value: 'biet_thu',   label: 'Biệt thự' },
  { value: 'lien_ke',    label: 'Liền kề' },
  { value: 'shophouse',  label: 'Shophouse' },
  { value: 'dat_nen',    label: 'Đất nền' },
  { value: 'officetel',  label: 'Officetel' },
  { value: 'condotel',   label: 'Condotel' },
]

const TIERS = [
  { value: 'binh_dan',  label: 'Bình dân' },
  { value: 'trung_cap', label: 'Trung cấp' },
  { value: 'cao_cap',   label: 'Cao cấp' },
  { value: 'hang_sang', label: 'Hàng sang' },
]

const STATUSES = [
  { value: 'sap_mo_ban',      label: 'Sắp mở bán' },
  { value: 'dang_mo_ban',     label: 'Đang mở bán' },
  { value: 'dang_xay',        label: 'Đang xây' },
  { value: 'da_ban_giao',     label: 'Đã bàn giao' },
  { value: 'da_ban_giao_lau', label: 'Bàn giao lâu' },
]

const RED_BOOK = [
  { value: 'da_cap',   label: 'Đã có sổ' },
  { value: 'dang_lam', label: 'Đang làm' },
  { value: 'chua_cap', label: 'Chưa có' },
  { value: 'vuong_mac', label: 'Vướng mắc' },
]

const LAND_ORIGIN = [
  { value: 'dat_o',          label: 'Đất ở' },
  { value: 'dat_thuong_mai', label: 'TM-DV' },
  { value: 'dat_chuyen_doi', label: 'Chuyển đổi' },
  { value: 'khac',           label: 'Khác' },
]

const OWNERSHIP = [
  { value: 'lau_dai', label: 'Lâu dài' },
  { value: 'nam_70',  label: '70 năm' },
  { value: 'nam_50',  label: '50 năm' },
]

const LEGAL_SCORES = [
  { value: 6,  label: '≥ 6' },
  { value: 7,  label: '≥ 7' },
  { value: 8,  label: '≥ 8' },
  { value: 9,  label: '≥ 9' },
]

// Tiện ích nội khu (boolean)
const AMENITIES_INTERNAL = [
  { value: 'pool',        label: 'Hồ bơi' },
  { value: 'gym',         label: 'Gym' },
  { value: 'tennis',      label: 'Tennis' },
  { value: 'basketball',  label: 'Bóng rổ' },
  { value: 'kid_play',    label: 'Khu trẻ em' },
  { value: 'kindergarten',label: 'Mầm non' },
  { value: 'school_primary',   label: 'Tiểu học' },
  { value: 'school_secondary', label: 'THCS' },
  { value: 'school_intl',      label: 'Trường QT' },
  { value: 'mall_internal',    label: 'TTTM' },
  { value: 'supermarket',      label: 'Siêu thị' },
  { value: 'cafe',             label: 'Cafe/NHà hàng' },
  { value: 'bbq',              label: 'BBQ' },
  { value: 'clubhouse',        label: 'Clubhouse' },
  { value: 'library',          label: 'Thư viện' },
  { value: 'park',             label: 'Công viên' },
  { value: 'security_24h',     label: 'Bảo vệ 24/7' },
  { value: 'smart_home',       label: 'Smart home' },
  { value: 'ev_charging',      label: 'Sạc EV' },
]

// Tiện ích xung quanh ≤800m (~10 phút đi bộ)
const AMENITIES_NEARBY = [
  { value: 'nearby_metro',       label: 'Metro/MRT' },
  { value: 'nearby_intl_school', label: 'Trường QT' },
  { value: 'nearby_hospital',    label: 'Bệnh viện' },
  { value: 'nearby_mall',        label: 'Trung tâm TM' },
  { value: 'nearby_supermarket', label: 'Siêu thị' },
]

const FLOOD_RISK = [
  { value: 0, label: 'Không ngập' },
  { value: 1, label: 'Ngập thấp' },
  { value: 2, label: 'Ngập TB' },
]

const NOISE_LEVELS = [
  { value: 'quiet',    label: 'Yên tĩnh' },
  { value: 'moderate', label: 'Trung bình' },
  { value: 'noisy',    label: 'Ồn ào' },
]

const DIRECTIONS = [
  { value: 'dong',     label: 'Đ' },
  { value: 'tay',      label: 'T' },
  { value: 'nam',      label: 'N' },
  { value: 'bac',      label: 'B' },
  { value: 'dong_nam', label: 'ĐN' },
  { value: 'dong_bac', label: 'ĐB' },
  { value: 'tay_nam',  label: 'TN' },
  { value: 'tay_bac',  label: 'TB' },
]

const INVEST_SCORES = [
  { value: 6, label: '≥ 6' },
  { value: 7, label: '≥ 7' },
  { value: 8, label: '≥ 8' },
  { value: 9, label: '≥ 9' },
]

const RATING_OPTS = [
  { value: 3.5, label: '≥ 3.5★' },
  { value: 4,   label: '≥ 4★' },
  { value: 4.5, label: '≥ 4.5★' },
]

const RENT_DEMAND = [
  { value: 5, label: '≥ 5' },
  { value: 7, label: '≥ 7' },
  { value: 9, label: '≥ 9' },
]

const RENT_TRENDS = [
  { value: 'up',   label: 'Tăng ↑' },
  { value: 'flat', label: 'Ổn định' },
  { value: 'down', label: 'Giảm ↓' },
]

const HANDOVER_YEARS = [2024, 2025, 2026, 2027, 2028]

const PRICE_MAX_DEFAULT = 200

// ─── Sub-components ─────────────────────────────────────────────────────────

function FilterSection({
  title, icon, children, defaultOpen = false,
}: {
  title: string
  icon: React.ReactNode
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-[#F1F5F9] pb-3">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 text-[11px] font-semibold text-[#64748B] uppercase tracking-wide"
      >
        <span className="flex items-center gap-1.5">
          {icon}
          {title}
        </span>
        <svg
          className={`w-3 h-3 text-[#94A3B8] transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="space-y-2.5">{children}</div>}
    </div>
  )
}

function ChipGroup({
  options, value, onChange, cols = 2,
}: {
  options: { value: string | number; label: string }[]
  value: (string | number)[]
  onChange: (v: (string | number)[]) => void
  cols?: number
}) {
  function toggle(v: string | number) {
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v])
  }
  return (
    <div className={`grid gap-1`} style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => toggle(o.value)}
          className={`px-1.5 py-1 text-[11px] rounded-md border transition-colors text-center leading-tight ${
            value.includes(o.value)
              ? 'bg-[#1565FF] border-[#1565FF] text-white font-medium'
              : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#1565FF] hover:text-[#1565FF]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function SingleChip({
  options, value, onChange,
}: {
  options: { value: string | number; label: string }[]
  value: string | number | undefined
  onChange: (v: string | number | undefined) => void
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(value === o.value ? undefined : o.value)}
          className={`px-2 py-0.5 text-[11px] rounded-md border transition-colors ${
            value === o.value
              ? 'bg-[#1565FF] border-[#1565FF] text-white font-medium'
              : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#1565FF] hover:text-[#1565FF]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

function AmenityGrid({
  options, value, onChange,
}: {
  options: { value: string; label: string }[]
  value: string[]
  onChange: (v: string[]) => void
}) {
  function toggle(v: string) {
    onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v])
  }
  return (
    <div className="grid grid-cols-2 gap-x-2 gap-y-1.5">
      {options.map(o => (
        <label key={o.value} className="flex items-center gap-1.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={value.includes(o.value)}
            onChange={() => toggle(o.value)}
            className="w-3 h-3 rounded border-[#CBD5E0] accent-[#1565FF] shrink-0"
          />
          <span className="text-[11px] text-[#374151] truncate group-hover:text-[#1565FF] transition-colors">
            {o.label}
          </span>
        </label>
      ))}
    </div>
  )
}

// ─── Icon helpers ────────────────────────────────────────────────────────────

const IconBasic = () => (
  <svg className="w-3 h-3 text-[#1565FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M3 8h18M3 12h18M3 16h10" />
  </svg>
)
const IconLegal = () => (
  <svg className="w-3 h-3 text-[#1565FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)
const IconAmenity = () => (
  <svg className="w-3 h-3 text-[#1565FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
)
const IconRisk = () => (
  <svg className="w-3 h-3 text-[#1565FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
)
const IconFengshui = () => (
  <svg className="w-3 h-3 text-[#1565FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9" />
  </svg>
)
const IconAdvanced = () => (
  <svg className="w-3 h-3 text-[#1565FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
  </svg>
)
const IconRent = () => (
  <svg className="w-3 h-3 text-[#1565FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
  </svg>
)

// ─── Main component ─────────────────────────────────────────────────────────

interface Props {
  mode: Mode
  filters: FilterState
  onChange: (f: FilterState) => void
  count: number
}

function priceLabel(val: number, mode: Mode) {
  if (val >= PRICE_MAX_DEFAULT) return mode === 'rent_long' ? '200+ tr/tháng' : '200+ tr/m²'
  if (val === 0) return '0'
  return mode === 'rent_long' ? `${val} tr/tháng` : `${val} tr/m²`
}

export default function FilterSidebar({ mode, filters, onChange, count }: Props) {
  const [local, setLocal] = useState<FilterState>(filters)

  const update = useCallback((patch: Partial<FilterState>) => {
    const next = { ...local, ...patch }
    setLocal(next)
    onChange(next)
  }, [local, onChange])

  function clearAll() {
    const reset: FilterState = { property_type: '', price_min: 0, price_max: PRICE_MAX_DEFAULT }
    setLocal(reset)
    onChange(reset)
  }

  const priceMin = local.price_min
  const priceMax = local.price_max >= PRICE_MAX_DEFAULT ? PRICE_MAX_DEFAULT : local.price_max
  const pctMin = (priceMin / PRICE_MAX_DEFAULT) * 100
  const pctMax = (priceMax / PRICE_MAX_DEFAULT) * 100

  function handleMinSlider(v: number) {
    update({ price_min: Math.min(v, local.price_max - 5) })
  }
  function handleMaxSlider(v: number) {
    update({ price_max: Math.max(v, local.price_min + 5) })
  }

  const amenities = local.amenities ?? []

  const hasActive = local.property_type !== ''
    || local.price_min > 0
    || local.price_max < PRICE_MAX_DEFAULT
    || (local.tiers?.length ?? 0) > 0
    || (local.statuses?.length ?? 0) > 0
    || (local.red_book_statuses?.length ?? 0) > 0
    || (local.land_origin_types?.length ?? 0) > 0
    || (local.ownership_terms?.length ?? 0) > 0
    || (local.amenities?.length ?? 0) > 0
    || (local.main_directions?.length ?? 0) > 0
    || (local.noise_levels?.length ?? 0) > 0
    || !!local.legal_score_min
    || !!local.investment_score_min
    || !!local.bql_rating_min
    || !!local.review_rating_min
    || local.flood_risk_max !== undefined
    || !!local.birth_year
    || !!local.rent_demand_score_min
    || !!local.rent_trend
    || local.is_expat_friendly

  return (
    <aside className="w-[240px] shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E2E8F0] shrink-0">
        <span className="font-semibold text-sm text-[#0D1B3D]">Bộ lọc</span>
        {hasActive && (
          <button
            onClick={clearAll}
            className="text-[11px] text-[#1565FF] font-medium hover:text-[#0D4FCC] transition-colors"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 space-y-0">

        {/* ── Cơ bản (always open) ─────────────────────────── */}
        <FilterSection title="Cơ bản" icon={<IconBasic />} defaultOpen>
          {/* Loại hình */}
          <div>
            <p className="text-[10px] text-[#94A3B8] font-medium mb-1">Loại hình</p>
            <div className="relative">
              <select
                value={local.property_type}
                onChange={e => update({ property_type: e.target.value })}
                className="w-full text-[12px] text-[#0D1B3D] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 pr-7 appearance-none focus:outline-none focus:border-[#1565FF] transition-colors cursor-pointer"
              >
                {PROPERTY_TYPES.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#94A3B8] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Phân khúc */}
          <div>
            <p className="text-[10px] text-[#94A3B8] font-medium mb-1">Phân khúc</p>
            <ChipGroup
              options={TIERS}
              value={local.tiers ?? []}
              onChange={v => update({ tiers: v as string[] })}
              cols={2}
            />
          </div>

          {/* Tình trạng */}
          <div>
            <p className="text-[10px] text-[#94A3B8] font-medium mb-1">Tình trạng dự án</p>
            <ChipGroup
              options={STATUSES}
              value={local.statuses ?? []}
              onChange={v => update({ statuses: v as string[] })}
              cols={2}
            />
          </div>

          {/* Khoảng giá */}
          <div>
            <p className="text-[10px] text-[#94A3B8] font-medium mb-1">
              {mode === 'rent_long' ? 'Giá thuê 2PN' : 'Giá (tr/m²)'}
            </p>
            <div className="text-[12px] font-medium text-[#0D1B3D] mb-2">
              {priceMin === 0 && local.price_max >= PRICE_MAX_DEFAULT
                ? 'Tất cả mức giá'
                : `${priceLabel(priceMin, mode)} – ${priceLabel(local.price_max, mode)}`}
            </div>
            <div className="relative h-5 mb-1">
              <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-[#E2E8F0] rounded-full">
                <div
                  className="absolute h-full bg-[#1565FF] rounded-full"
                  style={{ left: `${pctMin}%`, right: `${100 - pctMax}%` }}
                />
              </div>
              <input type="range" min={0} max={PRICE_MAX_DEFAULT} step={5}
                value={priceMin}
                onChange={e => handleMinSlider(Number(e.target.value))}
                className="range-thumb absolute w-full h-full opacity-0 cursor-pointer"
                style={{ zIndex: priceMin > 180 ? 5 : 3 }}
              />
              <input type="range" min={0} max={PRICE_MAX_DEFAULT} step={5}
                value={local.price_max}
                onChange={e => handleMaxSlider(Number(e.target.value))}
                className="range-thumb absolute w-full h-full opacity-0 cursor-pointer"
                style={{ zIndex: 4 }}
              />
              <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-[#1565FF] rounded-full shadow pointer-events-none"
                style={{ left: `calc(${pctMin}% - 7px)` }} />
              <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-[#1565FF] rounded-full shadow pointer-events-none"
                style={{ left: `calc(${pctMax}% - 7px)` }} />
            </div>
            <div className="flex justify-between text-[10px] text-[#94A3B8]">
              <span>0</span>
              <span>{mode === 'rent_long' ? '200+ tr' : '200+ tr/m²'}</span>
            </div>
          </div>
        </FilterSection>

        {/* ── Pháp lý ──────────────────────────────────────── */}
        <FilterSection title="Pháp lý" icon={<IconLegal />}>
          <div>
            <p className="text-[10px] text-[#94A3B8] font-medium mb-1">Sổ đỏ / Hồng</p>
            <ChipGroup
              options={RED_BOOK}
              value={local.red_book_statuses ?? []}
              onChange={v => update({ red_book_statuses: v as string[] })}
              cols={2}
            />
          </div>
          <div>
            <p className="text-[10px] text-[#94A3B8] font-medium mb-1">Nguồn gốc đất</p>
            <ChipGroup
              options={LAND_ORIGIN}
              value={local.land_origin_types ?? []}
              onChange={v => update({ land_origin_types: v as string[] })}
              cols={2}
            />
          </div>
          <div>
            <p className="text-[10px] text-[#94A3B8] font-medium mb-1">Thời hạn sở hữu</p>
            <ChipGroup
              options={OWNERSHIP}
              value={local.ownership_terms ?? []}
              onChange={v => update({ ownership_terms: v as string[] })}
              cols={3}
            />
          </div>
          <div>
            <p className="text-[10px] text-[#94A3B8] font-medium mb-1">Điểm pháp lý tối thiểu</p>
            <SingleChip
              options={LEGAL_SCORES}
              value={local.legal_score_min}
              onChange={v => update({ legal_score_min: v as number | undefined })}
            />
          </div>
        </FilterSection>

        {/* ── Tiện ích ─────────────────────────────────────── */}
        <FilterSection title="Tiện ích" icon={<IconAmenity />}>
          <div>
            <p className="text-[10px] text-[#94A3B8] font-medium mb-1.5">Nội khu</p>
            <AmenityGrid
              options={AMENITIES_INTERNAL}
              value={amenities}
              onChange={v => update({ amenities: v })}
            />
          </div>
          <div>
            <p className="text-[10px] text-[#94A3B8] font-medium mb-1.5">Xung quanh ≤ 800m</p>
            <AmenityGrid
              options={AMENITIES_NEARBY}
              value={amenities}
              onChange={v => update({ amenities: v })}
            />
          </div>
        </FilterSection>

        {/* ── Rủi ro ───────────────────────────────────────── */}
        <FilterSection title="Rủi ro" icon={<IconRisk />}>
          <div>
            <p className="text-[10px] text-[#94A3B8] font-medium mb-1">Ngập lụt tối đa</p>
            <SingleChip
              options={FLOOD_RISK}
              value={local.flood_risk_max}
              onChange={v => update({ flood_risk_max: v as number | undefined })}
            />
          </div>
          <div>
            <p className="text-[10px] text-[#94A3B8] font-medium mb-1">Độ ồn</p>
            <ChipGroup
              options={NOISE_LEVELS}
              value={local.noise_levels ?? []}
              onChange={v => update({ noise_levels: v as string[] })}
              cols={3}
            />
          </div>
        </FilterSection>

        {/* ── Phong thủy ───────────────────────────────────── */}
        <FilterSection title="Phong thủy" icon={<IconFengshui />}>
          <div>
            <p className="text-[10px] text-[#94A3B8] font-medium mb-1">Hướng chính</p>
            <div className="grid grid-cols-4 gap-1">
              {DIRECTIONS.map(d => (
                <button
                  key={d.value}
                  onClick={() => {
                    const cur = local.main_directions ?? []
                    update({
                      main_directions: cur.includes(d.value)
                        ? cur.filter(x => x !== d.value)
                        : [...cur, d.value],
                    })
                  }}
                  className={`py-1 text-[11px] rounded-md border transition-colors font-medium ${
                    (local.main_directions ?? []).includes(d.value)
                      ? 'bg-[#1565FF] border-[#1565FF] text-white'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#1565FF]'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-[#94A3B8] font-medium mb-1">Năm sinh (hợp mệnh)</p>
            <input
              type="number"
              placeholder="VD: 1990"
              min={1940} max={2010}
              value={local.birth_year ?? ''}
              onChange={e => update({ birth_year: e.target.value ? Number(e.target.value) : undefined })}
              className="w-full text-[12px] text-[#0D1B3D] placeholder-[#94A3B8] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#1565FF] transition-colors"
            />
          </div>
        </FilterSection>

        {/* ── Nâng cao ─────────────────────────────────────── */}
        <FilterSection title="Nâng cao" icon={<IconAdvanced />}>
          <div>
            <p className="text-[10px] text-[#94A3B8] font-medium mb-1">Chủ đầu tư</p>
            <input
              type="text"
              placeholder="Tìm chủ đầu tư..."
              value={local.developer_search ?? ''}
              onChange={e => update({ developer_search: e.target.value || undefined })}
              className="w-full text-[12px] text-[#0D1B3D] placeholder-[#94A3B8] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#1565FF] transition-colors"
            />
          </div>
          <div>
            <p className="text-[10px] text-[#94A3B8] font-medium mb-1">Bàn giao trước năm</p>
            <div className="flex flex-wrap gap-1">
              {HANDOVER_YEARS.map(y => (
                <button
                  key={y}
                  onClick={() => update({ year_handover_max: local.year_handover_max === y ? undefined : y })}
                  className={`px-2 py-0.5 text-[11px] rounded-md border transition-colors ${
                    local.year_handover_max === y
                      ? 'bg-[#1565FF] border-[#1565FF] text-white font-medium'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#1565FF]'
                  }`}
                >
                  {y}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-[10px] text-[#94A3B8] font-medium mb-1">Điểm đầu tư tối thiểu</p>
            <SingleChip
              options={INVEST_SCORES}
              value={local.investment_score_min}
              onChange={v => update({ investment_score_min: v as number | undefined })}
            />
          </div>
          <div>
            <p className="text-[10px] text-[#94A3B8] font-medium mb-1">Đánh giá BQL</p>
            <SingleChip
              options={RATING_OPTS}
              value={local.bql_rating_min}
              onChange={v => update({ bql_rating_min: v as number | undefined })}
            />
          </div>
          <div>
            <p className="text-[10px] text-[#94A3B8] font-medium mb-1">Đánh giá cư dân</p>
            <SingleChip
              options={RATING_OPTS}
              value={local.review_rating_min}
              onChange={v => update({ review_rating_min: v as number | undefined })}
            />
          </div>
        </FilterSection>

        {/* ── Cho thuê (rent_long only) ─────────────────────── */}
        {mode === 'rent_long' && (
          <FilterSection title="Cho thuê" icon={<IconRent />}>
            <div>
              <p className="text-[10px] text-[#94A3B8] font-medium mb-1">Nhu cầu thuê</p>
              <SingleChip
                options={RENT_DEMAND}
                value={local.rent_demand_score_min}
                onChange={v => update({ rent_demand_score_min: v as number | undefined })}
              />
            </div>
            <div>
              <p className="text-[10px] text-[#94A3B8] font-medium mb-1">Xu hướng giá thuê</p>
              <SingleChip
                options={RENT_TRENDS}
                value={local.rent_trend}
                onChange={v => update({ rent_trend: v as string | undefined })}
              />
            </div>
            <label className="flex items-center justify-between cursor-pointer">
              <span className="text-[12px] text-[#374151]">Thân thiện expat</span>
              <button
                onClick={() => update({ is_expat_friendly: !local.is_expat_friendly })}
                className={`relative w-9 h-5 rounded-full transition-colors ${
                  local.is_expat_friendly ? 'bg-[#1565FF]' : 'bg-[#E2E8F0]'
                }`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  local.is_expat_friendly ? 'translate-x-4' : ''
                }`} />
              </button>
            </label>
          </FilterSection>
        )}
      </div>

      {/* CTA */}
      <div className="px-3 py-3 border-t border-[#E2E8F0] shrink-0">
        <button className="w-full bg-[#1565FF] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#0D4FCC] transition-colors shadow-sm">
          {count > 0 ? `Xem ${count} dự án` : 'Xem dự án'}
        </button>
      </div>
    </aside>
  )
}
