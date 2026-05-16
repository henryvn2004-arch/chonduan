import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const maxDuration = 300

const NOMINATIM = 'https://nominatim.openstreetmap.org/search'
const UA = 'chonduan-scraper/1.0 (Vietnam real estate; henry@chonduan.vn)'

async function nominatim(query: string): Promise<{ lat: number; lng: number } | null> {
  const url = `${NOMINATIM}?q=${encodeURIComponent(query)}&format=jsonv2&limit=1&countrycodes=vn`
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'vi,en' } })
    const data = await res.json()
    if (data?.[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch { /* ignore */ }
  return null
}

function sleep(ms: number) {
  return new Promise(r => setTimeout(r, ms))
}

async function geocodeProject(row: {
  name_official: string
  province: string | null
  address_full: string | null
}): Promise<{ lat: number; lng: number } | null> {
  // Attempt 1: full address
  if (row.address_full) {
    const r = await nominatim(row.address_full + ', Việt Nam')
    if (r) return r
    await sleep(1100)
  }
  // Attempt 2: name + province
  const r2 = await nominatim(`${row.name_official}, ${row.province ?? ''}, Việt Nam`)
  if (r2) return r2
  await sleep(1100)
  // Attempt 3: province centroid
  if (row.province) {
    const r3 = await nominatim(`${row.province}, Việt Nam`)
    return r3
  }
  return null
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()

  // Admin gate
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data: profile } = await supabase.from('user_profiles').select('user_type').eq('id', user.id).single()
  if (profile?.user_type !== 'admin') return NextResponse.json({ error: 'forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const limit: number = body.limit ?? 50   // process in chunks to avoid timeout

  const { data: rows } = await supabase
    .from('projects')
    .select('id, name_official, province, address_full')
    .is('lat', null)
    .limit(limit)

  if (!rows?.length) return NextResponse.json({ message: 'all projects geocoded', updated: 0 })

  let updated = 0
  let failed = 0

  for (const row of rows) {
    const coords = await geocodeProject(row)
    await sleep(1100)

    if (coords) {
      await supabase.from('projects').update({ lat: coords.lat, lng: coords.lng }).eq('id', row.id)
      updated++
    } else {
      failed++
    }
  }

  const { count } = await supabase.from('projects').select('id', { count: 'exact', head: true }).is('lat', null)

  return NextResponse.json({ updated, failed, remaining: count ?? 0 })
}
