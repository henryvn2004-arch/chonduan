import { NextRequest, NextResponse } from 'next/server'
import { nearbySearch } from '@/lib/gmaps/nearby'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = searchParams.get('radius')
  const category = searchParams.get('category')

  if (!lat || !lng || !radius || !category) {
    return NextResponse.json(
      { error: 'lat, lng, radius, category required' },
      { status: 400 }
    )
  }

  const results = await nearbySearch(Number(lat), Number(lng), Number(radius), category)
  return NextResponse.json(results)
}
