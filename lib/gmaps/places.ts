import { getPlaceCache, setPlaceCache, PlaceRow } from './cache'

const GMAPS_BASE = 'https://maps.googleapis.com/maps/api'

export type PlaceResult = PlaceRow

function mapRawToPlace(r: Record<string, unknown>): PlaceResult {
  const geo = r.geometry as { location: { lat: number; lng: number } }
  return {
    placeId: r.place_id as string,
    name: r.name as string,
    formattedAddress: (r.formatted_address ?? r.vicinity ?? '') as string,
    lat: geo.location.lat,
    lng: geo.location.lng,
    types: (r.types as string[]) ?? [],
    rating: r.rating != null ? Number(r.rating) : null,
    userRatingsTotal: r.user_ratings_total != null ? Number(r.user_ratings_total) : null,
    rawResponse: r as Record<string, unknown>,
  }
}

/**
 * Text Search — always calls API (no query-level cache), but upserts each
 * returned place into gmaps_places_cache by place_id (90d TTL).
 */
export async function textSearch(
  query: string,
  options?: { region?: string }
): Promise<PlaceResult[]> {
  const key = process.env.GOOGLE_MAPS_API_KEY!
  const params = new URLSearchParams({ query, key })
  if (options?.region) params.set('region', options.region)

  const res = await fetch(`${GMAPS_BASE}/place/textsearch/json?${params}`)
  const data = await res.json()

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places Text Search failed: ${data.status}`)
  }

  const results: PlaceResult[] = (data.results ?? []).map(mapRawToPlace)

  await Promise.all(results.map((p) => setPlaceCache(p)))

  return results
}

/**
 * Place Details by place_id — checks 90d cache first, falls back to API.
 */
export async function getPlaceDetails(placeId: string): Promise<PlaceResult | null> {
  const cached = await getPlaceCache(placeId)
  if (cached) return cached

  const key = process.env.GOOGLE_MAPS_API_KEY!
  const fields = 'place_id,name,formatted_address,geometry,types,rating,user_ratings_total'
  const res = await fetch(
    `${GMAPS_BASE}/place/details/json?place_id=${placeId}&fields=${fields}&key=${key}`
  )
  const data = await res.json()

  if (data.status !== 'OK' || !data.result) return null

  const place = mapRawToPlace(data.result)
  await setPlaceCache(place)
  return place
}
