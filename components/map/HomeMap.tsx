'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import vietmapgl from '@vietmap/vietmap-gl-js'
import '@vietmap/vietmap-gl-js/dist/vietmap-gl.css'
import type { ProjectPin, Mode, SearchResult, FilterState } from '@/types/maps'
import { createMarkerIcon } from './pin-marker'

const DEFAULT_CENTER: [number, number] = [106.7009, 10.7769] // HCMC [lng, lat]
const DEFAULT_ZOOM = 11

const STYLE_URL = `https://maps.vietmap.vn/api/maps/light/styles.json?apikey=${process.env.NEXT_PUBLIC_VIETMAP_API_KEY ?? ''}`

interface Props {
  mode: Mode
  flyTo?: SearchResult | null
  filters: FilterState
  selectedPin: ProjectPin | null
  onPinSelect: (pin: ProjectPin | null) => void
  onPinsUpdate: (pins: ProjectPin[]) => void
  onGeolocateReady?: (fn: () => void) => void
}

function makeMarkerEl(pin: ProjectPin, mode: Mode, active: boolean): HTMLImageElement {
  const cfg = createMarkerIcon(pin, mode, active)
  const img = document.createElement('img')
  img.src = cfg.url
  img.width = cfg.scaledSize[0]
  img.height = cfg.scaledSize[1]
  img.style.cursor = 'pointer'
  img.draggable = false
  return img
}

function updateMarkerEl(el: HTMLElement, pin: ProjectPin, mode: Mode, active: boolean) {
  const cfg = createMarkerIcon(pin, mode, active)
  const img = el as HTMLImageElement
  img.src = cfg.url
  img.width = cfg.scaledSize[0]
  img.height = cfg.scaledSize[1]
}

export default function HomeMap({ mode, flyTo, filters, selectedPin, onPinSelect, onPinsUpdate, onGeolocateReady }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<vietmapgl.Map | null>(null)
  const markersRef = useRef<Map<string, vietmapgl.Marker>>(new Map())
  const pinsDataRef = useRef<Map<string, ProjectPin>>(new Map())
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const filtersRef = useRef(filters)
  const modeRef = useRef(mode)
  const selectedPinIdRef = useRef<string | null>(null)

  const [mapReady, setMapReady] = useState(false)
  const [locating, setLocating] = useState(false)

  filtersRef.current = filters
  modeRef.current = mode
  selectedPinIdRef.current = selectedPin?.id ?? null

  const geolocate = useCallback(() => {
    if (!navigator.geolocation) return
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        mapRef.current?.flyTo({ center: [pos.coords.longitude, pos.coords.latitude], zoom: 14 })
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
    if (!mapDivRef.current) return
    const map = new vietmapgl.Map({
      container: mapDivRef.current,
      style: STYLE_URL,
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
      attributionControl: false,
    })

    map.on('load', () => {
      mapRef.current = map
      setMapReady(true)
    })

    return () => {
      map.remove()
      mapRef.current = null
    }
  }, [])

  const renderPins = useCallback((pins: ProjectPin[], m: Mode, selId: string | null) => {
    const map = mapRef.current
    if (!map) return

    const incoming = new Map(pins.map(p => [p.id, p]))

    for (const [id, marker] of markersRef.current) {
      if (!incoming.has(id)) {
        marker.remove()
        markersRef.current.delete(id)
        pinsDataRef.current.delete(id)
      }
    }

    for (const pin of pins) {
      pinsDataRef.current.set(pin.id, pin)
      const isActive = selId === pin.id

      if (markersRef.current.has(pin.id)) {
        updateMarkerEl(markersRef.current.get(pin.id)!.getElement(), pin, m, isActive)
        continue
      }

      const el = makeMarkerEl(pin, m, isActive)
      const marker = new vietmapgl.Marker({ element: el, anchor: 'bottom' })
        .setLngLat([Number(pin.lng), Number(pin.lat)])
        .addTo(map)

      el.addEventListener('click', () => onPinSelect(pin))
      markersRef.current.set(pin.id, marker)
    }
  }, [onPinSelect])

  const fetchPins = useCallback(async (m: Mode, f: FilterState) => {
    const map = mapRef.current
    if (!map) return
    const bounds = map.getBounds()
    if (!bounds) return

    const params = new URLSearchParams({
      swLat: String(bounds.getSouth()),
      swLng: String(bounds.getWest()),
      neLat: String(bounds.getNorth()),
      neLng: String(bounds.getEast()),
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
    } catch { /* ignore */ }
  }, [renderPins, onPinsUpdate])

  // Update marker icons when selectedPin changes
  useEffect(() => {
    for (const [id, marker] of markersRef.current) {
      const pin = pinsDataRef.current.get(id)
      if (!pin) continue
      updateMarkerEl(marker.getElement(), pin, modeRef.current, selectedPin?.id === id)
    }
  }, [selectedPin])

  // Re-fetch on mode/filters/mapReady change
  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current!

    for (const [id, marker] of markersRef.current) {
      const pin = pinsDataRef.current.get(id)
      if (!pin) continue
      updateMarkerEl(marker.getElement(), pin, mode, selectedPin?.id === id)
    }

    const handler = () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
      fetchTimerRef.current = setTimeout(() => fetchPins(modeRef.current, filtersRef.current), 400)
    }

    map.on('moveend', handler)
    fetchPins(mode, filters)
    return () => { map.off('moveend', handler) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapReady, mode, filters])

  // Fly to search result
  useEffect(() => {
    if (!flyTo || !mapReady || !flyTo.lat || !flyTo.lng) return
    mapRef.current?.flyTo({ center: [flyTo.lng, flyTo.lat], zoom: 15 })
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

      <button className="absolute bottom-20 left-3 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-[#F1F5F9] transition-colors border border-[#E2E8F0]">
        <svg className="w-5 h-5 text-[#64748B]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </button>
    </div>
  )
}
