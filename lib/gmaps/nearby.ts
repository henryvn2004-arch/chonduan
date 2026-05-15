import { getNearbyCache, setNearbyCache } from './cache'

const GMAPS_BASE = 'https://maps.googleapis.com/maps/api'

export interface NearbyPlace {
  placeId: string
  name: string
  vicinity: string
  lat: number
  lng: number
  types: string[]
  rating: number | null
  userRatingsTotal: number | null
}

export async function nearbySearch(
  lat: number,
  lng: number,
  radiusM: number,
  category: string
): Promise<NearbyPlace[]> {
  const cached = await getNearbyCache(lat, lng, radiusM, category)
  if (cached) return cached as NearbyPlace[]

  const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!
  const res = await fetch(
    `${GMAPS_BASE}/place/nearbysearch/json` +
      `?location=${lat},${lng}&radius=${radiusM}&type=${encodeURIComponent(category)}&key=${key}`
  )
  const data = await res.json()

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Nearby Search failed: ${data.status}`)
  }

  const results: NearbyPlace[] = (data.results ?? []).map((r: Record<string, unknown>) => {
    const geo = r.geometry as { location: { lat: number; lng: number } }
    return {
      placeId: r.place_id as string,
      name: r.name as string,
      vicinity: r.vicinity as string,
      lat: geo.location.lat,
      lng: geo.location.lng,
      types: (r.types as string[]) ?? [],
      rating: r.rating != null ? Number(r.rating) : null,
      userRatingsTotal: r.user_ratings_total != null ? Number(r.user_ratings_total) : null,
    }
  })

  await setNearbyCache(lat, lng, radiusM, category, results)
  return results
}
