import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) return NextResponse.json([])

  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('id, name_official, slug, province, lat, lng')
    .ilike('name_official', `%${q}%`)
    .limit(8)

  return NextResponse.json(data ?? [])
}
