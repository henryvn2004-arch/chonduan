export type Mode = 'sale' | 'rent_long'

export interface ProjectPin {
  id: string
  name_official: string
  slug: string
  province: string
  lat: number
  lng: number
  tier: 'binh_dan' | 'trung_cap' | 'cao_cap' | 'hang_sang' | null
  rent_demand_score: number | null
  price_primary_per_m2_min: number | null
  price_secondary_per_m2_avg: number | null
  rent_2br_avg_monthly_vnd: number | null
  description_short: string | null
  property_type: string
}

export interface SearchResult {
  id: string
  name_official: string
  slug: string
  province: string
  lat: number | null
  lng: number | null
}
