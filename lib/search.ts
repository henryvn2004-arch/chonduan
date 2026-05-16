import { createClient } from '@/lib/supabase/server'
import type { ProjectPin } from '@/types/maps'

export interface SearchParams {
  q?: string
  mode?: string
  province?: string
  district?: string
  property_type?: string
  status?: string
  price_min?: number
  price_max?: number
  amenities?: string[]
  investment_score_min?: number
  bedrooms?: string
  page?: number
  sort?: string
}

export interface SearchResponse {
  results: ProjectPin[]
  total: number
  page: number
  pageSize: number
}

export const PAGE_SIZE = 24

export async function searchProjects(p: SearchParams): Promise<SearchResponse> {
  const supabase = await createClient()

  const page = p.page ?? 0
  const mode = p.mode ?? 'sale'

  let query = supabase
    .from('projects')
    .select(
      'id, name_official, slug, province, district, lat, lng, tier, rent_demand_score, ' +
      'price_primary_per_m2_min, price_secondary_per_m2_avg, rent_2br_avg_monthly_vnd, ' +
      'description_short, property_type, status, banner_url',
      { count: 'exact' }
    )
    .not('published', 'eq', false)

  if (p.q && p.q.length >= 2) {
    query = query.textSearch('search_keywords', p.q, { config: 'simple', type: 'websearch' })
  }

  if (p.province) query = query.eq('province', p.province)
  if (p.district) query = query.eq('district', p.district)
  if (p.property_type) query = query.eq('property_type', p.property_type)
  if (p.status) query = query.eq('status', p.status)

  for (const a of p.amenities ?? []) {
    if (a === 'pool') query = query.eq('has_pool', true)
    if (a === 'gym') query = query.eq('has_gym', true)
    if (a === 'school') query = query.eq('has_school_nearby', true)
    if (a === 'mall') query = query.eq('has_mall_nearby', true)
  }

  if (mode === 'sale') {
    if (p.price_min && p.price_min > 0) query = query.gte('price_primary_per_m2_min', p.price_min * 1_000_000)
    if (p.price_max && p.price_max < 100) query = query.lte('price_primary_per_m2_min', p.price_max * 1_000_000)
    if (p.investment_score_min && p.investment_score_min > 0) query = query.gte('investment_score', p.investment_score_min)
  } else {
    if (p.price_min && p.price_min > 0) query = query.gte('rent_2br_avg_monthly_vnd', p.price_min * 1_000_000)
    if (p.price_max && p.price_max < 100) query = query.lte('rent_2br_avg_monthly_vnd', p.price_max * 1_000_000)
  }

  const sort = p.sort ?? 'relevance'
  if (sort === 'price_asc') {
    const col = mode === 'rent_long' ? 'rent_2br_avg_monthly_vnd' : 'price_primary_per_m2_min'
    query = query.order(col, { ascending: true, nullsFirst: false })
  } else if (sort === 'price_desc') {
    const col = mode === 'rent_long' ? 'rent_2br_avg_monthly_vnd' : 'price_primary_per_m2_min'
    query = query.order(col, { ascending: false, nullsFirst: false })
  } else if (sort === 'investment') {
    query = query.order('investment_score', { ascending: false, nullsFirst: false })
  } else {
    query = query.order('created_at', { ascending: false })
  }

  const { data, count, error } = await query.range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (error) throw new Error(error.message)
  return { results: (data ?? []) as unknown as ProjectPin[], total: count ?? 0, page, pageSize: PAGE_SIZE }
}
