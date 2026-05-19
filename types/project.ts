import type { FieldSources } from '@/lib/enrich/field-source'

export type ProjectTier = 'binh_dan' | 'trung_cap' | 'cao_cap' | 'hang_sang'
export type ProjectStatus = 'sap_mo_ban' | 'dang_mo_ban' | 'dang_xay' | 'da_ban_giao' | 'da_ban_giao_lau'
export type LegalStatus = 'da_co' | 'dang_cho' | 'chua_ro' | 'co_van_de'
export type RiskLevel = 'thap' | 'trung_binh' | 'cao'
export type PriceTrend = 'tang' | 'giam' | 'on_dinh'
export type DataQualityLevel = 'auto' | 'estimated' | 'ai_filled' | 'verified' | 'gold'

export interface Developer {
  id: string
  slug: string
  name: string
  short_name: string | null
  logo_url: string | null
  website: string | null
  founded_year: number | null
  ranking_tier: ProjectTier | null
}

export interface PriceHistory {
  date: string
  price_per_m2_avg: number
  price_per_m2_min: number | null
  price_per_m2_max: number | null
  listing_count: number | null
}

export interface RentalHistory {
  date: string
  rent_studio_avg: number | null
  rent_1br_avg: number | null
  rent_2br_avg: number | null
  rent_3br_avg: number | null
  rent_per_m2_avg: number | null
  listings_count: number | null
  short_term_avg_per_night: number | null
}

export interface ProjectDetail {
  id: string
  slug: string
  name_official: string
  name_aliases: string[] | null
  province: string
  district: string | null
  ward: string | null
  address_full: string | null
  lat: number | null
  lng: number | null

  developer_id: string | null
  developer: Developer | null

  property_type: string
  tier: ProjectTier | null
  status: ProjectStatus | null
  year_start: number | null
  year_handover: number | null
  total_land_ha: number | null
  building_density_pct: number | null
  total_towers: number | null
  total_units: number | null
  description_short: string | null
  description_long: string | null

  // Sale pricing
  price_primary_per_m2_min: number | null
  price_primary_per_m2_max: number | null
  price_secondary_per_m2_avg: number | null
  price_trend: PriceTrend | null
  price_trend_pct_6m: number | null
  rental_yield_pct: number | null

  // Rental pricing
  rent_studio_avg_monthly_vnd: number | null
  rent_1br_avg_monthly_vnd: number | null
  rent_2br_avg_monthly_vnd: number | null
  rent_3br_avg_monthly_vnd: number | null
  rent_4br_plus_avg_monthly_vnd: number | null
  rent_furnished_premium_pct: number | null
  rent_demand_score: number | null
  rent_trend: PriceTrend | null
  rent_avg_lease_term_months: number | null
  short_term_avg_per_night_vnd: number | null
  short_term_occupancy_pct: number | null
  is_expat_friendly: boolean | null
  expat_concentration_score: number | null

  // Legal
  land_origin_type: string | null
  red_book_status: LegalStatus | null
  ownership_term: string | null
  construction_permit_no: string | null
  investment_approval_no: string | null
  legal_issues_text: string | null
  legal_score: number | null
  legal_last_verified: string | null

  // Amenities (boolean flags)
  has_pool: boolean | null
  has_gym: boolean | null
  has_tennis_court: boolean | null
  has_basketball_court: boolean | null
  has_kids_playground: boolean | null
  has_bbq_area: boolean | null
  has_spa: boolean | null
  has_sauna: boolean | null
  has_coworking: boolean | null
  has_sky_garden: boolean | null
  has_rooftop: boolean | null
  has_supermarket: boolean | null
  has_restaurant: boolean | null
  has_cafe: boolean | null
  has_clinic: boolean | null
  has_kindergarten: boolean | null
  has_shopping_mall: boolean | null
  has_ev_charging: boolean | null
  has_smart_home: boolean | null
  has_concierge: boolean | null

  // Surrounding
  nearest_metro_m: number | null
  nearest_metro_name: string | null
  nearest_public_school_m: number | null
  nearest_international_school_m: number | null
  nearest_hospital_m: number | null
  nearest_mall_m: number | null
  nearest_supermarket_m: number | null
  distance_to_cbd_km: number | null
  distance_to_airport_km: number | null

  // BQL
  service_fee_per_m2_vnd: number | null
  parking_motorbike_monthly: number | null
  parking_car_monthly: number | null

  // Risk
  flood_risk_level: RiskLevel | null
  tide_risk_level: RiskLevel | null
  air_pollution_score: number | null
  noise_level: RiskLevel | null

  // Outlook
  investment_score: number | null
  outlook_text: string | null

  // Media
  logo_url: string | null
  banner_url: string | null
  gallery_urls: string[] | null
  video_tour_url: string | null

  // Fengshui
  main_direction: string | null
  compatible_can_chi: string[] | null
  incompatible_can_chi: string[] | null
  fengshui_notes: string | null

  // Reviews
  review_count: number | null
  review_avg_rating: number | null
  review_pros_summary: string | null
  review_cons_summary: string | null

  // AI content
  ai_faq: Array<{ q: string; a: string }> | null
  ai_overview: string | null
  ai_pros_cons: { pros: string[]; cons: string[] } | null
  ai_audio_url: string | null

  // Data provenance (Gemini Flash enrich)
  data_quality: DataQualityLevel | null
  field_sources: FieldSources | null

  // History (joined)
  price_history: PriceHistory[]
  rental_history: RentalHistory[]
}
