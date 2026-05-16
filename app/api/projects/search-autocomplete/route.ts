import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  const supabase = await createClient()

  // Try tsvector full-text first, fall back to ilike for short queries
  const { data } = await supabase
    .from('projects')
    .select('id, name_official, slug, province, lat, lng')
    .textSearch('search_keywords', q, { config: 'simple', type: 'websearch' })
    .not('published', 'eq', false)
    .limit(8)

  if (data && data.length > 0) return NextResponse.json(data)

  // Fallback: ilike on name
  const { data: fallback } = await supabase
    .from('projects')
    .select('id, name_official, slug, province, lat, lng')
    .ilike('name_official', `%${q}%`)
    .not('published', 'eq', false)
    .limit(8)

  return NextResponse.json(fallback ?? [])
}
