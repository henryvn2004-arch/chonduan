import { NextRequest, NextResponse } from 'next/server'
import { textSearch, getPlaceDetails } from '@/lib/gmaps/places'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const query = searchParams.get('query')
  const placeId = searchParams.get('place_id')
  const region = searchParams.get('region') ?? undefined

  if (placeId) {
    const result = await getPlaceDetails(placeId)
    if (!result) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(result)
  }

  if (!query) {
    return NextResponse.json({ error: 'query or place_id required' }, { status: 400 })
  }

  const results = await textSearch(query, { region })
  return NextResponse.json(results)
}
