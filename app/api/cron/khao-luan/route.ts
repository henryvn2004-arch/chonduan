import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://phaplyduan.vn'
const CRON_SECRET = process.env.CRON_SECRET

// 8 fixed topic tags — rotate through them
const TAGS = [
  'thi-truong-bat-dong-san',
  'mua-nha-lan-dau',
  'dau-tu-can-ho',
  'cho-thue-can-ho',
  'phap-ly-bat-dong-san',
  'quy-hoach-do-thi',
  'tai-chinh-mua-nha',
  'du-an-noi-bat',
]

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

async function pickTag(supabase: Awaited<ReturnType<typeof createClient>>): Promise<string> {
  // Pick the tag with fewest recent articles
  const { data } = await supabase
    .from('khao_luan')
    .select('tags')
    .gte('generated_at', new Date(Date.now() - 7 * 86400_000).toISOString())
  const counts: Record<string, number> = {}
  for (const tag of TAGS) counts[tag] = 0
  for (const row of data ?? []) {
    for (const t of row.tags ?? []) {
      if (t in counts) counts[t]++
    }
  }
  return TAGS.reduce((a, b) => (counts[a] <= counts[b] ? a : b))
}

async function fetchRelatedProjects(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tag: string,
): Promise<Array<{ id: string; name_official: string; province: string; slug: string }>> {
  const { data } = await supabase
    .from('projects')
    .select('id, name_official, province, slug')
    .eq('published', true)
    .order('investment_score', { ascending: false })
    .limit(5)
  return data ?? []
}

async function generateArticle(tag: string, relatedProjects: typeof fetchRelatedProjects extends (...args: any[]) => Promise<infer T> ? T : never): Promise<{ title: string; content: string } | null> {
  const projectLinks = relatedProjects
    .map((p) => `- [${p.name_official}](${BASE_URL}/du-an/${encodeURIComponent(p.province)}/${p.slug})`)
    .join('\n')

  const prompt = `Viết một bài khảo luận bất động sản Việt Nam 1200-2000 từ về chủ đề: "${tag.replace(/-/g, ' ')}".

Yêu cầu:
- Tiếng Việt, phong cách báo chí chuyên nghiệp, khách quan
- Có số liệu, dẫn chứng thực tế thị trường VN
- Cấu trúc: tiêu đề H2/H3, các đoạn rõ ràng
- Tự nhiên đề cập và liên kết tới các dự án liên quan dưới đây (dùng markdown link):
${projectLinks}

Output JSON (không thêm gì khác):
{
  "title": "Tiêu đề bài viết 60-80 ký tự",
  "content": "Nội dung markdown đầy đủ 1200-2000 từ"
}`

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY!,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    })
    if (!resp.ok) return null
    const data = await resp.json()
    const raw = data.content[0].text.trim()
    const clean = raw.startsWith('```') ? raw.split('```')[1].replace(/^json\n?/, '') : raw
    return JSON.parse(clean)
  } catch {
    return null
  }
}

export async function GET(req: NextRequest) {
  // Verify cron secret (set CRON_SECRET env var, pass as ?secret=)
  const secret = req.nextUrl.searchParams.get('secret')
  if (CRON_SECRET && secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const tag = await pickTag(supabase)
  const relatedProjects = await fetchRelatedProjects(supabase, tag)
  const article = await generateArticle(tag, relatedProjects)

  if (!article) {
    return NextResponse.json({ error: 'Claude generation failed' }, { status: 500 })
  }

  const slug = `${slugify(article.title)}-${Date.now()}`
  const { error } = await supabase.from('khao_luan').insert({
    slug,
    title: article.title,
    excerpt: article.content.slice(0, 200).replace(/[#*\[\]]/g, ''),
    content_markdown: article.content,
    tags: [tag],
    related_project_ids: relatedProjects.map((p) => p.id),
    published: true,
    ai_model_used: 'claude-sonnet-4-6',
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, slug, tag, title: article.title })
}
