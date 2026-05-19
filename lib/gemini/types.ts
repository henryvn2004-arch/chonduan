// Gemini enrichment types
// Output schema returned by Gemini Flash for each project in a batch.

// Match DB enum project_status exactly. Gemini đôi khi vẫn trả English fallback;
// route.ts có safety mapping English → VN trước khi UPDATE.
export type ProjectStatus =
  | 'sap_mo_ban'      // sắp mở bán
  | 'dang_mo_ban'     // đang mở bán
  | 'dang_xay'        // đang xây dựng
  | 'da_ban_giao'     // đã bàn giao
  | 'da_ban_giao_lau' // đã bàn giao lâu (>5 năm)
  | 'unknown'

export type AmenityKey =
  | 'pool'
  | 'gym'
  | 'tennis_court'
  | 'basketball_court'
  | 'kid_playground'
  | 'kindergarten'
  | 'school_primary'
  | 'school_secondary'
  | 'school_international'
  | 'mall_internal'
  | 'supermarket_internal'
  | 'cafe_restaurant'
  | 'bbq_area'
  | 'clubhouse'
  | 'library'
  | 'park_garden'
  | '24h_security'
  | 'smart_home'
  | 'ev_charging'

/** Confidence level for the whole project enrichment. */
export type ConfidenceLevel = 'high' | 'medium' | 'low' | 'estimated'

/** Single project's enriched payload returned by Gemini. */
export interface EnrichedProjectData {
  description_short?: string
  description_long?: string
  developer?: string
  year_start?: number
  year_handover?: number
  total_towers?: number
  total_units?: number
  total_land_ha?: number
  building_density_pct?: number
  green_density_pct?: number
  status?: ProjectStatus
  legal_status?: string
  ownership_term?: string
  red_book_status?: string
  amenities?: AmenityKey[]
  // Prices in VND (NOT million-VND). API returns integers in VND.
  price_primary_per_m2_min?: number
  price_primary_per_m2_max?: number
  price_secondary_per_m2_avg?: number
  rent_2br_avg_monthly_vnd?: number
  rent_per_m2_avg?: number
  // Location
  distance_to_cbd_km?: number
  nearest_metro_name?: string
  nearest_metro_m?: number
  // Address refinement
  address_full?: string
}

export interface EnrichedProject {
  id: string
  found: boolean
  confidence_level: ConfidenceLevel
  data: EnrichedProjectData
  /** Field names the model marked as estimate/inference (not grounded fact). */
  estimates: string[]
  /** Source URLs from grounding (if any). */
  sources: string[]
  /** Optional free-text reason if found=false. */
  not_found_reason?: string
}

export interface GeminiBatchOutput {
  projects: EnrichedProject[]
}

/** Project rows claimed from the queue.
 *  Note: lat/lng come back from Postgres `numeric` as string via PostgREST.
 *  Coerce with Number() before doing math. */
export interface ProjectClaim {
  id: string
  name_official: string | null
  province: string | null
  district: string | null
  ward: string | null
  lat: number | string | null
  lng: number | string | null
  property_type: string | null
  tier: string | null
  status: string | null
}
