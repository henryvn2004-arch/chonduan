export type Mode = 'sale' | 'rent_long'

export type ProjectStatus = 'sap_mo_ban' | 'dang_mo_ban' | 'dang_xay' | 'da_ban_giao' | 'da_ban_giao_lau'

export interface ProjectPin {
  id: string
  name_official: string
  slug: string
  province: string
  district: string | null
  lat: number
  lng: number
  tier: 'binh_dan' | 'trung_cap' | 'cao_cap' | 'hang_sang' | null
  rent_demand_score: number | null
  price_primary_per_m2_min: number | null
  price_secondary_per_m2_avg: number | null
  rent_2br_avg_monthly_vnd: number | null
  description_short: string | null
  property_type: string
  status: ProjectStatus | null
  banner_url: string | null
}

export interface FilterState {
  property_type: string
  price_min: number   // sale: tỷ VND; rent: tr/tháng
  price_max: number   // sale: tỷ (100=no limit); rent: tr/tháng (100=no limit)
  province?: string
  district?: string
  status?: string
  amenities?: string[]  // 'pool' | 'gym' | 'school' | 'mall'
  investment_score_min?: number
  bedrooms?: string   // '1' | '2' | '3' | '4+'
}

export interface SearchResult {
  id: string
  name_official: string
  slug: string
  province: string
  lat: number | null
  lng: number | null
}
