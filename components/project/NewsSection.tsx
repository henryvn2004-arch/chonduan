import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Newspaper, Zap, ExternalLink } from 'lucide-react'

interface Article {
  id: string
  slug: string
  title: string
  excerpt: string | null
  hero_image_url: string | null
  views_count: number
  generated_at: string
  is_boosted: boolean | null
  is_agent_authored: boolean | null
  agent_id: string | null
}

interface NewsItem {
  title: string
  link: string
  pubDate: string
  source: string
}

async function fetchKhaoLuan(projectId: string): Promise<Article[]> {
  const supabase = await createClient()

  const [{ data: boosted }, { data: regular }] = await Promise.all([
    supabase
      .from('khao_luan')
      .select('id, slug, title, excerpt, hero_image_url, views_count, generated_at, is_boosted, is_agent_authored, agent_id')
      .eq('published', true)
      .eq('is_boosted', true)
      .eq('related_project_id', projectId)
      .gt('boost_expires_at', new Date().toISOString())
      .order('generated_at', { ascending: false })
      .limit(2),
    supabase
      .from('khao_luan')
      .select('id, slug, title, excerpt, hero_image_url, views_count, generated_at, is_boosted, is_agent_authored, agent_id')
      .eq('published', true)
      .contains('related_project_ids', [projectId])
      .order('generated_at', { ascending: false })
      .limit(3),
  ])

  const boostedIds = new Set((boosted ?? []).map(a => a.id))
  return [
    ...(boosted ?? []),
    ...(regular ?? []).filter(a => !boostedIds.has(a.id)),
  ].slice(0, 4) as Article[]
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
}

function parseRssItems(xml: string): NewsItem[] {
  const items: NewsItem[] = []
  const itemRe = /<item>([\s\S]*?)<\/item>/g
  let m: RegExpExecArray | null
  while ((m = itemRe.exec(xml)) !== null) {
    const block = m[1]
    const rawTitle = /<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/.exec(block)?.[1] ?? ''
    const link = /<link>([\s\S]*?)<\/link>/.exec(block)?.[1]?.trim() ?? ''
    const pubDate = /<pubDate>([\s\S]*?)<\/pubDate>/.exec(block)?.[1]?.trim() ?? ''
    const source = /<source[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/source>/.exec(block)?.[1]?.trim() ?? ''
    if (rawTitle && link) {
      items.push({
        title: decodeHtmlEntities(rawTitle).replace(/\s*-\s*[^-]+$/, '').trim(),
        link,
        pubDate,
        source: decodeHtmlEntities(source),
      })
    }
  }
  return items
}

async function fetchRss(query: string): Promise<NewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=vi&gl=VN&ceid=VN:vi`
  try {
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; ChonDuAn/1.0)' },
    })
    if (!res.ok) return []
    return parseRssItems(await res.text())
  } catch {
    return []
  }
}

async function fetchGoogleNews(projectName: string, province: string): Promise<NewsItem[]> {
  // Try 1: unquoted name + province (broader recall than exact-phrase quotes)
  let items = await fetchRss(`${projectName} ${province}`.trim())
  // Try 2: name only — many lesser-known projects have news that don't mention province
  if (items.length === 0) {
    items = await fetchRss(projectName)
  }
  return items.slice(0, 6)
}

function fmtRelativeDate(input: string) {
  const d = new Date(input)
  if (isNaN(d.getTime())) return ''
  const diff = Date.now() - d.getTime()
  const day = 24 * 60 * 60 * 1000
  if (diff < day) {
    const hours = Math.max(1, Math.floor(diff / (60 * 60 * 1000)))
    return `${hours} giờ trước`
  }
  if (diff < 7 * day) return `${Math.floor(diff / day)} ngày trước`
  return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function NewsSection({
  projectId,
  projectName,
  province,
}: {
  projectId: string
  projectName: string
  province?: string
}) {
  const [news, khaoLuan] = await Promise.all([
    fetchGoogleNews(projectName, province ?? ''),
    fetchKhaoLuan(projectId),
  ])

  const googleNewsUrl = `https://news.google.com/search?q=${encodeURIComponent(`${projectName} ${province ?? ''}`.trim())}&hl=vi&gl=VN&ceid=VN:vi`

  return (
    <section id="tin-tuc" className="scroll-mt-28">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#0D1B3D]">Tin Tức</h2>
        {news.length > 0 && (
          <a
            href={googleNewsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs font-medium text-[#1565FF] hover:underline"
          >
            Xem trên Google News <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
          </a>
        )}
      </div>

      {/* Google News */}
      {news.length > 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] divide-y divide-[#E2E8F0]">
          {news.map((n, i) => (
            <a
              key={i}
              href={n.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-3 p-4 hover:bg-[#F8FAFC] transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
                <Newspaper className="w-4 h-4 text-[#1565FF]" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-[#0D1B3D] text-sm leading-snug line-clamp-2 group-hover:text-[#1565FF] transition-colors">
                  {n.title}
                </h3>
                <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[#94A3B8]">
                  {n.source && <span className="font-medium text-[#64748B]">{n.source}</span>}
                  {n.source && n.pubDate && <span>·</span>}
                  {n.pubDate && <span>{fmtRelativeDate(n.pubDate)}</span>}
                </div>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#CBD5E1] shrink-0 mt-1 group-hover:text-[#1565FF]" strokeWidth={2} />
            </a>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 text-center">
          <Newspaper className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" strokeWidth={1.5} />
          <div className="text-sm font-medium text-[#0D1B3D] mb-1">
            Chưa có tin tức về {projectName}
          </div>
          <p className="text-sm text-[#94A3B8]">
            Tin tức từ Google News sẽ xuất hiện tại đây khi có cập nhật.
          </p>
        </div>
      )}

      {/* Khao luan articles (if any) */}
      {khaoLuan.length > 0 && (
        <div className="mt-5">
          <h3 className="text-sm font-semibold text-[#64748B] uppercase tracking-wide mb-2">
            Bài phân tích
          </h3>
          <div className="space-y-3">
            {khaoLuan.map((a) => (
              <Link
                key={a.id}
                href={`/kham-pha/${a.slug}`}
                className={`flex gap-4 bg-white rounded-xl border p-4 hover:shadow-md transition-shadow group ${
                  a.is_boosted ? 'border-[#1565FF]/30 ring-1 ring-[#1565FF]/10' : 'border-[#E2E8F0]'
                }`}
              >
                {a.hero_image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={a.hero_image_url}
                    alt={a.title}
                    className="w-20 h-16 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {a.is_boosted && (
                      <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-[#1565FF] shrink-0">
                        <Zap className="w-2.5 h-2.5" strokeWidth={2.5} /> Nổi bật
                      </span>
                    )}
                    {a.is_agent_authored && !a.is_boosted && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500 shrink-0">
                        Từ môi giới
                      </span>
                    )}
                  </div>
                  <h3 className="font-semibold text-[#0D1B3D] text-sm leading-snug line-clamp-2 group-hover:text-[#1565FF] transition-colors">
                    {a.title}
                  </h3>
                  {a.excerpt && (
                    <p className="text-xs text-[#64748B] mt-1 line-clamp-2">{a.excerpt}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-[10px] text-[#94A3B8]">
                    <span>{fmtDate(a.generated_at)}</span>
                    {a.views_count > 0 && <span>{a.views_count.toLocaleString('vi-VN')} lượt xem</span>}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </section>
  )
}
