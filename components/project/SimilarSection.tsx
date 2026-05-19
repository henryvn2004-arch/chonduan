import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { MapPin } from 'lucide-react'

interface NearbyProject {
  id: string
  slug: string
  name_official: string
  province: string
  district: string | null
  banner_url: string | null
  gmaps_photo_url: string | null
  price_primary_per_m2_min: number | null
  tier: string | null
  lat: number | null
  lng: number | null
  distance_km: number
}

// Haversine distance in km
function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

async function fetchNearby(
  lat: number,
  lng: number,
  currentId: string,
  province: string,
): Promise<NearbyProject[]> {
  const supabase = await createClient()

  // ~0.1° ≈ 11km bounding box around current project
  const delta = 0.1
  const { data } = await supabase
    .from('projects')
    .select('id, slug, name_official, province, district, banner_url, gmaps_photo_url, price_primary_per_m2_min, tier, lat, lng')
    .neq('id', currentId)
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .gte('lat', lat - delta)
    .lte('lat', lat + delta)
    .gte('lng', lng - delta)
    .lte('lng', lng + delta)
    .limit(40)

  let projects = (data ?? [])
    .map((p) => ({
      ...p,
      distance_km: haversineKm(lat, lng, Number(p.lat), Number(p.lng)),
    }))
    .sort((a, b) => a.distance_km - b.distance_km)
    .slice(0, 6)

  // Fallback: if no nearby projects found, show same-province
  if (projects.length === 0) {
    const { data: fallback } = await supabase
      .from('projects')
      .select('id, slug, name_official, province, district, banner_url, gmaps_photo_url, price_primary_per_m2_min, tier, lat, lng')
      .eq('province', province)
      .neq('id', currentId)
      .limit(6)
    projects = (fallback ?? []).map((p) => ({ ...p, distance_km: 0 }))
  }

  return projects as NearbyProject[]
}

async function fetchByProvince(province: string, currentId: string): Promise<NearbyProject[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('id, slug, name_official, province, district, banner_url, gmaps_photo_url, price_primary_per_m2_min, tier, lat, lng')
    .eq('province', province)
    .neq('id', currentId)
    .limit(6)
  return (data ?? []).map((p) => ({ ...p, distance_km: 0 })) as NearbyProject[]
}

function fmtDistance(km: number): string {
  if (km === 0) return ''
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

export default async function SimilarSection({
  province,
  currentId,
  lat,
  lng,
}: {
  province: string
  currentId: string
  lat?: number | null
  lng?: number | null
}) {
  const projects =
    lat != null && lng != null
      ? await fetchNearby(Number(lat), Number(lng), currentId, province)
      : await fetchByProvince(province, currentId)

  if (projects.length === 0) return null

  const hasCoords = lat != null && lng != null

  return (
    <section className="scroll-mt-28">
      <h2 className="text-xl font-bold text-[#0D1B3D] mb-1">Dự Án Xung Quanh</h2>
      <p className="text-sm text-[#64748B] mb-4">
        {hasCoords
          ? 'Các dự án trong bán kính khoảng 10km'
          : `Dự án khác tại ${province}`}
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/du-an/${p.province.toLowerCase().replace(/\s+/g, '-')}/${p.slug}`}
            className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden hover:shadow-md hover:border-[#1565FF]/30 transition-all group"
          >
            <div className="relative h-32 bg-[#F1F5F9]">
              {(() => {
                const img = p.banner_url ?? p.gmaps_photo_url
                return img ? (
                  <Image
                    src={img}
                    alt={p.name_official}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    unoptimized={img === p.gmaps_photo_url}
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1565FF]/20 to-[#0D1B3D]/10" />
                )
              })()}
              {hasCoords && p.distance_km > 0 && (
                <div className="absolute top-2 left-2 inline-flex items-center gap-1 bg-white/95 backdrop-blur px-2 py-0.5 rounded-full text-[10px] font-semibold text-[#0D1B3D] shadow-sm">
                  <MapPin className="w-2.5 h-2.5 text-[#1565FF]" strokeWidth={2.5} />
                  {fmtDistance(p.distance_km)}
                </div>
              )}
            </div>
            <div className="p-3">
              <div className="text-sm font-semibold text-[#0D1B3D] leading-snug mb-1 line-clamp-2 group-hover:text-[#1565FF] transition-colors">
                {p.name_official}
              </div>
              <div className="text-xs text-[#64748B] line-clamp-1">{p.district ?? p.province}</div>
              {p.price_primary_per_m2_min && (
                <div className="text-xs font-bold text-[#1565FF] mt-1.5">
                  Từ {(p.price_primary_per_m2_min / 1_000_000).toFixed(0)} tr/m²
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
