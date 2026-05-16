'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { ProjectPin, Mode, SearchResult, FilterState } from '@/types/maps'
import { createMarkerIcon } from './pin-marker'

const DEFAULT_CENTER: [number, number] = [106.7009, 10.7769] // HCMC [lng, lat]
const DEFAULT_ZOOM = 11

const STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    },
    satellite: {
      type: 'raster',
      tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
      tileSize: 256,
      attribution: '© <a href="https://www.esri.com">Esri</a>',
    },
  },
  layers: [
    { id: 'osm', type: 'raster', source: 'osm' },
    { id: 'satellite', type: 'raster', source: 'satellite', layout: { visibility: 'none' } },
  ],
}

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
  const mapRef = useRef<maplibregl.Map | null>(null)
  const markersRef = useRef<Map<string, maplibregl.Marker>>(new Map())
  const pinsDataRef = useRef<Map<string, ProjectPin>>(new Map())
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const filtersRef = useRef(filters)
  const modeRef = useRef(mode)
  const selectedPinIdRef = useRef<string | null>(null)

  const [mapReady, setMapReady] = useState(false)
  const [locating, setLocating] = useState(false)
  const [satellite, setSatellite] = useState(false)

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
    const map = new maplibregl.Map({
      container: mapDivRef.current,
      style: STYLE,
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
      const marker = new maplibregl.Marker({ element: el, anchor: 'bottom' })
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
    if (f.price_max < 200) params.set('price_max', String(f.price_max))
    if (f.tiers?.length)            params.set('tiers', f.tiers.join(','))
    if (f.statuses?.length)         params.set('statuses', f.statuses.join(','))
    if (f.red_book_statuses?.length) params.set('red_book_statuses', f.red_book_statuses.join(','))
    if (f.land_origin_types?.length) params.set('land_origin_types', f.land_origin_types.join(','))
    if (f.ownership_terms?.length)  params.set('ownership_terms', f.ownership_terms.join(','))
    if (f.main_directions?.length)  params.set('main_directions', f.main_directions.join(','))
    if (f.noise_levels?.length)     params.set('noise_levels', f.noise_levels.join(','))
    if (f.amenities?.length)        params.set('amenities', f.amenities.join(','))
    if (f.legal_score_min)          params.set('legal_score_min', String(f.legal_score_min))
    if (f.investment_score_min)     params.set('investment_score_min', String(f.investment_score_min))
    if (f.bql_rating_min)           params.set('bql_rating_min', String(f.bql_rating_min))
    if (f.review_rating_min)        params.set('review_rating_min', String(f.review_rating_min))
    if (f.year_handover_max)        params.set('year_handover_max', String(f.year_handover_max))
    if (f.flood_risk_max !== undefined) params.set('flood_risk_max', String(f.flood_risk_max))
    if (f.rent_2br_min)             params.set('rent_2br_min', String(f.rent_2br_min))
    if (f.rent_2br_max && f.rent_2br_max < 100) params.set('rent_2br_max', String(f.rent_2br_max))
    if (f.rental_yield_pct_min)     params.set('rental_yield_pct_min', String(f.rental_yield_pct_min))
    if (f.developer_search)         params.set('developer_search', f.developer_search)
    if (f.rent_demand_score_min)    params.set('rent_demand_score_min', String(f.rent_demand_score_min))
    if (f.rent_trend)               params.set('rent_trend', f.rent_trend)
    if (f.is_expat_friendly)        params.set('is_expat_friendly', 'true')

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

      {/* Right controls: geolocate + zoom */}
      <div className="absolute bottom-6 right-3 z-10 flex flex-col items-center gap-2">
        <button
          onClick={geolocate}
          disabled={locating}
          className="w-10 h-10 bg-white rounded-lg shadow-md flex items-center justify-center hover:bg-[#F1F5F9] transition-colors border border-[#E2E8F0] disabled:opacity-50"
          title="Vị trí của tôi"
        >
          {locating ? (
            <div className="w-4 h-4 border-2 border-[#1565FF] border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-5 h-5 text-[#1565FF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8a4 4 0 100 8 4 4 0 000-8z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v2m0 16v2M2 12h2m16 0h2" />
            </svg>
          )}
        </button>
        <div className="flex flex-col bg-white rounded-lg shadow-md border border-[#E2E8F0] overflow-hidden">
          <button
            onClick={() => mapRef.current?.zoomIn()}
            className="w-10 h-10 flex items-center justify-center hover:bg-[#F1F5F9] transition-colors border-b border-[#E2E8F0] text-[#0D1B3D]"
            title="Phóng to"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16M4 12h16" />
            </svg>
          </button>
          <button
            onClick={() => mapRef.current?.zoomOut()}
            className="w-10 h-10 flex items-center justify-center hover:bg-[#F1F5F9] transition-colors text-[#0D1B3D]"
            title="Thu nhỏ"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 12h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Layers button — bottom left */}
      <button
        onClick={() => {
          const map = mapRef.current
          if (!map) return
          const next = !satellite
          map.setLayoutProperty('satellite', 'visibility', next ? 'visible' : 'none')
          map.setLayoutProperty('osm', 'visibility', next ? 'none' : 'visible')
          setSatellite(next)
        }}
        className={`absolute bottom-6 left-3 z-10 flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl shadow-md border transition-colors ${satellite ? 'bg-[#1565FF] border-[#1565FF]' : 'bg-white border-[#E2E8F0] hover:bg-[#F1F5F9]'}`}
        title={satellite ? 'Bản đồ' : 'Vệ tinh'}
      >
        <svg className={`w-5 h-5 ${satellite ? 'text-white' : 'text-[#64748B]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 9m0 8V9m0 0L9 7" />
        </svg>
        <span className={`text-[10px] font-medium ${satellite ? 'text-white' : 'text-[#64748B]'}`}>Layers</span>
      </button>
    </div>
  )
}
