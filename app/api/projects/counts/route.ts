import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

export interface ProjectCounts {
  provinces: Record<string, number>                    // province → count
  districts: Record<string, Record<string, number>>   // province → district → count
}

export async function GET() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('projects')
    .select('province, district')
    .not('lat', 'is', null)
    .not('lng', 'is', null)

  if (error) return NextResponse.json({ provinces: {}, districts: {} }, { status: 500 })

  const provinces: Record<string, number> = {}
  const districts: Record<string, Record<string, number>> = {}

  for (const row of data ?? []) {
    if (!row.province) continue
    provinces[row.province] = (provinces[row.province] ?? 0) + 1
    if (row.district) {
      if (!districts[row.province]) districts[row.province] = {}
      districts[row.province][row.district] = (districts[row.province][row.district] ?? 0) + 1
    }
  }

  return NextResponse.json({ provinces, districts } satisfies ProjectCounts, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' },
  })
}
