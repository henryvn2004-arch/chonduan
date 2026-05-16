'use client'

import { useState, useCallback } from 'react'
import type { FilterState } from '@/types/maps'

const PROPERTY_TYPES = [
  { value: '', label: 'Tất cả loại hình' },
  { value: 'chung_cu', label: 'Chung cư' },
  { value: 'biet_thu', label: 'Biệt thự' },
  { value: 'lien_ke', label: 'Liền kề' },
  { value: 'shophouse', label: 'Shophouse' },
  { value: 'dat_nen', label: 'Đất nền' },
  { value: 'officetel', label: 'Officetel' },
]

const PRICE_MAX_DEFAULT = 100

interface Props {
  filters: FilterState
  onChange: (f: FilterState) => void
  count: number
}

function priceLabel(val: number, isMax: boolean) {
  if (isMax && val >= PRICE_MAX_DEFAULT) return '100+ tỷ'
  if (val === 0 && !isMax) return '0'
  return `${val} tỷ`
}

export default function FilterSidebar({ filters, onChange, count }: Props) {
  const [localFilters, setLocalFilters] = useState<FilterState>(filters)

  const update = useCallback((patch: Partial<FilterState>) => {
    const next = { ...localFilters, ...patch }
    setLocalFilters(next)
    onChange(next)
  }, [localFilters, onChange])

  function clearAll() {
    const reset: FilterState = { property_type: '', price_min: 0, price_max: PRICE_MAX_DEFAULT }
    setLocalFilters(reset)
    onChange(reset)
  }

  const priceMin = localFilters.price_min
  const priceMax = localFilters.price_max

  const rangeMin = priceMin
  const rangeMax = priceMax >= PRICE_MAX_DEFAULT ? PRICE_MAX_DEFAULT : priceMax

  const pctMin = (rangeMin / PRICE_MAX_DEFAULT) * 100
  const pctMax = (rangeMax / PRICE_MAX_DEFAULT) * 100

  function handleMinSlider(v: number) {
    const clamped = Math.min(v, priceMax - 5)
    update({ price_min: clamped })
  }

  function handleMaxSlider(v: number) {
    const clamped = Math.max(v, priceMin + 5)
    update({ price_max: clamped })
  }

  const hasActive = localFilters.property_type !== '' || localFilters.price_min > 0 || localFilters.price_max < PRICE_MAX_DEFAULT

  return (
    <aside className="w-[220px] shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
        <span className="font-semibold text-sm text-[#0D1B3D]">Bộ lọc</span>
        {hasActive && (
          <button
            onClick={clearAll}
            className="text-xs text-[#1565FF] font-medium hover:text-[#0D4FCC] transition-colors"
          >
            Xóa bộ lọc
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        {/* Khu vực */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">
            <svg className="w-3.5 h-3.5 text-[#1565FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Khu vực
          </label>
          <div className="relative">
            <select className="w-full text-sm text-[#0D1B3D] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-[#1565FF] transition-colors cursor-pointer">
              <option>TP. Thủ Đức, TP.HCM</option>
              <option>Quận 1, TP.HCM</option>
              <option>Quận 2, TP.HCM</option>
              <option>Bình Dương</option>
              <option>Đồng Nai</option>
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Loại hình */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">
            <svg className="w-3.5 h-3.5 text-[#1565FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Loại hình
          </label>
          <div className="relative">
            <select
              value={localFilters.property_type}
              onChange={(e) => update({ property_type: e.target.value })}
              className="w-full text-sm text-[#0D1B3D] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 pr-8 appearance-none focus:outline-none focus:border-[#1565FF] transition-colors cursor-pointer"
            >
              {PROPERTY_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#94A3B8] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {/* Khoảng giá */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">
            <svg className="w-3.5 h-3.5 text-[#1565FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Khoảng giá
          </label>
          <div className="text-sm font-medium text-[#0D1B3D] mb-3">
            {priceMin === 0 && priceMax >= PRICE_MAX_DEFAULT
              ? 'Tất cả mức giá'
              : `Từ ${priceLabel(priceMin, false)} – ${priceLabel(priceMax, true)}`}
          </div>

          {/* Dual range slider */}
          <div className="relative h-6">
            {/* Track */}
            <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-1 bg-[#E2E8F0] rounded-full">
              <div
                className="absolute h-full bg-[#1565FF] rounded-full"
                style={{ left: `${pctMin}%`, right: `${100 - pctMax}%` }}
              />
            </div>
            {/* Min thumb */}
            <input
              type="range" min={0} max={PRICE_MAX_DEFAULT} step={5}
              value={priceMin}
              onChange={(e) => handleMinSlider(Number(e.target.value))}
              className="range-thumb absolute w-full h-full opacity-0 cursor-pointer"
              style={{ zIndex: priceMin > 85 ? 5 : 3 }}
            />
            {/* Max thumb */}
            <input
              type="range" min={0} max={PRICE_MAX_DEFAULT} step={5}
              value={priceMax}
              onChange={(e) => handleMaxSlider(Number(e.target.value))}
              className="range-thumb absolute w-full h-full opacity-0 cursor-pointer"
              style={{ zIndex: 4 }}
            />
            {/* Visual thumbs */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#1565FF] rounded-full shadow pointer-events-none"
              style={{ left: `calc(${pctMin}% - 8px)` }}
            />
            <div
              className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-2 border-[#1565FF] rounded-full shadow pointer-events-none"
              style={{ left: `calc(${pctMax}% - 8px)` }}
            />
          </div>

          <div className="flex justify-between text-xs text-[#94A3B8] mt-1">
            <span>0</span>
            <span>100+ tỷ</span>
          </div>
        </div>

        {/* Tiện ích */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">
            <svg className="w-3.5 h-3.5 text-[#1565FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            Tiện ích
          </label>
          <button className="w-full flex items-center justify-between text-sm text-[#94A3B8] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 hover:border-[#1565FF] transition-colors">
            <span>Chọn tiện ích</span>
            <svg className="w-4 h-4 text-[#1565FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>

        {/* Chủ đầu tư */}
        <div>
          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">
            <svg className="w-3.5 h-3.5 text-[#1565FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Chủ đầu tư
          </label>
          <input
            type="text"
            placeholder="Chọn chủ đầu tư"
            className="w-full text-sm text-[#0D1B3D] placeholder-[#94A3B8] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 focus:outline-none focus:border-[#1565FF] transition-colors"
          />
        </div>
      </div>

      {/* CTA */}
      <div className="px-4 py-3 border-t border-[#E2E8F0]">
        <button className="w-full bg-[#1565FF] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#0D4FCC] transition-colors shadow-sm">
          Xem {count > 0 ? count : ''} dự án
        </button>
      </div>
    </aside>
  )
}
