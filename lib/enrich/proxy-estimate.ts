// Proxy-based estimate: when Gemini returns null for price-like fields,
// fall back to the average among comparable projects (same province + tier
// + property_type). Always flagged as 'estimated' in field_sources so the UI
// can render the "Ước tính" badge.
//
// Why a separate module: keeps the cron handler thin and lets us test the
// proxy logic with seed data later.

import type { SupabaseClient } from '@supabase/supabase-js'

export interface ProxyEstimates {
  price_primary_per_m2_min?: number
  price_primary_per_m2_max?: number
  price_secondary_per_m2_avg?: number
  rent_2br_avg_monthly_vnd?: number
  rent_per_m2_avg?: number
}

export interface ProxyContext {
  province: string | null
  tier: string | null
  property_type: string | null
}

const PROXY_FIELDS: (keyof ProxyEstimates)[] = [
  'price_primary_per_m2_min',
  'price_primary_per_m2_max',
  'price_secondary_per_m2_avg',
  'rent_2br_avg_monthly_vnd',
  'rent_per_m2_avg',
]

/**
 * Pull averages for the price/rent fields from peer projects.
 * Returns only fields where at least 3 peers exist (signal floor).
 */
export async function computeProxyEstimates(
  supabase: SupabaseClient,
  ctx: ProxyContext,
): Promise<ProxyEstimates> {
  if (!ctx.province) return {}

  // Three-tier fallback: (province + tier + property_type) → (province + property_type) → (province)
  const candidates: Array<Record<string, string>> = []
  if (ctx.tier && ctx.property_type)
    candidates.push({ province: ctx.province, tier: ctx.tier, property_type: ctx.property_type })
  if (ctx.property_type) candidates.push({ province: ctx.province, property_type: ctx.property_type })
  candidates.push({ province: ctx.province })

  for (const filter of candidates) {
    let q = supabase.from('projects').select(PROXY_FIELDS.join(','))
    for (const [k, v] of Object.entries(filter)) q = q.eq(k, v)
    const { data, error } = await q.limit(500)
    if (error || !data || data.length < 3) continue

    const result: ProxyEstimates = {}
    let filledAny = false
    for (const f of PROXY_FIELDS) {
      const vals = (data as Record<string, number | null>[])
        .map(r => r[f])
        .filter((v): v is number => typeof v === 'number' && v > 0)
      if (vals.length >= 3) {
        vals.sort((a, b) => a - b)
        // Use median to avoid outliers.
        result[f] = vals[Math.floor(vals.length / 2)]
        filledAny = true
      }
    }
    if (filledAny) return result
  }
  return {}
}
