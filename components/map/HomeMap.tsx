'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import type { ProjectPin, Mode, SearchResult } from '@/types/maps'
import { createPinElement } from './pin-marker'
import ProjectBottomSheet from './ProjectBottomSheet'

// HCMC default center
const DEFAULT_CENTER = { lat: 10.7769, lng: 106.7009 }
const DEFAULT_ZOOM = 12

let mapsInitialized = false
function initMapsOptions() {
  if (mapsInitialized) return
  mapsInitialized = true
  setOptions({
    key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
    v: 'weekly',
  })
}

interface Props {
  mode: Mode
  flyTo?: SearchResult | null
}

export default function HomeMap({ mode, flyTo }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.marker.AdvancedMarkerElement>>(new Map())
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const activeIdRef = useRef<string | null>(null)
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [selectedPin, setSelectedPin] = useState<ProjectPin | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [locating, setLocating] = useState(false)

  // Load maps JS and init map once
  useEffect(() => {
    let cancelled = false
    async function init() {
      initMapsOptions()
      await importLibrary('maps')
      await importLibrary('marker')
      if (cancelled || !mapDivRef.current) return

      const map = new google.maps.Map(mapDivRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ?? 'DEMO_MAP_ID',
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
        gestureHandling: 'greedy',
        clickableIcons: false,
      })

      mapRef.current = map
      clustererRef.current = new MarkerClusterer({ map })
      setMapReady(true)
    }
    init()
    return () => { cancelled = true }
  }, [])

  // Fetch pins on bounds change (debounced)
  const fetchPins = useCallback(async (m: Mode) => {
    const map = mapRef.current
    if (!map) return
    const bounds = map.getBounds()
    if (!bounds) return

    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()
    const url = `/api/projects/by-bounds?swLat=${sw.lat()}&swLng=${sw.lng()}&neLat=${ne.lat()}&neLng=${ne.lng()}&mode=${m}`
    const res = await fetch(url)
    if (!res.ok) return
    const pins: ProjectPin[] = await res.json()
    renderPins(pins, m)
  }, [])

  function renderPins(pins: ProjectPin[], m: Mode) {
    const map = mapRef.current
    const clusterer = clustererRef.current
    if (!map || !clusterer) return

    const incoming = new Map(pins.map((p) => [p.id, p]))
    const existing = markersRef.current

    // Remove markers no longer in viewport
    for (const [id, marker] of existing) {
      if (!incoming.has(id)) {
        marker.map = null
        existing.delete(id)
      }
    }

    const toAdd: google.maps.marker.AdvancedMarkerElement[] = []

    for (const pin of pins) {
      if (existing.has(pin.id)) {
        // Update pin element for mode change
        const marker = existing.get(pin.id)!
        marker.content = createPinElement(pin, m, activeIdRef.current === pin.id)
        continue
      }

      const isActive = activeIdRef.current === pin.id
      const el = createPinElement(pin, m, isActive)

      const marker = new google.maps.marker.AdvancedMarkerElement({
        position: { lat: Number(pin.lat), lng: Number(pin.lng) },
        content: el,
        title: pin.name_official,
      })

      marker.addListener('click', () => {
        // Deactivate previous
        if (activeIdRef.current && existing.has(activeIdRef.current)) {
          const prev = existing.get(activeIdRef.current)!
          const prevPin = pins.find((p) => p.id === activeIdRef.current)
          if (prevPin) prev.content = createPinElement(prevPin, m, false)
        }
        activeIdRef.current = pin.id
        marker.content = createPinElement(pin, m, true)
        setSelectedPin(pin)
      })

      existing.set(pin.id, marker)
      toAdd.push(marker)
    }

    if (toAdd.length > 0) {
      clusterer.addMarkers(toAdd)
    }
  }

  // Re-fetch on mode change when map is ready
  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current!

    const handler = () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
      fetchTimerRef.current = setTimeout(() => fetchPins(mode), 400)
    }

    map.addListener('bounds_changed', handler)
    // Trigger immediately for current bounds
    fetchPins(mode)

    return () => google.maps.event.clearListeners(map, 'bounds_changed')
  }, [mapReady, mode, fetchPins])

  // Fly to search result
  useEffect(() => {
    if (!flyTo || !mapReady) return
    const map = mapRef.current!
    if (flyTo.lat && flyTo.lng) {
      map.panTo({ lat: flyTo.lat, lng: flyTo.lng })
      map.setZoom(15)
    }
  }, [flyTo, mapReady])

  function handleGeolocate() {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        mapRef.current?.setZoom(14)
        setLocating(false)
      },
      () => setLocating(false)
    )
  }

  function handleCloseSheet() {
    if (activeIdRef.current && markersRef.current.has(activeIdRef.current)) {
      // Re-fetch current pins to reset active state
    }
    activeIdRef.current = null
    setSelectedPin(null)
  }

  return (
    <div className="relative w-full h-full">
      {/* Map container */}
      <div ref={mapDivRef} className="w-full h-full" />

      {/* Loading overlay */}
      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F5F7FA]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-3 border-[#1565FF] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-[#64748B]">Đang tải bản đồ...</p>
          </div>
        </div>
      )}

      {/* Geolocation button */}
      <button
        onClick={handleGeolocate}
        disabled={locating}
        className="absolute bottom-6 right-14 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-[#F1F5F9] transition-colors border border-[#E2E8F0] disabled:opacity-50"
        title="Vị trí của tôi"
      >
        {locating ? (
          <div className="w-4 h-4 border-2 border-[#1565FF] border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5 text-[#1565FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="12" cy="12" r="3" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3m0 14v3M2 12h3m14 0h3" />
          </svg>
        )}
      </button>

      {/* Bottom sheet / card */}
      <ProjectBottomSheet pin={selectedPin} mode={mode} onClose={handleCloseSheet} />
    </div>
  )
}
