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
  // Cơ bản
  property_type: string          // '' = all
  price_min: number              // sale: tr/m²; rent: tr/tháng
  price_max: number              // sale: 200=no limit; rent: 200=no limit
  province?: string
  district?: string
  tiers?: string[]               // 'binh_dan'|'trung_cap'|'cao_cap'|'hang_sang'
  statuses?: string[]            // project_status[]

  // Pháp lý
  red_book_statuses?: string[]   // 'da_cap'|'chua_cap'|'dang_lam'|'vuong_mac'
  land_origin_types?: string[]   // 'dat_o'|'dat_thuong_mai'|'dat_chuyen_doi'|'khac'
  ownership_terms?: string[]     // 'lau_dai'|'nam_70'|'nam_50'
  legal_score_min?: number       // 1-10

  // Tiện ích — nội khu (boolean) + xung quanh (≤800m)
  amenities?: string[]

  // Rủi ro
  flood_risk_max?: number        // 0=không|1=thấp|2=tb|3=cao
  noise_levels?: string[]        // 'quiet'|'moderate'|'noisy'

  // Phong thủy
  main_directions?: string[]     // 'dong'|'tay'|'nam'|'bac'|'dong_nam'|...
  birth_year?: number            // dùng tính can chi hợp mệnh

  // Nâng cao
  developer_search?: string
  year_handover_max?: number
  investment_score_min?: number  // 1-10
  bql_rating_min?: number        // 0-5
  review_rating_min?: number     // 0-5

  // Cho thuê & Đầu tư (luôn visible — investor ở sale mode cũng dùng)
  rent_2br_min?: number          // tr/tháng
  rent_2br_max?: number          // tr/tháng, 0=no limit
  rental_yield_pct_min?: number  // %, e.g. 3 | 5 | 7

  // Cho thuê (chỉ dùng khi mode=rent_long)
  rent_demand_score_min?: number
  rent_trend?: string
  is_expat_friendly?: boolean
}

export interface SearchResult {
  id: string
  name_official: string
  slug: string
  province: string
  lat: number | null
  lng: number | null
}
