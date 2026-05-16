'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import type { ProjectPin, Mode, SearchResult, FilterState } from '@/types/maps'
import { createMarkerIcon } from './pin-marker'

const DEFAULT_CENTER = { lat: 10.7769, lng: 106.7009 } // HCMC
const DEFAULT_ZOOM = 12

let mapsInitialized = false
function initMapsOptions(apiKey: string) {
  if (mapsInitialized) return
  mapsInitialized = true
  console.log('[Maps] key length:', apiKey.length, '| first4:', apiKey.slice(0, 4))
  setOptions({ key: apiKey, v: 'weekly' })
}

interface Props {
  mapsApiKey: string
  mode: Mode
  flyTo?: SearchResult | null
  filters: FilterState
  selectedPin: ProjectPin | null
  onPinSelect: (pin: ProjectPin | null) => void
  onPinsUpdate: (pins: ProjectPin[]) => void
  onGeolocateReady?: (fn: () => void) => void
}

export default function HomeMap({
  mapsApiKey,
  mode,
  flyTo,
  filters,
  selectedPin,
  onPinSelect,
  onPinsUpdate,
  onGeolocateReady,
}: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const pinsDataRef = useRef<Map<string, ProjectPin>>(new Map())
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const filtersRef = useRef(filters)
  const modeRef = useRef(mode)
  const selectedPinIdRef = useRef<string | null>(null)

  const [mapReady, setMapReady] = useState(false)
  const [locating, setLocating] = useState(false)
  const [mapMoved, setMapMoved] = useState(false)

  filtersRef.current = filters
  modeRef.current = mode
  selectedPinIdRef.current = selectedPin?.id ?? null

  const geolocate = useCallback(() => {
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
  }, [])

  useEffect(() => {
    onGeolocateReady?.(geolocate)
  }, [geolocate, onGeolocateReady])

  // Init map once
  useEffect(() => {
    let cancelled = false
    async function init() {
      initMapsOptions(mapsApiKey)
      await importLibrary('maps')
      if (cancelled || !mapDivRef.current) return

      const map = new google.maps.Map(mapDivRef.current, {
        center: DEFAULT_CENTER,
        zoom: DEFAULT_ZOOM,
        disableDefaultUI: true,
        zoomControl: true,
        zoomControlOptions: { position: google.maps.ControlPosition.RIGHT_CENTER },
        gestureHandling: 'greedy',
        clickableIcons: false,
        styles: [
          { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
        ],
      })

      mapRef.current = map
      clustererRef.current = new MarkerClusterer({ map })
      setMapReady(true)
    }
    init()
    return () => { cancelled = true }
  }, [])

  const renderPins = useCallback((pins: ProjectPin[], m: Mode, selId: string | null) => {
    const map = mapRef.current
    const clusterer = clustererRef.current
    if (!map || !clusterer) return

    const incoming = new Map(pins.map((p) => [p.id, p]))

    for (const [id, marker] of markersRef.current) {
      if (!incoming.has(id)) {
        marker.setMap(null)
        clusterer.removeMarker(marker)
        markersRef.current.delete(id)
        pinsDataRef.current.delete(id)
      }
    }

    const toAdd: google.maps.Marker[] = []

    for (const pin of pins) {
      pinsDataRef.current.set(pin.id, pin)
      const isActive = selId === pin.id
      const iconConfig = createMarkerIcon(pin, m, isActive)
      const icon: google.maps.Icon = {
        url: iconConfig.url,
        scaledSize: new google.maps.Size(...iconConfig.scaledSize),
        anchor: new google.maps.Point(...iconConfig.anchor),
      }

      if (markersRef.current.has(pin.id)) {
        markersRef.current.get(pin.id)!.setIcon(icon)
        continue
      }

      const marker = new google.maps.Marker({
        position: { lat: Number(pin.lat), lng: Number(pin.lng) },
        icon,
        title: pin.name_official,
        optimized: false,
      })

      marker.addListener('click', () => {
        onPinSelect(pin)
      })

      markersRef.current.set(pin.id, marker)
      toAdd.push(marker)
    }

    if (toAdd.length > 0) clusterer.addMarkers(toAdd)
  }, [onPinSelect])

  const fetchPins = useCallback(async (m: Mode, f: FilterState) => {
    const map = mapRef.current
    if (!map) return
    const bounds = map.getBounds()
    if (!bounds) return
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()

    const params = new URLSearchParams({
      swLat: String(sw.lat()),
      swLng: String(sw.lng()),
      neLat: String(ne.lat()),
      neLng: String(ne.lng()),
      mode: m,
    })
    if (f.property_type) params.set('property_type', f.property_type)
    if (f.price_min > 0) params.set('price_min', String(f.price_min))
    if (f.price_max < 100) params.set('price_max', String(f.price_max))

    try {
      const res = await fetch(`/api/projects/by-bounds?${params}`)
      if (!res.ok) return
      const pins: ProjectPin[] = await res.json()
      renderPins(pins, m, selectedPinIdRef.current)
      onPinsUpdate(pins)
      setMapMoved(false)
    } catch { /* ignore */ }
  }, [renderPins, onPinsUpdate])

  // Update marker icons when selectedPin changes
  useEffect(() => {
    const m = modeRef.current
    for (const [id, marker] of markersRef.current) {
      const pin = pinsDataRef.current.get(id)
      if (!pin) continue
      const isActive = selectedPin?.id === id
      const iconConfig = createMarkerIcon(pin, m, isActive)
      marker.setIcon({
        url: iconConfig.url,
        scaledSize: new google.maps.Size(...iconConfig.scaledSize),
        anchor: new google.maps.Point(...iconConfig.anchor),
      })
    }
  }, [selectedPin])

  // Re-register bounds listener on mode/filters change
  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current!

    for (const [id, marker] of markersRef.current) {
      const pin = pinsDataRef.current.get(id)
      if (!pin) continue
      const iconConfig = createMarkerIcon(pin, mode, selectedPin?.id === id)
      marker.setIcon({
        url: iconConfig.url,
        scaledSize: new google.maps.Size(...iconConfig.scaledSize),
        anchor: new google.maps.Point(...iconConfig.anchor),
      })
    }

    const handler = () => {
      setMapMoved(true)
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
      fetchTimerRef.current = setTimeout(() => fetchPins(modeRef.current, filtersRef.current), 400)
    }

    const listener = map.addListener('bounds_changed', handler)
    fetchPins(mode, filters)
    return () => google.maps.event.removeListener(listener)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, mode, filters])

  // Fly to search result
  useEffect(() => {
    if (!flyTo || !mapReady || !flyTo.lat || !flyTo.lng) return
    mapRef.current?.panTo({ lat: flyTo.lat, lng: flyTo.lng })
    mapRef.current?.setZoom(15)
  }, [flyTo, mapReady])

  return (
    <div className="relative w-full h-full">
      <div ref={mapDivRef} className="w-full h-full" />

      {!mapReady && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#F5F7FA]">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-[3px] border-[#1565FF] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-[#64748B]">Đang tải bản đồ...</p>
          </div>
        </div>
      )}

      {/* Search this area button */}
      {mapReady && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-10">
          <button
            onClick={() => fetchPins(mode, filters)}
            className="flex items-center gap-2 bg-white text-[#0D1B3D] text-sm font-medium px-4 py-2 rounded-full shadow-md border border-[#E2E8F0] hover:bg-[#F8FAFC] transition-colors"
          >
            <svg className="w-4 h-4 text-[#1565FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            Tìm kiếm trong khu vực này
          </button>
        </div>
      )}

      {/* Geolocate button */}
      <button
        onClick={geolocate}
        disabled={locating}
        className="absolute bottom-6 right-3 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-[#F1F5F9] transition-colors border border-[#E2E8F0] disabled:opacity-50"
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

      {/* Layers button */}
      <button className="absolute bottom-20 left-3 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-[#F1F5F9] transition-colors border border-[#E2E8F0]">
        <svg className="w-5 h-5 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </button>
    </div>
  )
}
