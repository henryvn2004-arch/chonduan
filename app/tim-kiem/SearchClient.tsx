'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useTransition } from 'react'
import type { FilterState, Mode } from '@/types/maps'

const PROPERTY_TYPES = [
  { value: '', label: 'Tất cả loại hình' },
  { value: 'chung_cu', label: 'Chung cư' },
  { value: 'biet_thu', label: 'Biệt thự' },
  { value: 'lien_ke', label: 'Liền kề' },
  { value: 'shophouse', label: 'Shophouse' },
  { value: 'dat_nen', label: 'Đất nền' },
  { value: 'officetel', label: 'Officetel' },
]

const STATUSES = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'sap_mo_ban', label: 'Sắp mở bán' },
  { value: 'dang_mo_ban', label: 'Đang mở bán' },
  { value: 'dang_xay', label: 'Đang xây' },
  { value: 'da_ban_giao', label: 'Đã bàn giao' },
]

const AMENITY_OPTIONS = [
  { value: 'pool', label: 'Hồ bơi' },
  { value: 'gym', label: 'Gym' },
  { value: 'school', label: 'Trường học' },
  { value: 'mall', label: 'TTTM' },
]

const BEDROOMS = [
  { value: '', label: 'Tất cả' },
  { value: '1', label: '1 PN' },
  { value: '2', label: '2 PN' },
  { value: '3', label: '3 PN' },
  { value: '4+', label: '4+ PN' },
]

interface Props {
  mode: Mode
  filters: FilterState
  total: number
  q: string
}

export default function SearchClient({ mode, filters, total, q }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const pushUrl = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [k, v] of Object.entries(updates)) {
      if (v) params.set(k, v)
      else params.delete(k)
    }
    startTransition(() => {
      router.push(`/tim-kiem?${params}`)
    })
  }, [router, searchParams])

  const amenities = filters.amenities ?? []

  function toggleAmenity(val: string) {
    const next = amenities.includes(val)
      ? amenities.filter(a => a !== val)
      : [...amenities, val]
    pushUrl({ amenities: next.join(',') })
  }

  const priceLabel = mode === 'rent_long' ? 'tr/tháng' : 'tỷ'
  const priceMax = mode === 'rent_long' ? 200 : 100

  return (
    <aside className={`w-[220px] shrink-0 bg-white border-r border-[#E2E8F0] flex flex-col h-full transition-opacity ${pending ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0]">
        <span className="font-semibold text-sm text-[#0D1B3D]">Bộ lọc</span>
        <button
          onClick={() => {
            startTransition(() => router.push(`/tim-kiem?q=${q}&mode=${mode}`))
          }}
          className="text-xs text-[#1565FF] hover:text-[#0D4FCC] transition-colors"
        >
          Xóa bộ lọc
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5">
        {/* Loại hình */}
        <div>
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2 block">Loại hình</label>
          <select
            value={filters.property_type}
            onChange={e => pushUrl({ property_type: e.target.value, page: '' })}
            className="w-full text-sm text-[#0D1B3D] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 appearance-none focus:outline-none focus:border-[#1565FF]"
          >
            {PROPERTY_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>

        {/* Trạng thái */}
        <div>
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2 block">Trạng thái</label>
          <select
            value={filters.status ?? ''}
            onChange={e => pushUrl({ status: e.target.value, page: '' })}
            className="w-full text-sm text-[#0D1B3D] bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-3 py-2 appearance-none focus:outline-none focus:border-[#1565FF]"
          >
            {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>

        {/* Giá */}
        <div>
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2 block">
            Giá tối đa ({priceLabel})
          </label>
          <input
            type="range"
            min={0} max={priceMax} step={mode === 'rent_long' ? 5 : 5}
            value={filters.price_max < priceMax ? filters.price_max : priceMax}
            onChange={e => pushUrl({ price_max: e.target.value, page: '' })}
            className="w-full accent-[#1565FF]"
          />
          <div className="flex justify-between text-xs text-[#94A3B8] mt-1">
            <span>0</span>
            <span className="font-medium text-[#0D1B3D]">
              {filters.price_max >= priceMax ? `${priceMax}+` : filters.price_max} {priceLabel}
            </span>
          </div>
        </div>

        {/* Sale-specific */}
        {mode === 'sale' && (
          <div>
            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2 block">Điểm đầu tư tối thiểu</label>
            <input
              type="range" min={0} max={10} step={1}
              value={filters.investment_score_min ?? 0}
              onChange={e => pushUrl({ investment_score_min: e.target.value, page: '' })}
              className="w-full accent-[#1565FF]"
            />
            <div className="flex justify-between text-xs text-[#94A3B8] mt-1">
              <span>0</span>
              <span className="font-medium text-[#0D1B3D]">{filters.investment_score_min ?? 0}/10</span>
            </div>
          </div>
        )}

        {/* Rent-specific */}
        {mode === 'rent_long' && (
          <div>
            <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2 block">Số phòng ngủ</label>
            <div className="flex flex-wrap gap-1.5">
              {BEDROOMS.map(b => (
                <button
                  key={b.value}
                  onClick={() => pushUrl({ bedrooms: b.value, page: '' })}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                    (filters.bedrooms ?? '') === b.value
                      ? 'bg-[#1565FF] text-white border-[#1565FF]'
                      : 'bg-[#F8FAFC] text-[#0D1B3D] border-[#E2E8F0] hover:border-[#1565FF]'
                  }`}
                >
                  {b.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tiện ích */}
        <div>
          <label className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2 block">Tiện ích</label>
          <div className="space-y-1.5">
            {AMENITY_OPTIONS.map(a => (
              <label key={a.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={amenities.includes(a.value)}
                  onChange={() => toggleAmenity(a.value)}
                  className="accent-[#1565FF]"
                />
                <span className="text-sm text-[#0D1B3D]">{a.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-t border-[#E2E8F0]">
        <div className="text-xs text-[#64748B] text-center">
          {total} dự án phù hợp
        </div>
      </div>
    </aside>
  )
}
