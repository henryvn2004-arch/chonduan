import { createHash } from 'crypto'
import { getGeocodeCache, setGeocodeCache } from './cache'

const GMAPS_BASE = 'https://maps.googleapis.com/maps/api'

export interface GeocodeResult {
  lat: number
  lng: number
  formattedAddress: string
  placeId: string
}

export async function geocode(address: string): Promise<GeocodeResult | null> {
  const normalized = address.toLowerCase().trim()
  const hash = createHash('sha256').update(normalized).digest('hex')

  const cached = await getGeocodeCache(hash)
  if (cached) return cached

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
  const res = await fetch(
    `${GMAPS_BASE}/geocode/json?address=${encodeURIComponent(address)}&key=${key}`
  )
  const data = await res.json()

  if (data.status !== 'OK' || !data.results?.[0]) return null

  const r = data.results[0]
  const result: GeocodeResult = {
    lat: r.geometry.location.lat,
    lng: r.geometry.location.lng,
    formattedAddress: r.formatted_address,
    placeId: r.place_id,
  }

  await setGeocodeCache(hash, address, result)
  return result
}
