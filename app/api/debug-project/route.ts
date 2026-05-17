import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get('slug') ?? 'the-estella-heights'
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('projects')
    .select(
      'id, slug, name_official, province, district, ward, address_full, ' +
      'property_type, tier, status, year_start, year_handover, ' +
      'total_land_ha, total_towers, total_units, building_density_pct, ' +
      'price_primary_per_m2_min, price_primary_per_m2_max, ' +
      'price_secondary_per_m2_avg, price_trend, price_trend_pct_6m, ' +
      'rent_1br_avg_monthly_vnd, rent_2br_avg_monthly_vnd, rent_3br_avg_monthly_vnd, ' +
      'rent_demand_score, rental_yield_pct, ' +
      'description_short, description_long, ai_overview, ai_pros_cons, ai_faq, ' +
      'has_pool, has_gym, has_tennis_court, has_basketball_court, ' +
      'has_kindergarten, has_school_international, has_mall_internal, ' +
      'has_supermarket_internal, has_bbq_area, has_clubhouse, ' +
      'has_smart_home, has_ev_charging, has_24h_security, ' +
      'service_fee_per_m2_vnd, parking_car_monthly, parking_motorbike_monthly, ' +
      'land_origin_type, red_book_status, ownership_term, ' +
      'nearest_metro_m, nearest_metro_name, nearest_hospital_m, nearest_mall_m, ' +
      'distance_to_cbd_km, distance_to_airport_km, ' +
      'income_bracket, noise_level, is_expat_friendly, ' +
      'banner_url, lat, lng, data_quality, ' +
      'developer_id, developers(name, slug, logo_url)'
    )
    .eq('slug', slug)
    .eq('published', true)
    .single()

  return NextResponse.json({ slug, data, error })
}
