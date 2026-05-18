'use client'

import { useState, useCallback } from 'react'
import type { FilterState, Mode } from '@/types/maps'
import { PROVINCES_DATA, PROVINCE_MAP } from '@/lib/data/provinces-districts'

const PROPERTY_TYPES = [
  { value: '',          label: 'Tất cả' },
  { value: 'chung_cu',  label: 'Chung cư' },
  { value: 'biet_thu',  label: 'Biệt thự' },
  { value: 'lien_ke',   label: 'Liền kề' },
  { value: 'shophouse', label: 'Shophouse' },
  { value: 'dat_nen',   label: 'Đất nền' },
  { value: 'officetel', label: 'Officetel' },
  { value: 'condotel',  label: 'Condotel' },
]

const STATUSES = [
  { value: 'sap_mo_ban',      label: 'Sắp MBán' },
  { value: 'dang_mo_ban',     label: 'Đang MBán' },
  { value: 'dang_xay',        label: 'Đang xây' },
  { value: 'da_ban_giao',     label: 'Đã BG' },
  { value: 'da_ban_giao_lau', label: 'BG lâu' },
]

const RED_BOOK = [
  { value: 'da_cap',    label: 'Đã có sổ' },
  { value: 'dang_lam',  label: 'Đang làm' },
  { value: 'chua_cap',  label: 'Chưa có' },
  { value: 'vuong_mac', label: 'Vướng mắc' },
]

const OWNERSHIP = [
  { value: 'lau_dai', label: 'Lâu dài' },
  { value: 'nam_70',  label: '70 năm' },
  { value: 'nam_50',  label: '50 năm' },
]

const YIELD_OPTS = [
  { value: 3, label: '≥ 3%' },
  { value: 5, label: '≥ 5%' },
  { value: 7, label: '≥ 7%' },
]

const HANDOVER_YEARS = [2025, 2026, 2027, 2028]

const PRICE_MAX = 200   // tr/m² or tr/tháng
const RENT_MAX  = 100   // tr/tháng for 2BR slider

// ─── Helpers ────────────────────────────────────────────────────────────────

function Chevron({ open }: { open: boolean }) {
  return (
    <svg className={`w-3 h-3 text-[#94A3B8] transition-transform ${open ? 'rotate-180' : ''}`}
      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] text-[#94A3B8] font-medium mb-1">{children}</p>
}

function Chips({
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
    <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
      {options.map(o => (
        <button key={o.value} onClick={() => toggle(o.value)}
          className={`px-1.5 py-1 text-[11px] rounded-md border transition-colors text-center leading-tight ${
            value.includes(o.value)
              ? 'bg-[#1565FF] border-[#1565FF] text-white font-medium'
              : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#1565FF]'
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
        <button key={o.value} onClick={() => onChange(value === o.value ? undefined : o.value)}
          className={`px-2 py-0.5 text-[11px] rounded-md border transition-colors ${
            value === o.value
              ? 'bg-[#1565FF] border-[#1565FF] text-white font-medium'
              : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] hover:border-[#1565FF]'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// Simple range slider — single thumb
function RangeSlider({
  label, min, max, step, value, onChange, unit,
}: {
  label: string
  min: number; max: number; step: number
  value: number
  onChange: (v: number) => void
  unit: string
}) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <SectionLabel>{label}</SectionLabel>
        <span className="text-[11px] font-medium text-[#0D1B3D]">
          {value >= max ? `${max}+` : `≥ ${value}`} {unit}
        </span>
      </div>
      <div className="relative h-5">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-[#E2E8F0] rounded-full">
          <div className="absolute h-full bg-[#1565FF] rounded-full" style={{ width: `${pct}%` }} />
        </div>
        <input type="range" min={min} max={max} step={step} value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="range-thumb absolute w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: 3 }}
        />
        <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-[#1565FF] rounded-full shadow pointer-events-none"
          style={{ left: `calc(${pct}% - 7px)` }} />
      </div>
    </div>
  )
}

function Checkbox({
  label, checked, onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
        className="w-3.5 h-3.5 rounded border-[#CBD5E0] accent-[#1565FF] shrink-0" />
      <span className="text-[12px] text-[#374151] group-hover:text-[#1565FF] transition-colors">
        {label}
      </span>
    </label>
  )
}

function FilterSection({ title, children, defaultOpen = false }: {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-[#F1F5F9] pb-3">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2 text-[11px] font-semibold text-[#64748B] uppercase tracking-wide"
      >
        {title}
        <Chevron open={open} />
      </button>
      {open && <div className="space-y-3">{children}</div>}
    </div>
  )
}

// ─── Dual range slider for price ─────────────────────────────────────────────

function DualRangeSlider({
  min, max, step, valueMin, valueMax, onChangeMin, onChangeMax, unit,
}: {
  min: number; max: number; step: number
  valueMin: number; valueMax: number
  onChangeMin: (v: number) => void
  onChangeMax: (v: number) => void
  unit: string
}) {
  const pMin = ((valueMin - min) / (max - min)) * 100
  const pMax = ((Math.min(valueMax, max) - min) / (max - min)) * 100
  return (
    <div>
      <div className="text-[12px] font-medium text-[#0D1B3D] mb-2">
        {valueMin === min && valueMax >= max
          ? 'Tất cả mức giá'
          : `${valueMin} – ${valueMax >= max ? `${max}+` : valueMax} ${unit}`}
      </div>
      <div className="relative h-5 mb-1">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-[#E2E8F0] rounded-full">
          <div className="absolute h-full bg-[#1565FF] rounded-full"
            style={{ left: `${pMin}%`, right: `${100 - pMax}%` }} />
        </div>
        <input type="range" min={min} max={max} step={step} value={valueMin}
          onChange={e => onChangeMin(Math.min(Number(e.target.value), valueMax - step))}
          className="range-thumb absolute w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: valueMin > max * 0.9 ? 5 : 3 }} />
        <input type="range" min={min} max={max} step={step} value={valueMax}
          onChange={e => onChangeMax(Math.max(Number(e.target.value), valueMin + step))}
          className="range-thumb absolute w-full h-full opacity-0 cursor-pointer"
          style={{ zIndex: 4 }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-[#1565FF] rounded-full shadow pointer-events-none"
          style={{ left: `calc(${pMin}% - 7px)` }} />
        <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white border-2 border-[#1565FF] rounded-full shadow pointer-events-none"
          style={{ left: `calc(${pMax}% - 7px)` }} />
      </div>
      <div className="flex justify-between text-[10px] text-[#94A3B8]">
        <span>{min}</span>
        <span>{max}+ {unit}</span>
      </div>
    </div>
  )
}

// ─── Main ────────────────────────────────────────────────────────────────────

interface Props {
  mode: Mode
  filters: FilterState
  onChange: (f: FilterState) => void
  mobile?: boolean  // when true: full-width, no border-r, no own header
}

const DEFAULT_FILTERS: FilterState = {
  property_type: '', price_min: 0, price_max: PRICE_MAX,
}

export default function FilterSidebar({ mode, filters, onChange, mobile }: Props) {
  const [local, setLocal] = useState<FilterState>(filters)

  const update = useCallback((patch: Partial<FilterState>) => {
    const next = { ...local, ...patch }
    setLocal(next)
    onChange(next)
  }, [local, onChange])

  function clearAll() {
    setLocal(DEFAULT_FILTERS)
    onChange(DEFAULT_FILTERS)
  }

  // Amenity helpers
  const amenities = local.amenities ?? []
  function toggleAmenity(key: string, on: boolean) {
    update({ amenities: on ? [...amenities, key] : amenities.filter(a => a !== key) })
  }

  const priceUnit = mode === 'rent_long' ? 'tr/tháng' : 'tr/m²'

  const hasActive = local.property_type !== ''
    || local.price_min > 0 || local.price_max < PRICE_MAX
    || (local.statuses?.length ?? 0) > 0
    || (local.red_book_statuses?.length ?? 0) > 0
    || (local.ownership_terms?.length ?? 0) > 0
    || amenities.length > 0
    || !!local.rent_2br_min || !!local.rental_yield_pct_min
    || !!local.developer_search || !!local.year_handover_max
    || !!local.province || !!local.district

  return (
    <aside className={mobile ? 'w-full bg-white flex flex-col' : 'w-[232px] shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col h-full'}>
      {/* Header — hidden in mobile drawer (drawer has its own header) */}
      {!mobile && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E2E8F0] shrink-0">
          <span className="font-semibold text-sm text-[#0D1B3D]">Bộ lọc</span>
          {hasActive && (
            <button onClick={clearAll}
              className="text-[11px] text-[#1565FF] font-medium hover:text-[#0D4FCC] transition-colors">
              Xóa bộ lọc
            </button>
          )}
        </div>
      )}

      {/* Clear all button in mobile mode */}
      {mobile && hasActive && (
        <div className="flex justify-end px-4 pt-2">
          <button onClick={clearAll}
            className="text-[11px] text-[#1565FF] font-medium hover:text-[#0D4FCC] transition-colors">
            Xóa bộ lọc
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-3 py-1 space-y-0">

        {/* ── A: Cơ bản ─────────────────────────────────── */}
        <FilterSection title="Cơ bản" defaultOpen>
          {/* Tỉnh/Thành */}
          <div>
            <SectionLabel>Tỉnh / Thành phố</SectionLabel>
            <div className="relative">
              <select
                value={local.province ?? ''}
                onChange={e => update({ province: e.target.value || undefined, district: undefined })}
                className="w-full text-[12px] text-[#0D1B3D] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 pr-7 appearance-none focus:outline-none focus:border-[#1565FF] transition-colors cursor-pointer"
              >
                <option value="">Tất cả tỉnh/thành</option>
                {PROVINCES_DATA.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#94A3B8] pointer-events-none"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Quận/Huyện */}
          <div>
            <SectionLabel>Quận / Huyện</SectionLabel>
            <div className="relative">
              <select
                value={local.district ?? ''}
                disabled={!local.province}
                onChange={e => update({ district: e.target.value || undefined })}
                className="w-full text-[12px] text-[#0D1B3D] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 pr-7 appearance-none focus:outline-none focus:border-[#1565FF] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">{local.province ? 'Tất cả quận/huyện' : 'Chọn tỉnh/thành trước'}</option>
                {(local.province ? (PROVINCE_MAP[local.province]?.districts ?? []) : [])
                  .map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#94A3B8] pointer-events-none"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Loại hình */}
          <div>
            <SectionLabel>Loại hình</SectionLabel>
            <div className="relative">
              <select
                value={local.property_type}
                onChange={e => update({ property_type: e.target.value })}
                className="w-full text-[12px] text-[#0D1B3D] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 pr-7 appearance-none focus:outline-none focus:border-[#1565FF] transition-colors cursor-pointer"
              >
                {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
              <svg className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#94A3B8] pointer-events-none"
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Tình trạng */}
          <div>
            <SectionLabel>Tình trạng</SectionLabel>
            <Chips
              options={STATUSES}
              value={local.statuses ?? []}
              onChange={v => update({ statuses: v as string[] })}
              cols={2}
            />
          </div>

          {/* Khoảng giá */}
          <div>
            <SectionLabel>Khoảng giá</SectionLabel>
            <DualRangeSlider
              min={0} max={PRICE_MAX} step={5}
              valueMin={local.price_min}
              valueMax={local.price_max}
              onChangeMin={v => update({ price_min: v })}
              onChangeMax={v => update({ price_max: v })}
              unit={priceUnit}
            />
          </div>
        </FilterSection>

        {/* ── B: Pháp lý ────────────────────────────────── */}
        <FilterSection title="Pháp lý">
          <div>
            <SectionLabel>Sổ đỏ / Hồng</SectionLabel>
            <Chips
              options={RED_BOOK}
              value={local.red_book_statuses ?? []}
              onChange={v => update({ red_book_statuses: v as string[] })}
              cols={2}
            />
          </div>
          <div>
            <SectionLabel>Thời hạn sở hữu</SectionLabel>
            <Chips
              options={OWNERSHIP}
              value={local.ownership_terms ?? []}
              onChange={v => update({ ownership_terms: v as string[] })}
              cols={3}
            />
          </div>
        </FilterSection>

        {/* ── C: Tiện ích ────────────────────────────────── */}
        <FilterSection title="Tiện ích">
          <div className="space-y-2">
            <Checkbox
              label="Trường học (nội khu hoặc gần)"
              checked={amenities.includes('school_any')}
              onChange={on => toggleAmenity('school_any', on)}
            />
            <Checkbox
              label="Siêu thị (nội khu hoặc gần)"
              checked={amenities.includes('supermarket_any')}
              onChange={on => toggleAmenity('supermarket_any', on)}
            />
            <Checkbox
              label="Công viên / Vườn"
              checked={amenities.includes('park')}
              onChange={on => toggleAmenity('park', on)}
            />
          </div>
        </FilterSection>

        {/* ── E: Cho thuê & Đầu tư ─────────────────────── */}
        <FilterSection title="Cho thuê & Đầu tư">
          <DualRangeSlider
            min={0} max={RENT_MAX} step={2}
            valueMin={local.rent_2br_min ?? 0}
            valueMax={local.rent_2br_max ?? RENT_MAX}
            onChangeMin={v => update({ rent_2br_min: v })}
            onChangeMax={v => update({ rent_2br_max: v })}
            unit="tr/tháng 2PN"
          />
          <div>
            <SectionLabel>Suất sinh lời tối thiểu</SectionLabel>
            <SingleChip
              options={YIELD_OPTS}
              value={local.rental_yield_pct_min}
              onChange={v => update({ rental_yield_pct_min: v as number | undefined })}
            />
          </div>
        </FilterSection>

        {/* ── H: Khác ────────────────────────────────────── */}
        <FilterSection title="Thông tin khác">
          <div>
            <SectionLabel>Chủ đầu tư</SectionLabel>
            <input
              type="text"
              placeholder="Tìm chủ đầu tư..."
              value={local.developer_search ?? ''}
              onChange={e => update({ developer_search: e.target.value || undefined })}
              className="w-full text-[12px] text-[#0D1B3D] placeholder-[#94A3B8] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#1565FF] transition-colors"
            />
          </div>
          <div>
            <SectionLabel>Bàn giao trước năm</SectionLabel>
            <div className="flex flex-wrap gap-1">
              {HANDOVER_YEARS.map(y => (
                <button key={y}
                  onClick={() => update({ year_handover_max: local.year_handover_max === y ? undefined : y })}
                  className={`px-2.5 py-0.5 text-[11px] rounded-md border transition-colors ${
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
        </FilterSection>

      </div>

    </aside>
  )
}
