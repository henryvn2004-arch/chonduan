import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

// Map amenity keys → boolean DB columns
const AMENITY_BOOL: Record<string, string> = {
  pool:            'has_pool',
  gym:             'has_gym',
  tennis:          'has_tennis_court',
  basketball:      'has_basketball_court',
  kid_play:        'has_kid_playground',
  kindergarten:    'has_kindergarten',
  school_primary:  'has_school_primary',
  school_secondary:'has_school_secondary',
  school_intl:     'has_school_international',
  mall_internal:   'has_mall_internal',
  supermarket:     'has_supermarket_internal',
  cafe:            'has_cafe_restaurant',
  bbq:             'has_bbq_area',
  clubhouse:       'has_clubhouse',
  library:         'has_library',
  park:            'has_park_garden',
  security_24h:    'has_24h_security',
  smart_home:      'has_smart_home',
  ev_charging:     'has_ev_charging',
}

// Map nearby amenity keys → { distance column, max meters }
const AMENITY_NEARBY: Record<string, { col: string; maxM: number }> = {
  nearby_metro:        { col: 'nearest_metro_m',                 maxM: 800 },
  nearby_intl_school:  { col: 'nearest_international_school_m',  maxM: 800 },
  nearby_hospital:     { col: 'nearest_hospital_m',              maxM: 800 },
  nearby_mall:         { col: 'nearest_mall_m',                  maxM: 800 },
  nearby_supermarket:  { col: 'nearest_supermarket_m',           maxM: 800 },
}

function csv(sp: URLSearchParams, key: string): string[] {
  const v = sp.get(key)
  return v ? v.split(',').filter(Boolean) : []
}

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams

  const swLat = parseFloat(sp.get('swLat') ?? '')
  const swLng = parseFloat(sp.get('swLng') ?? '')
  const neLat = parseFloat(sp.get('neLat') ?? '')
  const neLng = parseFloat(sp.get('neLng') ?? '')

  if ([swLat, swLng, neLat, neLng].some(isNaN)) {
    return NextResponse.json({ error: 'invalid bounds' }, { status: 400 })
  }

  const mode = sp.get('mode') ?? 'sale'

  // ── Core params ────────────────────────────────────────
  const propertyType     = sp.get('property_type') ?? ''
  const priceMin         = parseInt(sp.get('price_min') ?? '0')
  const priceMax         = parseInt(sp.get('price_max') ?? '0')

  // ── Multi-select (comma-separated) ────────────────────
  const tiers            = csv(sp, 'tiers')
  const statuses         = csv(sp, 'statuses')
  const redBookStatuses  = csv(sp, 'red_book_statuses')
  const landOriginTypes  = csv(sp, 'land_origin_types')
  const ownershipTerms   = csv(sp, 'ownership_terms')
  const mainDirections   = csv(sp, 'main_directions')
  const noiseLevels      = csv(sp, 'noise_levels')
  const amenities        = csv(sp, 'amenities')

  // ── Numeric thresholds ────────────────────────────────
  const legalScoreMin      = parseInt(sp.get('legal_score_min') ?? '0')
  const investmentScoreMin = parseInt(sp.get('investment_score_min') ?? '0')
  const bqlRatingMin       = parseFloat(sp.get('bql_rating_min') ?? '0')
  const reviewRatingMin    = parseFloat(sp.get('review_rating_min') ?? '0')
  const yearHandoverMax    = parseInt(sp.get('year_handover_max') ?? '0')
  const floodRiskMaxRaw    = sp.get('flood_risk_max')
  const floodRiskMax       = floodRiskMaxRaw !== null ? parseInt(floodRiskMaxRaw) : null
  const rent2brMin         = parseInt(sp.get('rent_2br_min') ?? '0')
  const rent2brMax         = parseInt(sp.get('rent_2br_max') ?? '0')
  const rentalYieldPctMin  = parseFloat(sp.get('rental_yield_pct_min') ?? '0')

  // ── Text search ───────────────────────────────────────
  const developerSearch    = sp.get('developer_search') ?? ''

  // ── Rent-mode params ──────────────────────────────────
  const rentDemandScoreMin = parseInt(sp.get('rent_demand_score_min') ?? '0')
  const rentTrend          = sp.get('rent_trend') ?? ''
  const isExpatFriendly    = sp.get('is_expat_friendly') === 'true'

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

  // ── Filters ───────────────────────────────────────────

  if (propertyType) query = query.eq('property_type', propertyType)

  if (tiers.length)           query = query.in('tier', tiers)
  if (statuses.length)        query = query.in('status', statuses)
  if (redBookStatuses.length) query = query.in('red_book_status', redBookStatuses)
  if (landOriginTypes.length) query = query.in('land_origin_type', landOriginTypes)
  if (ownershipTerms.length)  query = query.in('ownership_term', ownershipTerms)
  if (mainDirections.length)  query = query.in('main_direction', mainDirections)
  if (noiseLevels.length)     query = query.in('noise_level', noiseLevels)

  // Price — sale: price_primary_per_m2_min in VND/m², filter in tr/m² (×1,000,000)
  //       — rent: rent_2br_avg_monthly_vnd in VND, filter in tr/month (×1,000,000)
  if (mode === 'rent_long') {
    if (priceMin > 0) query = query.gte('rent_2br_avg_monthly_vnd', priceMin * 1_000_000)
    if (priceMax > 0 && priceMax < 200) query = query.lte('rent_2br_avg_monthly_vnd', priceMax * 1_000_000)
  } else {
    if (priceMin > 0) query = query.gte('price_primary_per_m2_min', priceMin * 1_000_000)
    if (priceMax > 0 && priceMax < 200) query = query.lte('price_primary_per_m2_min', priceMax * 1_000_000)
  }

  if (legalScoreMin > 0)      query = query.gte('legal_score', legalScoreMin)
  if (investmentScoreMin > 0) query = query.gte('investment_score', investmentScoreMin)
  if (bqlRatingMin > 0)       query = query.gte('bql_rating', bqlRatingMin)
  if (reviewRatingMin > 0)    query = query.gte('review_avg_rating', reviewRatingMin)
  if (yearHandoverMax > 0)    query = query.lte('year_handover', yearHandoverMax)
  if (floodRiskMax !== null)  query = query.lte('flood_risk_level', floodRiskMax)

  // Rent price + yield (always, not mode-gated — useful for sale investors too)
  if (rent2brMin > 0)         query = query.gte('rent_2br_avg_monthly_vnd', rent2brMin * 1_000_000)
  if (rent2brMax > 0 && rent2brMax < 100) query = query.lte('rent_2br_avg_monthly_vnd', rent2brMax * 1_000_000)
  if (rentalYieldPctMin > 0)  query = query.gte('rental_yield_pct', rentalYieldPctMin)

  // Developer text search (ilike on developers table via join not possible here — filter post-fetch or use RPC)
  // For now: skip developer_search in this endpoint (handled by /api/search)
  void developerSearch

  if (mode === 'rent_long') {
    if (rentDemandScoreMin > 0) query = query.gte('rent_demand_score', rentDemandScoreMin)
    if (rentTrend)              query = query.eq('rent_trend', rentTrend)
    if (isExpatFriendly)        query = query.eq('is_expat_friendly', true)
  }

  // Amenities — cast to any to avoid TS deep instantiation on dynamic column names
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let q: any = query
  for (const amenity of amenities) {
    if (amenity === 'school_any') {
      q = q.or(
        'has_kindergarten.eq.true,has_school_primary.eq.true,' +
        'has_school_secondary.eq.true,has_school_international.eq.true'
      )
      continue
    }
    if (amenity === 'supermarket_any') {
      q = q.or('has_supermarket_internal.eq.true,nearest_supermarket_m.lte.800')
      continue
    }
    const boolCol = AMENITY_BOOL[amenity]
    if (boolCol) { q = q.eq(boolCol, true); continue }
    const nearby = AMENITY_NEARBY[amenity]
    if (nearby) q = q.lte(nearby.col, nearby.maxM).not(nearby.col, 'is', null)
  }
  query = q

  const { data, error } = await query.limit(100)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}
