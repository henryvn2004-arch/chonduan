import { getNearbyCache, setNearbyCache } from './cache'

const OVERPASS = 'https://overpass-api.de/api/interpreter'
const UA = 'ChonDuAn/1.0 (chonduan.vn)'

export interface NearbyPlace {
  placeId: string   // "osm:node/12345"
  name: string
  vicinity: string
  lat: number
  lng: number
  types: string[]
  rating: number | null         // OSM has no ratings → always null
  userRatingsTotal: number | null
}

// Map category names → Overpass tag filters
const CATEGORY_FILTER: Record<string, string> = {
  school:           '["amenity"~"school|kindergarten|university|college"]',
  hospital:         '["amenity"~"hospital|clinic|doctors|pharmacy"]',
  mall:             '["shop"~"mall|supermarket|department_store"]',
  metro_station:    '["railway"~"station|subway_entrance"]',
  subway_station:   '["railway"~"station|subway_entrance"]',
  restaurant:       '["amenity"="restaurant"]',
  park:             '["leisure"="park"]',
  bank:             '["amenity"="bank"]',
  supermarket:      '["shop"="supermarket"]',
}

function buildOverpassQuery(lat: number, lng: number, radiusM: number, filter: string): string {
  return `[out:json][timeout:15];
(
  node${filter}(around:${radiusM},${lat},${lng});
  way${filter}(around:${radiusM},${lat},${lng});
);
out center 20;`
}

export async function nearbySearch(
  lat: number,
  lng: number,
  radiusM: number,
  category: string
): Promise<NearbyPlace[]> {
  const cached = await getNearbyCache(lat, lng, radiusM, category)
  if (cached) return cached as NearbyPlace[]

  const filter = CATEGORY_FILTER[category] ?? `["amenity"="${category}"]`
  const query = buildOverpassQuery(lat, lng, radiusM, filter)

  const res = await fetch(OVERPASS, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA },
    body: `data=${encodeURIComponent(query)}`,
  })
  const data = await res.json()

  const results: NearbyPlace[] = (data.elements ?? [])
    .filter((el: Record<string, unknown>) => el.tags && (el.lat || el.center))
    .slice(0, 10)
    .map((el: Record<string, unknown>) => {
      const tags = el.tags as Record<string, string>
      const elLat = (el.lat ?? (el.center as { lat: number })?.lat) as number
      const elLng = (el.lon ?? (el.center as { lon: number })?.lon) as number
      return {
        placeId: `osm:${el.type}/${el.id}`,
        name: tags.name ?? tags['name:vi'] ?? tags['name:en'] ?? category,
        vicinity: tags['addr:street'] ?? tags['addr:full'] ?? '',
        lat: elLat,
        lng: elLng,
        types: [category],
        rating: null,
        userRatingsTotal: null,
      }
    })

  await setNearbyCache(lat, lng, radiusM, category, results)
  return results
}
