import { createHash } from 'crypto'
import { getGeocodeCache, setGeocodeCache } from './cache'

const NOMINATIM = 'https://nominatim.openstreetmap.org'
const UA = 'ChonDuAn/1.0 (phaplyduan.vn)'

export interface GeocodeResult {
  lat: number
  lng: number
  formattedAddress: string
  placeId: string  // "osm:node/12345" format
}

export async function geocode(address: string): Promise<GeocodeResult | null> {
  const normalized = address.toLowerCase().trim()
  const hash = createHash('sha256').update(normalized).digest('hex')

  const cached = await getGeocodeCache(hash)
  if (cached) return cached

  const params = new URLSearchParams({
    q: address,
    format: 'json',
    limit: '1',
    countrycodes: 'vn',
    addressdetails: '1',
  })

  const res = await fetch(`${NOMINATIM}/search?${params}`, {
    headers: { 'User-Agent': UA },
  })
  const data = await res.json()

  if (!data?.[0]) return null

  const r = data[0]
  const result: GeocodeResult = {
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    formattedAddress: r.display_name,
    placeId: `osm:${r.osm_type}/${r.osm_id}`,
  }

  await setGeocodeCache(hash, address, result)
  return result
}
