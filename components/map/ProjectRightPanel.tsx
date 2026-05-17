'use client'

import { useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import type { ProjectPin, Mode, ProjectStatus } from '@/types/maps'

const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  sap_mo_ban: { label: 'Sắp mở bán', color: 'bg-[#FFF7ED] text-[#C2410C]' },
  dang_mo_ban: { label: 'Đang mở bán', color: 'bg-[#ECFDF5] text-[#065F46]' },
  dang_xay: { label: 'Đang xây dựng', color: 'bg-[#EFF6FF] text-[#1565FF]' },
  da_ban_giao: { label: 'Đã bàn giao', color: 'bg-[#F8FAFC] text-[#64748B]' },
  da_ban_giao_lau: { label: 'Đã bàn giao (lâu)', color: 'bg-[#F8FAFC] text-[#64748B]' },
}

const PROPERTY_TYPE_LABEL: Record<string, string> = {
  chung_cu: 'Chung cư',
  biet_thu: 'Biệt thự',
  lien_ke: 'Liền kề',
  shophouse: 'Shophouse',
  dat_nen: 'Đất nền',
  officetel: 'Officetel',
  condotel: 'Condotel',
  khu_do_thi: 'Khu đô thị',
}

function fmtSale(pin: ProjectPin) {
  const val = pin.price_secondary_per_m2_avg ?? pin.price_primary_per_m2_min
  if (!val) return null
  return `Từ ${Math.round(val / 1_000_000)} tr/m²`
}

function fmtRent(pin: ProjectPin) {
  if (!pin.rent_2br_avg_monthly_vnd) return null
  return `Từ ${Math.round(pin.rent_2br_avg_monthly_vnd / 1_000_000)} tr/tháng`
}

function slugProvince(province: string) {
  return province.toLowerCase().replace(/\s+/g, '-')
}

interface Props {
  pins: ProjectPin[]
  selectedPin: ProjectPin | null
  onPinSelect: (pin: ProjectPin | null) => void
  mode: Mode
}

export default function ProjectRightPanel({ pins, selectedPin, onPinSelect, mode }: Props) {
  const listRef = useRef<HTMLDivElement>(null)

  return (
    <aside className="w-[300px] shrink-0 bg-white border-l border-[#E2E8F0] flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] shrink-0">
        <span className="font-semibold text-sm text-[#0D1B3D]">
          {pins.length > 0 ? `${pins.length} dự án tìm thấy` : 'Đang tải...'}
        </span>
        <div className="relative">
          <select className="text-xs text-[#64748B] bg-transparent border-0 focus:outline-none cursor-pointer pr-5 appearance-none font-medium">
            <option>Phù hợp nhất</option>
            <option>Giá tăng dần</option>
            <option>Giá giảm dần</option>
            <option>Mới nhất</option>
          </select>
          <svg className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-[#94A3B8] pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Project list */}
      <div ref={listRef} className="flex-1 overflow-y-auto divide-y divide-[#F1F5F9]">
        {pins.length === 0 && (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <svg className="w-10 h-10 text-[#CBD5E1] mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <p className="text-sm text-[#94A3B8]">Không có dự án trong khu vực này</p>
          </div>
        )}

        {pins.map((pin) => {
          const price = mode === 'sale' ? fmtSale(pin) : fmtRent(pin)
          const isSelected = selectedPin?.id === pin.id
          const statusCfg = pin.status ? STATUS_CONFIG[pin.status] : null
          const location = [pin.district, pin.province].filter(Boolean).join(', ')

          return (
            <Link
              key={pin.id}
              href={`/du-an/${slugProvince(pin.province)}/${pin.slug}`}
              className={[
                'w-full text-left px-3 py-3 flex gap-3 hover:bg-[#F8FAFC] transition-colors',
                isSelected ? 'bg-[#EFF6FF] hover:bg-[#EFF6FF]' : '',
              ].join(' ')}
            >
              {/* Thumbnail */}
              <div className="w-[72px] h-[72px] rounded-xl overflow-hidden shrink-0 bg-[#F1F5F9]">
                {pin.banner_url ? (
                  <Image
                    src={pin.banner_url}
                    alt={pin.name_official}
                    width={72}
                    height={72}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-7 h-7 text-[#CBD5E1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <h3 className="font-semibold text-[#0D1B3D] text-xs leading-snug line-clamp-2 flex-1">
                    {pin.name_official}
                  </h3>
                  <button
                    onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
                    className="shrink-0 w-6 h-6 flex items-center justify-center text-[#CBD5E1] hover:text-[#F43F5E] transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </button>
                </div>

                {location && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <svg className="w-3 h-3 text-[#94A3B8] shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    </svg>
                    <span className="text-[10px] text-[#94A3B8] truncate">{location}</span>
                  </div>
                )}

                <div className="flex flex-wrap gap-1 mt-1.5">
                  {pin.property_type && (
                    <span className="text-[10px] bg-[#EFF6FF] text-[#1565FF] px-1.5 py-0.5 rounded-md font-medium">
                      {PROPERTY_TYPE_LABEL[pin.property_type] ?? pin.property_type}
                    </span>
                  )}
                  {statusCfg && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-medium ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                  )}
                </div>

                {price && (
                  <div className="text-xs font-bold text-[#1565FF] mt-1.5">{price}</div>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </aside>
  )
}
