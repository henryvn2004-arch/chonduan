import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 1) return NextResponse.json([])

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('developers')
    .select('id, name, short_name, logo_url, total_projects_count')
    .ilike('name', `%${q}%`)
    .order('total_projects_count', { ascending: false })
    .limit(10)

  if (error) return NextResponse.json([], { status: 500 })
  return NextResponse.json(data ?? [])
}
