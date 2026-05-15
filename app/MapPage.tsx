'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import Nav from '@/components/nav/Nav'
import type { Mode, SearchResult } from '@/types/maps'

// Lazy-load HomeMap (heavy — Google Maps JS)
const HomeMap = dynamic(() => import('@/components/map/HomeMap'), { ssr: false })

export default function MapPage() {
  const searchParams = useSearchParams()
  const rawMode = searchParams.get('mode')
  const mode: Mode = rawMode === 'rent_long' ? 'rent_long' : 'sale'

  const [flyTo, setFlyTo] = useState<SearchResult | null>(null)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Nav mode={mode} onSearchSelect={setFlyTo} />
      <main className="flex-1 pt-[57px] relative">
        <HomeMap mode={mode} flyTo={flyTo} />
      </main>
    </div>
  )
}
