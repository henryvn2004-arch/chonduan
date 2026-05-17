import { createClient } from '@/lib/supabase/server'
import { projectPath } from '@/lib/utils/slug'

const BASE_URL = 'https://chonduan.vn'

function xml(urls: string[]): string {
  const entries = urls
    .map(
      (u) => `  <url><loc>${u}</loc><changefreq>weekly</changefreq></url>`,
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`
}

export async function GET() {
  const supabase = await createClient()

  const [{ data: projects }, { data: agents }, { data: articles }] = await Promise.all([
    supabase.from('projects').select('province, district, slug').eq('published', true).limit(10000),
    supabase.from('agents').select('slug').limit(5000),
    supabase.from('khao_luan').select('slug').eq('published', true).limit(5000),
  ])

  const urls: string[] = [BASE_URL, `${BASE_URL}/tim-kiem`]

  for (const p of projects ?? []) {
    if (p.province && p.slug) {
      urls.push(`${BASE_URL}${projectPath(p.province, p.district, p.slug)}`)
    }
  }
  for (const a of agents ?? []) {
    if (a.slug) urls.push(`${BASE_URL}/moi-gioi/${a.slug}`)
  }
  for (const k of articles ?? []) {
    if (k.slug) urls.push(`${BASE_URL}/khao-luan/${k.slug}`)
  }

  return new Response(xml(urls), {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
