'use client'

import { useState, useCallback, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Nav from '@/components/nav/Nav'
import FilterSidebar from '@/components/map/FilterSidebar'
import ProjectRightPanel from '@/components/map/ProjectRightPanel'
import type { Mode, SearchResult, ProjectPin, FilterState } from '@/types/maps'

const HomeMap = dynamic(() => import('@/components/map/HomeMap'), { ssr: false })

const DEFAULT_FILTERS: FilterState = { property_type: '', price_min: 0, price_max: 100 }

export default function MapPage({ mapsApiKey }: { mapsApiKey: string }) {
  const searchParams = useSearchParams()
  const rawMode = searchParams.get('mode')
  const mode: Mode = rawMode === 'rent_long' ? 'rent_long' : 'sale'

  const [flyTo, setFlyTo] = useState<SearchResult | null>(null)
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [pins, setPins] = useState<ProjectPin[]>([])
  const [selectedPin, setSelectedPin] = useState<ProjectPin | null>(null)

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

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Nav mode={mode} onSearchSelect={setFlyTo} onGeolocate={handleNavGeolocate} />

      {/* Body: 3-column layout below nav */}
      <main className="flex flex-1 overflow-hidden pt-14">
        {/* Left: Filter sidebar (desktop only) */}
        <div className="hidden md:flex">
          <FilterSidebar
            filters={filters}
            onChange={handleFiltersChange}
            count={pins.length}
          />
        </div>

        {/* Center: Map */}
        <div className="flex-1 relative">
          <HomeMap
            mapsApiKey={mapsApiKey}
            mode={mode}
            flyTo={flyTo}
            filters={filters}
            selectedPin={selectedPin}
            onPinSelect={handlePinSelect}
            onPinsUpdate={setPins}
            onGeolocateReady={handleGeolocateReady}
          />
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
    </div>
  )
}
