'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { setOptions, importLibrary } from '@googlemaps/js-api-loader'
import { MarkerClusterer } from '@googlemaps/markerclusterer'
import type { ProjectPin, Mode, SearchResult } from '@/types/maps'
import { createMarkerIcon } from './pin-marker'
import ProjectBottomSheet from './ProjectBottomSheet'

const DEFAULT_CENTER = { lat: 10.7769, lng: 106.7009 } // HCMC
const DEFAULT_ZOOM = 12

let mapsInitialized = false
function initMapsOptions() {
  if (mapsInitialized) return
  mapsInitialized = true
  setOptions({ key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '', v: 'weekly' })
}

interface Props {
  mode: Mode
  flyTo?: SearchResult | null
}

export default function HomeMap({ mode, flyTo }: Props) {
  const mapDivRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<google.maps.Map | null>(null)
  const markersRef = useRef<Map<string, google.maps.Marker>>(new Map())
  const clustererRef = useRef<MarkerClusterer | null>(null)
  const pinsDataRef = useRef<Map<string, ProjectPin>>(new Map())
  const activeIdRef = useRef<string | null>(null)
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [selectedPin, setSelectedPin] = useState<ProjectPin | null>(null)
  const [mapReady, setMapReady] = useState(false)
  const [locating, setLocating] = useState(false)

  // Init map once
  useEffect(() => {
    let cancelled = false
    async function init() {
      initMapsOptions()
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

  const renderPins = useCallback((pins: ProjectPin[], m: Mode) => {
    const map = mapRef.current
    const clusterer = clustererRef.current
    if (!map || !clusterer) return

    const incoming = new Map(pins.map((p) => [p.id, p]))

    // Remove markers no longer in viewport
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
      const isActive = activeIdRef.current === pin.id
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
        // Deactivate previous
        if (activeIdRef.current && markersRef.current.has(activeIdRef.current)) {
          const prevPin = pinsDataRef.current.get(activeIdRef.current)
          if (prevPin) {
            const prev = createMarkerIcon(prevPin, m, false)
            markersRef.current.get(activeIdRef.current)!.setIcon({
              url: prev.url,
              scaledSize: new google.maps.Size(...prev.scaledSize),
              anchor: new google.maps.Point(...prev.anchor),
            })
          }
        }
        activeIdRef.current = pin.id
        const active = createMarkerIcon(pin, m, true)
        marker.setIcon({
          url: active.url,
          scaledSize: new google.maps.Size(...active.scaledSize),
          anchor: new google.maps.Point(...active.anchor),
        })
        setSelectedPin(pin)
      })

      markersRef.current.set(pin.id, marker)
      toAdd.push(marker)
    }

    if (toAdd.length > 0) clusterer.addMarkers(toAdd)
  }, [])

  const fetchPins = useCallback(async (m: Mode) => {
    const map = mapRef.current
    if (!map) return
    const bounds = map.getBounds()
    if (!bounds) return
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()
    try {
      const res = await fetch(
        `/api/projects/by-bounds?swLat=${sw.lat()}&swLng=${sw.lng()}&neLat=${ne.lat()}&neLng=${ne.lng()}&mode=${m}`
      )
      if (!res.ok) return
      renderPins(await res.json(), m)
    } catch { /* ignore */ }
  }, [renderPins])

  // Re-register listener + refresh icons on mode change
  useEffect(() => {
    if (!mapReady) return
    const map = mapRef.current!

    // Instantly update existing pin icons for new mode
    for (const [id, marker] of markersRef.current) {
      const pin = pinsDataRef.current.get(id)
      if (!pin) continue
      const iconConfig = createMarkerIcon(pin, mode, activeIdRef.current === id)
      marker.setIcon({
        url: iconConfig.url,
        scaledSize: new google.maps.Size(...iconConfig.scaledSize),
        anchor: new google.maps.Point(...iconConfig.anchor),
      })
    }

    const handler = () => {
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
      fetchTimerRef.current = setTimeout(() => fetchPins(mode), 400)
    }

    const listener = map.addListener('bounds_changed', handler)
    fetchPins(mode)
    return () => google.maps.event.removeListener(listener)
  }, [mapReady, mode, fetchPins])

  // Fly to search result
  useEffect(() => {
    if (!flyTo || !mapReady || !flyTo.lat || !flyTo.lng) return
    mapRef.current?.panTo({ lat: flyTo.lat, lng: flyTo.lng })
    mapRef.current?.setZoom(15)
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
    if (activeIdRef.current) {
      const prevPin = pinsDataRef.current.get(activeIdRef.current)
      if (prevPin && markersRef.current.has(activeIdRef.current)) {
        const iconConfig = createMarkerIcon(prevPin, mode, false)
        markersRef.current.get(activeIdRef.current)!.setIcon({
          url: iconConfig.url,
          scaledSize: new google.maps.Size(...iconConfig.scaledSize),
          anchor: new google.maps.Point(...iconConfig.anchor),
        })
      }
    }
    activeIdRef.current = null
    setSelectedPin(null)
  }

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

      <button
        onClick={handleGeolocate}
        disabled={locating}
        className="absolute bottom-24 right-3 z-10 w-10 h-10 bg-white rounded-full shadow-md flex items-center justify-center hover:bg-[#F1F5F9] transition-colors border border-[#E2E8F0] disabled:opacity-50"
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

      <ProjectBottomSheet pin={selectedPin} mode={mode} onClose={handleCloseSheet} />
    </div>
  )
}
