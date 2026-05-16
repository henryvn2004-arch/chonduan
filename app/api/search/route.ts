import { NextRequest, NextResponse } from 'next/server'
import { searchProjects } from '@/lib/search'

export const runtime = 'nodejs'

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  try {
    const result = await searchProjects({
      q: sp.get('q') ?? '',
      mode: sp.get('mode') ?? 'sale',
      province: sp.get('province') ?? '',
      district: sp.get('district') ?? '',
      property_type: sp.get('property_type') ?? '',
      status: sp.get('status') ?? '',
      price_min: parseInt(sp.get('price_min') ?? '0'),
      price_max: parseInt(sp.get('price_max') ?? '0'),
      amenities: sp.get('amenities')?.split(',').filter(Boolean) ?? [],
      investment_score_min: parseInt(sp.get('investment_score_min') ?? '0'),
      bedrooms: sp.get('bedrooms') ?? '',
      page: parseInt(sp.get('page') ?? '0'),
      sort: sp.get('sort') ?? 'relevance',
    })
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
