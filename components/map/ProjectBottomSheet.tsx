'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import type { ProjectPin, Mode } from '@/types/maps'
import { PROPERTY_TYPE_LABEL } from '@/lib/data/property-types'

const TIER_LABEL: Record<string, string> = {
  binh_dan: 'Bình dân',
  trung_cap: 'Trung cấp',
  cao_cap: 'Cao cấp',
  hang_sang: 'Hạng sang',
}

interface Props {
  pin: ProjectPin | null
  mode: Mode
  onClose: () => void
}

function fmtSale(pin: ProjectPin) {
  const val = pin.price_secondary_per_m2_avg ?? pin.price_primary_per_m2_min
  if (!val) return null
  return `${Math.round(val / 1_000_000)} tr/m²`
}

function fmtRent(pin: ProjectPin) {
  if (!pin.rent_2br_avg_monthly_vnd) return null
  return `${Math.round(pin.rent_2br_avg_monthly_vnd / 1_000_000)} tr/tháng`
}

export default function ProjectBottomSheet({ pin, mode, onClose }: Props) {
  const sheetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const price = pin ? (mode === 'sale' ? fmtSale(pin) : fmtRent(pin)) : null

  return (
    <>
      {/* Mobile: bottom sheet */}
      <div
        className={[
          'fixed bottom-0 left-0 right-0 z-40 md:hidden transition-transform duration-300 ease-out',
          pin ? 'translate-y-0' : 'translate-y-full',
        ].join(' ')}
      >
        <div ref={sheetRef} className="bg-white rounded-t-2xl shadow-2xl px-4 pt-3 pb-8 max-h-[55vh] overflow-y-auto">
          {/* Handle bar */}
          <div className="w-10 h-1 bg-[#E2E8F0] rounded-full mx-auto mb-4" />
          {pin && <SheetContent pin={pin} mode={mode} price={price} onClose={onClose} />}
        </div>
      </div>

      {/* Desktop: floating card bottom-left */}
      <div
        className={[
          'hidden md:block fixed bottom-6 left-6 z-40 w-80 transition-all duration-300 ease-out',
          pin ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none',
        ].join(' ')}
      >
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#E2E8F0]">
          {pin && <SheetContent pin={pin} mode={mode} price={price} onClose={onClose} />}
        </div>
      </div>

      {/* Backdrop (mobile only) */}
      {pin && (
        <div
          className="fixed inset-0 z-30 bg-black/20 md:hidden"
          onClick={onClose}
        />
      )}
    </>
  )
}

function SheetContent({
  pin,
  mode,
  price,
  onClose,
}: {
  pin: ProjectPin
  mode: Mode
  price: string | null
  onClose: () => void
}) {
  return (
    <div className="p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#0D1B3D] text-sm leading-snug line-clamp-2">
            {pin.name_official}
          </h3>
          <p className="text-xs text-[#94A3B8] mt-0.5">{pin.province}</p>
        </div>
        <button
          onClick={onClose}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full hover:bg-[#F1F5F9] text-[#94A3B8] transition-colors"
          aria-label="Đóng"
        >
          ✕
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-3">
        {pin.property_type && (
          <span className="text-xs bg-[#EFF6FF] text-[#1565FF] px-2 py-0.5 rounded-full font-medium">
            {PROPERTY_TYPE_LABEL[pin.property_type] ?? pin.property_type}
          </span>
        )}
        {pin.tier && (
          <span className="text-xs bg-[#F8FAFC] text-[#64748B] px-2 py-0.5 rounded-full">
            {TIER_LABEL[pin.tier] ?? pin.tier}
          </span>
        )}
        {mode === 'rent_long' && pin.rent_demand_score && (
          <span className="text-xs bg-[#EFF6FF] text-[#1565FF] px-2 py-0.5 rounded-full font-medium">
            Nhu cầu: {pin.rent_demand_score}/10
          </span>
        )}
      </div>

      {price && (
        <div className="text-xl font-bold text-[#1565FF] mb-2">{price}</div>
      )}

      {pin.description_short && (
        <p className="text-xs text-[#64748B] line-clamp-2 mb-3">{pin.description_short}</p>
      )}

      <div className="flex gap-2">
        <Link
          href={`/du-an/${pin.province.toLowerCase().replace(/\s+/g, '-')}/${pin.slug}`}
          className="flex-1 text-center text-sm font-medium bg-[#1565FF] text-white rounded-xl py-2 hover:bg-[#0D4FCC] transition-colors"
        >
          Xem dự án
        </Link>
        <button className="px-3 py-2 border border-[#E2E8F0] rounded-xl text-[#64748B] hover:bg-[#F1F5F9] transition-colors text-sm">
          Liên hệ
        </button>
      </div>
    </div>
  )
}
