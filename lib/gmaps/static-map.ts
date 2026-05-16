const STATIC_MAPS_BASE = 'https://maps.googleapis.com/maps/api/staticmap'

export interface StaticMapOptions {
  lat: number
  lng: number
  zoom?: number
  width?: number
  height?: number
  /** Map scale: 1 (default) or 2 (HiDPI/retina) */
  scale?: 1 | 2
  maptype?: 'roadmap' | 'satellite' | 'terrain' | 'hybrid'
  markers?: StaticMapMarker[]
}

export interface StaticMapMarker {
  lat: number
  lng: number
  color?: string
  label?: string
}

/**
 * Builds a Static Maps URL — no API call, no cache (URL-only, billed on client load).
 * Use this on homepage instead of Maps JS to cut cost 3.5×.
 */
export function staticMapUrl(options: StaticMapOptions): string {
  const {
    lat,
    lng,
    zoom = 15,
    width = 600,
    height = 400,
    scale = 1,
    maptype = 'roadmap',
    markers = [],
  } = options

  const key = process.env.GOOGLE_MAPS_API_KEY!
  const params = new URLSearchParams({
    center: `${lat},${lng}`,
    zoom: String(zoom),
    size: `${width}x${height}`,
    scale: String(scale),
    maptype,
    key,
  })

  for (const m of markers) {
    const parts: string[] = []
    if (m.color) parts.push(`color:${m.color}`)
    if (m.label) parts.push(`label:${m.label}`)
    parts.push(`${m.lat},${m.lng}`)
    params.append('markers', parts.join('|'))
  }

  return `${STATIC_MAPS_BASE}?${params}`
}
