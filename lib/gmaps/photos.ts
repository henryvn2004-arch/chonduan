// Google Places Photos backfill helper.
//
// Flow per project:
//   1. findPlaceFromText(name + district + province) → place_id + photo_reference[]
//   2. fetchPhotoBinary(photo_reference) → Buffer
//   3. uploadToStorage(buffer, project_id) → public URL
//
// Pricing (Legacy Places API):
//   - Find Place from Text: $17/1000
//   - Place Photo: $7/1000
// Both fit within $200/month free credit.

const FIND_PLACE_URL = 'https://maps.googleapis.com/maps/api/place/findplacefromtext/json'
const PHOTO_URL = 'https://maps.googleapis.com/maps/api/place/photo'

const API_KEY = process.env.GOOGLE_MAPS_SERVER_KEY ?? process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

export interface FindPlaceResult {
  placeId: string
  photoReference: string | null
  photoAttribution: string | null
  rawName: string | null
}

export class GmapsPhotoError extends Error {
  constructor(message: string, public code: 'NO_API_KEY' | 'NOT_FOUND' | 'API_ERROR' | 'PHOTO_FETCH_FAILED' | 'UPLOAD_FAILED') {
    super(message)
    this.name = 'GmapsPhotoError'
  }
}

/**
 * Find Place from Text — returns place_id + first photo reference.
 * One billable Find Place request.
 */
export async function findPlaceFromText(
  query: string,
  bias?: { lat: number; lng: number; radiusM?: number },
): Promise<FindPlaceResult | null> {
  if (!API_KEY) throw new GmapsPhotoError('Missing GOOGLE_MAPS_SERVER_KEY', 'NO_API_KEY')

  const params = new URLSearchParams({
    input: query,
    inputtype: 'textquery',
    fields: 'place_id,name,photos',
    language: 'vi',
    region: 'vn',
    key: API_KEY,
  })

  if (bias) {
    const r = bias.radiusM ?? 2000
    params.set('locationbias', `circle:${r}@${bias.lat},${bias.lng}`)
  }

  const res = await fetch(`${FIND_PLACE_URL}?${params}`, {
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new GmapsPhotoError(`Find Place HTTP ${res.status}`, 'API_ERROR')
  }

  const data = await res.json()

  if (data.status === 'ZERO_RESULTS') return null
  if (data.status !== 'OK') {
    throw new GmapsPhotoError(`Find Place status=${data.status} ${data.error_message ?? ''}`, 'API_ERROR')
  }

  const candidate = data.candidates?.[0]
  if (!candidate?.place_id) return null

  const firstPhoto = candidate.photos?.[0]
  return {
    placeId: candidate.place_id,
    photoReference: firstPhoto?.photo_reference ?? null,
    photoAttribution: firstPhoto?.html_attributions?.[0] ?? null,
    rawName: candidate.name ?? null,
  }
}

/**
 * Fetch photo binary from Place Photo endpoint.
 * One billable Place Photo request.
 */
export async function fetchPhotoBinary(
  photoReference: string,
  maxWidth = 1200,
): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  if (!API_KEY) throw new GmapsPhotoError('Missing GOOGLE_MAPS_SERVER_KEY', 'NO_API_KEY')

  const params = new URLSearchParams({
    photo_reference: photoReference,
    maxwidth: String(maxWidth),
    key: API_KEY,
  })

  const res = await fetch(`${PHOTO_URL}?${params}`, {
    cache: 'no-store',
    redirect: 'follow',
  })

  if (!res.ok) {
    throw new GmapsPhotoError(`Photo HTTP ${res.status}`, 'PHOTO_FETCH_FAILED')
  }

  const contentType = res.headers.get('content-type') ?? 'image/jpeg'
  if (!contentType.startsWith('image/')) {
    throw new GmapsPhotoError(`Unexpected content-type: ${contentType}`, 'PHOTO_FETCH_FAILED')
  }

  return {
    buffer: await res.arrayBuffer(),
    contentType,
  }
}

/** Pick extension from Content-Type. */
function extFor(contentType: string): string {
  if (contentType.includes('png')) return 'png'
  if (contentType.includes('webp')) return 'webp'
  return 'jpg'
}

/**
 * Upload photo binary to Supabase Storage (project-photos bucket).
 * Returns the public URL.
 */
export async function uploadProjectPhoto(
  projectId: string,
  buffer: ArrayBuffer,
  contentType: string,
): Promise<string> {
  const { createClient } = await import('@supabase/supabase-js')
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  )

  const path = `${projectId}.${extFor(contentType)}`

  const { error } = await db.storage
    .from('project-photos')
    .upload(path, buffer, {
      contentType,
      cacheControl: '31536000', // 1 year
      upsert: true,
    })

  if (error) {
    throw new GmapsPhotoError(`Storage upload failed: ${error.message}`, 'UPLOAD_FAILED')
  }

  const { data } = db.storage.from('project-photos').getPublicUrl(path)
  return data.publicUrl
}

/**
 * Build the search query string for a project.
 * Use name + district + province for best precision.
 */
export function buildQuery(opts: {
  name: string
  district?: string | null
  province?: string | null
}): string {
  const parts = [opts.name, opts.district, opts.province].filter(Boolean) as string[]
  return parts.join(', ')
}
