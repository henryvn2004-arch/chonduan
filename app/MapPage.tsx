'use client'

import { useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Nav from '@/components/nav/Nav'
import FilterSidebar from '@/components/map/FilterSidebar'
import ProjectRightPanel from '@/components/map/ProjectRightPanel'
import ProjectBottomSheet from '@/components/map/ProjectBottomSheet'
import type { Mode, SearchResult, ProjectPin, FilterState } from '@/types/maps'

const HomeMap = dynamic(() => import('@/components/map/HomeMap'), { ssr: false })

const DEFAULT_FILTERS: FilterState = { property_type: '', price_min: 0, price_max: 100 }

function countActiveFilters(f: FilterState): number {
  let n = 0
  if (f.property_type) n++
  if (f.price_min > 0 || f.price_max < 100) n++
  if (f.province) n++
  if (f.district) n++
  if (f.statuses?.length) n++
  if (f.red_book_statuses?.length) n++
  if (f.ownership_terms?.length) n++
  if (f.amenities?.length) n++
  if (f.rent_2br_min || f.rental_yield_pct_min) n++
  if (f.developer_search) n++
  if (f.year_handover_max) n++
  return n
}

export default function MapPage() {
  const searchParams = useSearchParams()
  const rawMode = searchParams.get('mode')
  const mode: Mode = rawMode === 'rent_long' ? 'rent_long' : 'sale'

  const [flyTo, setFlyTo] = useState<SearchResult | null>(null)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [pins, setPins] = useState<ProjectPin[]>([])
  const [selectedPin, setSelectedPin] = useState<ProjectPin | null>(null)
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false)

  const geolocateFnRef = useRef<(() => void) | null>(null)

  const handleGeolocateReady = useCallback((fn: () => void) => {
    geolocateFnRef.current = fn
  }, [])

  const handleNavGeolocate = useCallback(() => {
    geolocateFnRef.current?.()
  }, [])

  const handlePinSelect = useCallback((pin: ProjectPin | null) => {
    setSelectedPin(pin)
  }, [])

  const handleFiltersChange = useCallback((f: FilterState) => {
    setFilters(f)
    setSelectedPin(null)
  }, [])

  const activeCount = countActiveFilters(filters)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Nav mode={mode} onSearchSelect={setFlyTo} onGeolocate={handleNavGeolocate} />

      {/* Body: 3-column layout below nav */}
      <main className="flex flex-1 overflow-hidden pt-14">
        {/* Left: Filter sidebar (desktop only) */}
        <div className="hidden md:flex">
          <FilterSidebar
            mode={mode}
            filters={filters}
            onChange={handleFiltersChange}
            count={pins.length}
          />
        </div>

        {/* Center: Map */}
        <div className="flex-1 relative">
          <HomeMap
            mode={mode}
            flyTo={flyTo}
            filters={filters}
            selectedPin={selectedPin}
            onPinSelect={handlePinSelect}
            onPinsUpdate={setPins}
            onGeolocateReady={handleGeolocateReady}
          />

          {/* Mobile filter FAB — centered at bottom, above map controls */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 md:hidden">
            <button
              onClick={() => setFilterDrawerOpen(true)}
              className="flex items-center gap-2 bg-white text-[#0D1B3D] text-sm font-medium px-4 py-2 rounded-full shadow-md border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
            >
              <svg className="w-4 h-4 text-[#1565FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4h18M7 8h10M11 12h2M9 16h6" />
              </svg>
              Bộ lọc
              {activeCount > 0 && (
                <span className="bg-[#1565FF] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {activeCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Right: Project list (desktop only) */}
        <div className="hidden md:flex">
          <ProjectRightPanel
            pins={pins}
            selectedPin={selectedPin}
            onPinSelect={handlePinSelect}
            mode={mode}
          />
        </div>
      </main>

      {/* Mobile bottom sheet — shown when a pin is selected */}
      <ProjectBottomSheet
        pin={selectedPin}
        mode={mode}
        onClose={() => setSelectedPin(null)}
      />

      {/* Mobile filter drawer */}
      {filterDrawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setFilterDrawerOpen(false)}
          />

          {/* Drawer */}
          <div className="relative bg-white rounded-t-2xl max-h-[90vh] flex flex-col shadow-2xl">
            {/* Drawer header with close */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#E2E8F0] shrink-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-[#0D1B3D]">Bộ lọc</span>
                <span className="text-xs text-[#64748B]">
                  {pins.length > 0 ? `${pins.length} dự án` : ''}
                </span>
              </div>
              <button
                onClick={() => setFilterDrawerOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#F1F5F9] text-[#64748B] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sidebar content — mobile mode: full-width, no own header */}
            <div className="flex-1 overflow-y-auto">
              <FilterSidebar
                mode={mode}
                filters={filters}
                onChange={handleFiltersChange}
                count={pins.length}
                mobile
              />
            </div>

            {/* Apply button */}
            <div className="shrink-0 px-4 py-3 border-t border-[#E2E8F0] bg-white">
              <button
                onClick={() => setFilterDrawerOpen(false)}
                className="w-full bg-[#1565FF] text-white text-sm font-semibold py-3 rounded-xl hover:bg-[#0D4FCC] transition-colors"
              >
                Xem {pins.length > 0 ? `${pins.length} dự án` : 'kết quả'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
