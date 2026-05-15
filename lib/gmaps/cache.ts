import { createClient, SupabaseClient } from '@supabase/supabase-js'

function adminClient(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─── Geocoding cache (permanent) ─────────────────────────────────────────────

export interface GeocodeRow {
  lat: number
  lng: number
  formattedAddress: string
  placeId: string
}

export async function getGeocodeCache(addressHash: string): Promise<GeocodeRow | null> {
  const db = adminClient()
  const { data } = await db
    .from('gmaps_geocoding_cache')
    .select('lat, lng, formatted_address, place_id')
    .eq('address_hash', addressHash)
    .single()

  if (!data) return null
  return {
    lat: Number(data.lat),
    lng: Number(data.lng),
    formattedAddress: data.formatted_address,
    placeId: data.place_id,
  }
}

export async function setGeocodeCache(
  addressHash: string,
  queryText: string,
  row: GeocodeRow
): Promise<void> {
  const db = adminClient()
  await db.from('gmaps_geocoding_cache').upsert({
    address_hash: addressHash,
    query_text: queryText,
    lat: row.lat,
    lng: row.lng,
    formatted_address: row.formattedAddress,
    place_id: row.placeId,
  })
}

// ─── Places cache (90d TTL) ───────────────────────────────────────────────────

export interface PlaceRow {
  placeId: string
  name: string
  formattedAddress: string
  lat: number
  lng: number
  types: string[]
  rating: number | null
  userRatingsTotal: number | null
  rawResponse: Record<string, unknown>
}

export async function getPlaceCache(placeId: string): Promise<PlaceRow | null> {
  const db = adminClient()
  const { data } = await db
    .from('gmaps_places_cache')
    .select('place_id, name, formatted_address, lat, lng, types, rating, user_ratings_total, raw_response, expires_at')
    .eq('place_id', placeId)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!data) return null
  return {
    placeId: data.place_id,
    name: data.name,
    formattedAddress: data.formatted_address,
    lat: Number(data.lat),
    lng: Number(data.lng),
    types: data.types ?? [],
    rating: data.rating ? Number(data.rating) : null,
    userRatingsTotal: data.user_ratings_total,
    rawResponse: data.raw_response,
  }
}

export async function setPlaceCache(row: PlaceRow): Promise<void> {
  const db = adminClient()
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
  await db.from('gmaps_places_cache').upsert({
    place_id: row.placeId,
    name: row.name,
    formatted_address: row.formattedAddress,
    lat: row.lat,
    lng: row.lng,
    types: row.types,
    rating: row.rating,
    user_ratings_total: row.userRatingsTotal,
    raw_response: row.rawResponse,
    fetched_at: new Date().toISOString(),
    expires_at: expiresAt,
  })
}

// ─── Nearby cache (180d TTL) ──────────────────────────────────────────────────

export async function getNearbyCache(
  lat: number,
  lng: number,
  radiusM: number,
  category: string
): Promise<unknown[] | null> {
  const db = adminClient()
  const { data } = await db
    .from('gmaps_nearby_cache')
    .select('results, expires_at')
    .eq('origin_lat', lat)
    .eq('origin_lng', lng)
    .eq('radius_m', radiusM)
    .eq('category', category)
    .gt('expires_at', new Date().toISOString())
    .single()

  if (!data) return null
  return data.results as unknown[]
}

export async function setNearbyCache(
  lat: number,
  lng: number,
  radiusM: number,
  category: string,
  results: unknown[]
): Promise<void> {
  const db = adminClient()
  const expiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
  await db.from('gmaps_nearby_cache').upsert(
    {
      origin_lat: lat,
      origin_lng: lng,
      radius_m: radiusM,
      category,
      results,
      fetched_at: new Date().toISOString(),
      expires_at: expiresAt,
    },
    { onConflict: 'origin_lat,origin_lng,radius_m,category' }
  )
}
