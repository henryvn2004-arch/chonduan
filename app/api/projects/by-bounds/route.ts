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

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select(
      'id, name_official, slug, province, lat, lng, tier, rent_demand_score, ' +
      'price_primary_per_m2_min, price_secondary_per_m2_avg, rent_2br_avg_monthly_vnd, ' +
      'description_short, property_type'
    )
    .gte('lat', swLat)
    .lte('lat', neLat)
    .gte('lng', swLng)
    .lte('lng', neLng)
    .not('lat', 'is', null)
    .not('lng', 'is', null)
    .limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
