import { getPlaceCache, setPlaceCache, PlaceRow } from './cache'

const NOMINATIM = 'https://nominatim.openstreetmap.org'
const UA = 'ChonDuAn/1.0 (phaplyduan.vn)'

export type PlaceResult = PlaceRow

function nominatimToPlace(r: Record<string, unknown>): PlaceResult {
  return {
    placeId: `osm:${r.osm_type}/${r.osm_id}`,
    name: (r.name ?? r.display_name ?? '') as string,
    formattedAddress: r.display_name as string,
    lat: parseFloat(r.lat as string),
    lng: parseFloat(r.lon as string),
    types: [(r.type as string) ?? (r.category as string) ?? 'place'],
    rating: null,
    userRatingsTotal: null,
    rawResponse: r,
  }
}

// Text search via Nominatim — no query-level cache, caches each result by osm id
export async function textSearch(
  query: string,
  options?: { region?: string }
): Promise<PlaceResult[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '5',
    addressdetails: '1',
    countrycodes: options?.region ?? 'vn',
  })

  const res = await fetch(`${NOMINATIM}/search?${params}`, {
    headers: { 'User-Agent': UA },
  })
  const data = await res.json()

  if (!Array.isArray(data)) return []

  const results: PlaceResult[] = data.map(nominatimToPlace)
  await Promise.all(results.map((p) => setPlaceCache(p)))
  return results
}

// Lookup by OSM place_id ("osm:node/12345") — checks cache first
export async function getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
  const cached = await getPlaceCache(placeId)
  if (cached) return cached

  // Parse "osm:node/12345" → osm_type=node, osm_id=12345
  const match = placeId.match(/^osm:(\w+)\/(\d+)$/)
  if (!match) return null

  const [, osmType, osmId] = match
  const params = new URLSearchParams({
    osm_type: osmType[0].toUpperCase(), // N, W, R
    osm_id: osmId,
    format: 'json',
    addressdetails: '1',
  })

  const res = await fetch(`${NOMINATIM}/lookup?${params}`, {
    headers: { 'User-Agent': UA },
  })
  const data = await res.json()

  if (!Array.isArray(data) || !data[0]) return null

  const place = nominatimToPlace(data[0])
  await setPlaceCache(place)
  return place
}
