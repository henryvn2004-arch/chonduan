import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { PROVINCES_DATA } from '@/lib/data/provinces-districts'

export const runtime = 'nodejs'
export const maxDuration = 300  // 5 phút — Overpass queries có thể chậm

// ─── Overpass queries theo từng loại hình ────────────────────────────────────

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter'

// Bounding box Vietnam: SW(8.18, 102.14) → NE(23.39, 109.46)
const VN_BBOX = '8.18,102.14,23.39,109.46'

const QUERIES: Record<string, string> = {
  van_phong: `
    [out:json][timeout:90][bbox:${VN_BBOX}];
    (
      way["building"="office"]["name"];
      relation["building"="office"]["name"];
      way["office"]["name"];
      node["office"]["name"];
    );
    out center tags;
  `,
  nha_xuong_cn: `
    [out:json][timeout:90][bbox:${VN_BBOX}];
    (
      way["building"="industrial"]["name"];
      way["building"="warehouse"]["name"];
      way["industrial"="factory"]["name"];
      way["industrial"="warehouse"]["name"];
    );
    out center tags;
  `,
  khu_cong_nghiep: `
    [out:json][timeout:90][bbox:${VN_BBOX}];
    (
      way["landuse"="industrial"]["name"~"(KCN|[Kk]hu [Cc]ông [Nn]ghiệp|[Kk]hu [Cc]ong [Nn]ghiep|[Ii]ndustrial)",i];
      relation["landuse"="industrial"]["name"~"(KCN|[Kk]hu [Cc]ông [Nn]ghiệp|[Kk]hu [Cc]ong [Nn]ghiep|[Ii]ndustrial)",i];
      way["industrial"="zone"]["name"];
      relation["industrial"="zone"]["name"];
    );
    out center tags;
  `,
  dat_nong_nghiep: `
    [out:json][timeout:90][bbox:${VN_BBOX}];
    (
      way["landuse"="farmland"]["name"];
      way["landuse"="orchard"]["name"];
      way["landuse"="meadow"]["name"];
      way["landuse"="greenhouse_horticulture"]["name"];
      relation["landuse"="farmland"]["name"];
    );
    out center tags;
  `,
  dat_rung: `
    [out:json][timeout:90][bbox:${VN_BBOX}];
    (
      way["landuse"="forest"]["name"];
      relation["landuse"="forest"]["name"];
      way["natural"="wood"]["name"];
      relation["natural"="wood"]["name"];
      way["landuse"="conservation"]["name"];
    );
    out center tags;
  `,
  khu_nghi_duong: `
    [out:json][timeout:90][bbox:${VN_BBOX}];
    (
      node["tourism"="resort"]["name"];
      way["tourism"="resort"]["name"];
      relation["tourism"="resort"]["name"];
      way["leisure"="resort"]["name"];
      way["building"="hotel"]["name"];
    );
    out center tags;
  `,
  nha_o_xa_hoi: `
    [out:json][timeout:90][bbox:${VN_BBOX}];
    (
      way["building"~"(apartments|residential)"]["name"~"(xã hội|xa hoi|NOXH|noxh|nhà ở xã hội)",i];
      way["landuse"="residential"]["name"~"(xã hội|xa hoi|NOXH|noxh)",i];
    );
    out center tags;
  `,
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function nearestProvince(lat: number, lng: number): string {
  let best = PROVINCES_DATA[0]
  let bestDist = Infinity
  for (const p of PROVINCES_DATA) {
    const d = (p.lat - lat) ** 2 + (p.lng - lng) ** 2
    if (d < bestDist) { bestDist = d; best = p }
  }
  return best.name
}

function slugify(name: string, lat: number, lng: number): string {
  const base = name
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60)
  const coord = `${Math.round(lat * 100)}-${Math.round(lng * 100)}`
  return `${base}-${coord}`
}

interface OverpassElement {
  type: string
  id: number
  lat?: number
  lng?: number
  center?: { lat: number; lon: number }
  tags?: Record<string, string>
}

// ─── Admin guard ──────────────────────────────────────────────────────────────

async function assertAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase
    .from('user_profiles').select('user_type').eq('id', user.id).single()
  return profile?.user_type === 'admin'
}

// ─── POST /api/admin/scrape-osm ───────────────────────────────────────────────
// Body: { type: string }  (một loại hình mỗi lần để tránh timeout)

export async function POST(req: NextRequest) {
  if (!await assertAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  const { type } = await req.json() as { type?: string }
  if (!type || !QUERIES[type]) {
    return NextResponse.json(
      { error: `type không hợp lệ. Hợp lệ: ${Object.keys(QUERIES).join(', ')}` },
      { status: 400 }
    )
  }

  // 1. Query Overpass
  const overpassRes = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `data=${encodeURIComponent(QUERIES[type])}`,
    signal: AbortSignal.timeout(120_000),
  })
  if (!overpassRes.ok) {
    return NextResponse.json({ error: 'Overpass API lỗi' }, { status: 502 })
  }

  const overpassData = await overpassRes.json() as { elements: OverpassElement[] }
  const elements = overpassData.elements ?? []

  // 2. Transform
  const supabase = await createServiceClient()
  let inserted = 0
  let skipped = 0

  for (const el of elements) {
    const tags = el.tags ?? {}
    const name = tags['name'] || tags['name:vi'] || tags['name:en']
    if (!name) { skipped++; continue }

    const lat = el.lat ?? el.center?.lat
    const lng = el.lng ?? el.center?.lon
    if (!lat || !lng) { skipped++; continue }

    // Province từ OSM tags → fallback nearest center
    let province = tags['addr:province'] || tags['addr:city'] || tags['is_in:province'] || ''
    if (!province) province = nearestProvince(lat, lng)

    const slug = slugify(name, lat, lng)

    const row = {
      slug,
      name_official: name,
      property_type: type,
      province,
      district: tags['addr:district'] || null,
      lat,
      lng,
      published: false,
      data_quality: 'auto',
      description_short: tags['description'] || null,
      website: tags['website'] || tags['contact:website'] || null,
    }

    const { error } = await supabase
      .from('projects')
      .upsert(row, { onConflict: 'slug', ignoreDuplicates: true })

    if (error) { skipped++; continue }
    inserted++
  }

  return NextResponse.json({
    type,
    total_from_osm: elements.length,
    inserted,
    skipped,
    message: `Đã thêm ${inserted} dự án loại "${type}" từ OSM (bỏ qua ${skipped})`,
  })
}

// GET → trả về danh sách type có thể scrape
export async function GET() {
  if (!await assertAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  return NextResponse.json({ available_types: Object.keys(QUERIES) })
}
