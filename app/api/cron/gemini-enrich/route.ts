// Vercel Cron: Gemini Flash enrichment worker.
//
// Flow per invocation:
//   1. Auth via CRON_SECRET (Bearer).
//   2. Claim N projects atomically via DB function `claim_enrichment_batch`
//      (FOR UPDATE SKIP LOCKED — safe with overlapping cron ticks).
//   3. Call Gemini 2.5 Flash with Google Search grounding.
//   4. For each returned project:
//        - Map fields → projects columns (incl. amenities → has_* booleans).
//        - For price/rent fields still null, compute proxy estimate (median
//          of peers in same province+tier+property_type).
//        - Build field_sources JSONB per-field (grounded/estimated/proxy).
//        - data_quality:
//            high/medium → 'ai_filled'
//            low/estimated → 'estimated'
//        - Mark enrichment_status='enriched'.
//   5. Projects Gemini couldn't find → mark 'failed' (or 'skipped' if attempts>=3).
//
// Concurrency: Vercel may overlap cron ticks. The claim function uses
// SKIP LOCKED, so two ticks never grab the same row. Stuck 'processing' rows
// (function timed out) are reaped after 10 min by `reap_stuck_enrichments`.

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import {
  callGeminiBatch,
  GeminiAPIError,
  GeminiQuotaExhaustedError,
  getQuotaUsage,
} from '@/lib/gemini/client'
import { buildEnrichPrompt, AMENITY_TO_COLUMN } from '@/lib/gemini/prompts'
import type {
  EnrichedProject,
  EnrichedProjectData,
  ProjectClaim,
} from '@/lib/gemini/types'
import { computeProxyEstimates } from '@/lib/enrich/proxy-estimate'

// Vercel function settings.
export const maxDuration = 300 // Pro: 300s. Fluid Compute: up to 800s.
export const dynamic = 'force-dynamic'

const BATCH_SIZE = Number(process.env.GEMINI_BATCH_SIZE ?? 5)
const MAX_BATCHES_PER_TICK = Number(process.env.GEMINI_BATCHES_PER_TICK ?? 3)

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

// ---------- Field mapping ----------

interface MappedUpdate {
  /** Columns to set on the projects row. */
  set: Record<string, unknown>
  /** Per-field provenance going into projects.field_sources. */
  sources: Record<string, { source: string; confidence: number; ts: string }>
}

const SCALAR_COPY: Array<keyof EnrichedProjectData> = [
  'description_short',
  'description_long',
  'year_start',
  'year_handover',
  'total_towers',
  'total_units',
  'total_land_ha',
  'building_density_pct',
  'green_density_pct',
  'legal_status',
  'ownership_term',
  'red_book_status',
  'price_primary_per_m2_min',
  'price_primary_per_m2_max',
  'price_secondary_per_m2_avg',
  'rent_2br_avg_monthly_vnd',
  'rent_per_m2_avg',
  'distance_to_cbd_km',
  'nearest_metro_name',
  'nearest_metro_m',
  'address_full',
]

function confidenceFor(field: string, estimates: string[], baseConfidence: number): number {
  if (estimates.includes(field)) return Math.min(baseConfidence, 0.5)
  return baseConfidence
}

function baseConfidenceFromLevel(level: EnrichedProject['confidence_level']): number {
  switch (level) {
    case 'high':
      return 0.95
    case 'medium':
      return 0.8
    case 'low':
      return 0.55
    case 'estimated':
      return 0.4
  }
}

function mapEnrichmentToUpdate(p: EnrichedProject, sourcesFromGrounding: string[]): MappedUpdate {
  const set: Record<string, unknown> = {}
  const sources: Record<string, { source: string; confidence: number; ts: string }> = {}
  const baseConf = baseConfidenceFromLevel(p.confidence_level)
  const estimates = p.estimates ?? []
  const data = p.data ?? {}
  const ts = new Date().toISOString()

  for (const field of SCALAR_COPY) {
    const v = data[field]
    if (v === undefined || v === null || v === '') continue
    set[field as string] = v
    sources[field as string] = {
      source: estimates.includes(field as string) ? 'gemini_estimated' : 'gemini_grounded',
      confidence: confidenceFor(field as string, estimates, baseConf),
      ts,
    }
  }

  // Status enum: normalize → matches projects.status if compatible. Skip 'unknown'.
  if (data.status && data.status !== 'unknown') {
    set.status = data.status
    sources.status = {
      source: estimates.includes('status') ? 'gemini_estimated' : 'gemini_grounded',
      confidence: confidenceFor('status', estimates, baseConf),
      ts,
    }
  }

  // Amenities array → boolean columns.
  if (Array.isArray(data.amenities)) {
    const provided = new Set(data.amenities)
    for (const [key, col] of Object.entries(AMENITY_TO_COLUMN)) {
      if (provided.has(key as never)) {
        set[col] = true
        sources[col] = {
          source: estimates.includes('amenities') ? 'gemini_estimated' : 'gemini_grounded',
          confidence: confidenceFor('amenities', estimates, baseConf),
          ts,
        }
      }
      // Note: we don't set false for absent amenities — absence ≠ negative fact.
    }
  }

  // Data quality decision.
  const isEstimated =
    p.confidence_level === 'low' ||
    p.confidence_level === 'estimated' ||
    estimates.length >= 3
  set.data_quality = isEstimated ? 'estimated' : 'ai_filled'

  // Store grounding URLs as overall provenance.
  if (sourcesFromGrounding.length > 0) {
    sources.__grounding = {
      source: sourcesFromGrounding.slice(0, 5).join(' | '),
      confidence: 1,
      ts,
    }
  }

  return { set, sources }
}

async function applyProxyFallback(
  supabase: ReturnType<typeof serviceClient>,
  claim: ProjectClaim,
  update: MappedUpdate,
): Promise<void> {
  const proxyTargets: Array<keyof EnrichedProjectData> = [
    'price_primary_per_m2_min',
    'price_primary_per_m2_max',
    'price_secondary_per_m2_avg',
    'rent_2br_avg_monthly_vnd',
    'rent_per_m2_avg',
  ]
  const needsProxy = proxyTargets.some(f => update.set[f as string] === undefined)
  if (!needsProxy) return

  const proxy = await computeProxyEstimates(supabase, {
    province: claim.province,
    tier: claim.tier,
    property_type: claim.property_type,
  })
  const ts = new Date().toISOString()
  for (const [field, value] of Object.entries(proxy)) {
    if (update.set[field] === undefined && typeof value === 'number') {
      update.set[field] = value
      update.sources[field] = {
        source: 'proxy_median_peers',
        confidence: 0.3,
        ts,
      }
    }
  }
  // If we leaned on proxy, downgrade quality to 'estimated'.
  if (Object.keys(proxy).length > 0) {
    update.set.data_quality = 'estimated'
  }
}

// ---------- Main handler ----------

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Kill-switch: phải set ENRICH_ENABLED=true trên Vercel để bật cron.
  // Default = paused. Cho phép pause/resume mà không cần code change.
  if (process.env.ENRICH_ENABLED !== 'true') {
    return NextResponse.json({
      ok: false,
      paused: true,
      reason: 'ENRICH_ENABLED env flag is not "true" — cron paused.',
    })
  }

  const supabase = serviceClient()
  const startedAt = Date.now()
  // Reserve 30s buffer so we don't get killed mid-write.
  const HARD_DEADLINE_MS = (maxDuration - 30) * 1000

  const stats = {
    batches: 0,
    claimed: 0,
    enriched: 0,
    estimated_quality: 0,
    failed: 0,
    not_found: 0,
    skipped_exhausted: 0,
    elapsed_ms: 0,
    quota: [] as ReturnType<typeof getQuotaUsage>,
    error: null as string | null,
  }

  try {
    for (let batch = 0; batch < MAX_BATCHES_PER_TICK; batch++) {
      if (Date.now() - startedAt > HARD_DEADLINE_MS) break

      const { data: claims, error: claimErr } = await supabase.rpc('claim_enrichment_batch', {
        p_batch_size: BATCH_SIZE,
      })
      if (claimErr) {
        stats.error = `claim_enrichment_batch: ${claimErr.message}`
        break
      }
      const claimedRows = (claims ?? []) as ProjectClaim[]
      if (claimedRows.length === 0) break

      stats.batches += 1
      stats.claimed += claimedRows.length

      // ---- Call Gemini once for the whole batch ----
      let geminiOutput: { projects: EnrichedProject[] } | null = null
      let groundingSources: string[] = []
      try {
        const prompt = buildEnrichPrompt(claimedRows)
        const res = await callGeminiBatch({ prompt, grounding: true })
        geminiOutput = res.output
        groundingSources = res.sources
      } catch (err) {
        if (err instanceof GeminiQuotaExhaustedError) {
          // Release the batch — try again next tick (or next day).
          await releaseClaim(supabase, claimedRows.map(c => c.id), 'quota exhausted')
          stats.failed += claimedRows.length
          stats.error = 'Gemini quota exhausted'
          break
        }
        const msg =
          err instanceof GeminiAPIError ? `${err.status}: ${err.message}` : (err as Error).message
        await releaseClaim(supabase, claimedRows.map(c => c.id), msg)
        stats.failed += claimedRows.length
        continue // try next batch
      }

      const byId = new Map(geminiOutput.projects.map(p => [p.id, p]))

      // ---- Apply per-project ----
      for (const claim of claimedRows) {
        const enriched = byId.get(claim.id)
        if (!enriched) {
          // Gemini missed this id entirely.
          await markFailure(supabase, claim.id, 'id missing in Gemini response')
          stats.failed += 1
          continue
        }
        if (!enriched.found) {
          await markNotFound(supabase, claim.id, enriched.not_found_reason ?? 'not found')
          stats.not_found += 1
          continue
        }

        const update = mapEnrichmentToUpdate(enriched, groundingSources)
        await applyProxyFallback(supabase, claim, update)

        // Write field_sources JSONB. On first enrichment field_sources is null,
        // so overwrite is fine. TODO: merge with existing when re-enriching
        // (admin-verified fields shouldn't be clobbered).
        //
        // Auto-publish sau enrich thành công. Safety net:
        // - UI có badge "Ước tính" cho field 'gemini_estimated' / 'proxy_median_peers'
        // - data_quality='estimated' vẫn published, badge minh bạch tránh hiểu lầm
        // - Gemini không tìm thấy → status='skipped' (route khác), KHÔNG đụng publish ở đây
        const { error: updErr } = await supabase
          .from('projects')
          .update({
            ...update.set,
            field_sources: update.sources,
            enrichment_status: 'enriched',
            enrichment_completed_at: new Date().toISOString(),
            enrichment_last_error: null,
            enrichment_provider: 'gemini-2.5-flash',
            published: true,
          })
          .eq('id', claim.id)

        if (updErr) {
          await markFailure(supabase, claim.id, `update: ${updErr.message}`)
          stats.failed += 1
        } else {
          stats.enriched += 1
          if (update.set.data_quality === 'estimated') stats.estimated_quality += 1
        }
      }
    }
  } catch (err) {
    stats.error = (err as Error).message
  }

  stats.elapsed_ms = Date.now() - startedAt
  stats.quota = getQuotaUsage()
  return NextResponse.json(stats)
}

// ---------- Helpers ----------

async function releaseClaim(
  supabase: ReturnType<typeof serviceClient>,
  ids: string[],
  reason: string,
): Promise<void> {
  if (ids.length === 0) return
  await supabase
    .from('projects')
    .update({
      enrichment_status: 'pending',
      enrichment_started_at: null,
      enrichment_last_error: reason.slice(0, 500),
    })
    .in('id', ids)
}

async function markFailure(
  supabase: ReturnType<typeof serviceClient>,
  id: string,
  reason: string,
): Promise<void> {
  // claim function already incremented attempts. If attempts >= 3, mark exhausted.
  const { data } = await supabase
    .from('projects')
    .select('enrichment_attempts')
    .eq('id', id)
    .single()
  const attempts = (data as { enrichment_attempts: number } | null)?.enrichment_attempts ?? 99
  const finalStatus = attempts >= 3 ? 'failed' : 'pending'
  await supabase
    .from('projects')
    .update({
      enrichment_status: finalStatus,
      enrichment_started_at: null,
      enrichment_last_error: reason.slice(0, 500),
    })
    .eq('id', id)
}

async function markNotFound(
  supabase: ReturnType<typeof serviceClient>,
  id: string,
  reason: string,
): Promise<void> {
  await supabase
    .from('projects')
    .update({
      enrichment_status: 'skipped',
      enrichment_completed_at: new Date().toISOString(),
      enrichment_last_error: `not_found: ${reason}`.slice(0, 500),
    })
    .eq('id', id)
}
