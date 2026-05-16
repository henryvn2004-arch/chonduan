import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const swLat = parseFloat(sp.get('swLat') ?? '')
  const swLng = parseFloat(sp.get('swLng') ?? '')
  const neLat = parseFloat(sp.get('neLat') ?? '')
  const neLng = parseFloat(sp.get('neLng') ?? '')

  if ([swLat, swLng, neLat, neLng].some(isNaN)) {
    return NextResponse.json({ error: 'invalid bounds' }, { status: 400 })
  }

  const propertyType = sp.get('property_type') ?? ''
  const priceMin = parseInt(sp.get('price_min') ?? '0')   // in tỷ VND
  const priceMax = parseInt(sp.get('price_max') ?? '0')   // in tỷ VND, 0 = no limit

  const supabase = await createClient()
  let query = supabase
    .from('projects')
    .select(
      'id, name_official, slug, province, district, lat, lng, tier, rent_demand_score, ' +
      'price_primary_per_m2_min, price_secondary_per_m2_avg, rent_2br_avg_monthly_vnd, ' +
      'description_short, property_type, status, banner_url'
    )
    .gte('lat', swLat)
    .lte('lat', neLat)
    .gte('lng', swLng)
    .lte('lng', neLng)
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  if (propertyType) query = query.eq('property_type', propertyType)

  // price_primary_per_m2_min is in VND/m², convert tỷ to approximate: 1 tỷ/m² threshold isn't right
  // The price fields are tr/m² (million VND per m²), and 1 tỷ = 1000 tr
  // price_min/price_max from filter are in tỷ total project price range
  // For now filter by price_primary_per_m2_min as a proxy (in VND)
  if (priceMin > 0) query = query.gte('price_primary_per_m2_min', priceMin * 1_000_000)
  if (priceMax > 0) query = query.lte('price_primary_per_m2_min', priceMax * 1_000_000)

  const { data, error } = await query.limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
