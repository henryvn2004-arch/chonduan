// Vercel Cron: Google Places Photos backfill worker.
//
// Flow per invocation:
//   1. Auth via CRON_SECRET (Bearer).
//   2. Budget guard: if month spend >= MAX_MONTH_USD, exit early.
//   3. Claim N projects via DB `claim_gmaps_photos_batch` (SKIP LOCKED).
//   4. For each project:
//        a. findPlaceFromText(name, district, province) — biased by lat/lng
//        b. If no photo_reference → status='not_found'
//        c. Fetch photo bytes via Place Photo endpoint
//        d. Upload to Supabase Storage (project-photos bucket)
//        e. Update projects.gmaps_photo_url + status='done'
//   5. Track API usage via track_gmaps_usage(find_place, photo).
//
// Schedule: hourly (0 * * * *). Batch=7 → 168 projects/day → 10k in ~60 days.
// Stays under $200/month free credit when spread across 2 months.

import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import {
  findPlaceFromText,
  fetchPhotoBinary,
  uploadProjectPhoto,
  buildQuery,
  GmapsPhotoError,
} from '@/lib/gmaps/photos'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

const BATCH_SIZE = Number(process.env.GMAPS_PHOTOS_BATCH_SIZE ?? 7)
const MAX_MONTH_USD = Number(process.env.GMAPS_PHOTOS_MAX_MONTH_USD ?? 180) // buffer 10%

function serviceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )
}

interface ProjectClaim {
  id: string
  name_official: string
  province: string | null
  district: string | null
  address_full: string | null
  lat: number | null
  lng: number | null
  gmaps_place_id: string | null
}

interface RunResult {
  claimed: number
  done: number
  not_found: number
  failed: number
  find_place_calls: number
  photo_calls: number
  month_spend_usd: number
  errors: Array<{ id: string; error: string }>
}

async function processProject(
  db: ReturnType<typeof serviceClient>,
  p: ProjectClaim,
): Promise<{ status: 'done' | 'not_found' | 'failed'; findPlaceCalls: number; photoCalls: number; error?: string }> {
  let findPlaceCalls = 0
  let photoCalls = 0

  try {
    const query = buildQuery({
      name: p.name_official,
      district: p.district,
      province: p.province,
    })

    const bias = p.lat != null && p.lng != null
      ? { lat: Number(p.lat), lng: Number(p.lng), radiusM: 2000 }
      : undefined

    findPlaceCalls = 1
    const found = await findPlaceFromText(query, bias)

    if (!found) {
      await db
        .from('projects')
        .update({
          gmaps_photos_status: 'not_found',
          gmaps_photos_fetched_at: new Date().toISOString(),
          gmaps_photos_last_error: 'No place candidate',
        })
        .eq('id', p.id)
      return { status: 'not_found', findPlaceCalls, photoCalls }
    }

    // Save place_id even if no photo (so we don't re-find)
    if (!found.photoReference) {
      await db
        .from('projects')
        .update({
          gmaps_place_id: found.placeId,
          gmaps_photos_status: 'not_found',
          gmaps_photos_fetched_at: new Date().toISOString(),
          gmaps_photos_last_error: 'Place has no photos',
        })
        .eq('id', p.id)
      return { status: 'not_found', findPlaceCalls, photoCalls }
    }

    photoCalls = 1
    const { buffer, contentType } = await fetchPhotoBinary(found.photoReference, 1200)
    const publicUrl = await uploadProjectPhoto(p.id, buffer, contentType)

    await db
      .from('projects')
      .update({
        gmaps_place_id: found.placeId,
        gmaps_photo_url: publicUrl,
        gmaps_photo_attribution: found.photoAttribution,
        gmaps_photos_status: 'done',
        gmaps_photos_fetched_at: new Date().toISOString(),
        gmaps_photos_last_error: null,
      })
      .eq('id', p.id)

    return { status: 'done', findPlaceCalls, photoCalls }
  } catch (err) {
    const msg = err instanceof GmapsPhotoError
      ? `${err.code}: ${err.message}`
      : err instanceof Error ? err.message : String(err)

    await db
      .from('projects')
      .update({
        gmaps_photos_status: 'failed',
        gmaps_photos_last_error: msg.slice(0, 500),
        gmaps_photos_fetched_at: new Date().toISOString(),
      })
      .eq('id', p.id)

    return { status: 'failed', findPlaceCalls, photoCalls, error: msg }
  }
}

export async function GET(req: NextRequest) {
  // Auth
  const authHeader = req.headers.get('authorization')
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const db = serviceClient()

  // Budget guard
  const { data: spendRow } = await db.rpc('gmaps_month_spend_usd')
  const monthSpend = Number(spendRow ?? 0)
  if (monthSpend >= MAX_MONTH_USD) {
    return NextResponse.json({
      skipped: true,
      reason: 'Monthly budget reached',
      month_spend_usd: monthSpend,
      max_month_usd: MAX_MONTH_USD,
    })
  }

  // Claim batch
  const { data: claimed, error: claimErr } = await db.rpc('claim_gmaps_photos_batch', {
    p_batch_size: BATCH_SIZE,
  })
  if (claimErr) {
    return NextResponse.json({ error: 'claim_failed', detail: claimErr.message }, { status: 500 })
  }

  const projects = (claimed ?? []) as ProjectClaim[]
  const result: RunResult = {
    claimed: projects.length,
    done: 0,
    not_found: 0,
    failed: 0,
    find_place_calls: 0,
    photo_calls: 0,
    month_spend_usd: monthSpend,
    errors: [],
  }

  // Process sequentially to avoid hammering Places API + storage
  for (const p of projects) {
    const r = await processProject(db, p)
    result.find_place_calls += r.findPlaceCalls
    result.photo_calls += r.photoCalls
    if (r.status === 'done') result.done += 1
    else if (r.status === 'not_found') result.not_found += 1
    else {
      result.failed += 1
      if (r.error) result.errors.push({ id: p.id, error: r.error })
    }
  }

  // Track usage for budget guard
  if (result.find_place_calls > 0 || result.photo_calls > 0) {
    await db.rpc('track_gmaps_usage', {
      p_find_place: result.find_place_calls,
      p_photo: result.photo_calls,
    })
  }

  // Refresh month spend after tracking
  const { data: newSpend } = await db.rpc('gmaps_month_spend_usd')
  result.month_spend_usd = Number(newSpend ?? monthSpend)

  return NextResponse.json(result)
}
