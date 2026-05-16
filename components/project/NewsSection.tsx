import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Article {
  id: string
  slug: string
  title: string
  excerpt: string | null
  hero_image_url: string | null
  views_count: number
  generated_at: string
}

async function fetchNews(projectId: string): Promise<Article[]> {
  const supabase = await createClient()
  const { data } = await supabase
    .from('khao_luan')
    .select('id, slug, title, excerpt, hero_image_url, views_count, generated_at')
    .eq('published', true)
    .contains('related_project_ids', [projectId])
    .order('generated_at', { ascending: false })
    .limit(4)
  return (data ?? []) as Article[]
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export default async function NewsSection({
  projectId,
  projectName,
}: {
  projectId: string
  projectName: string
}) {
  const articles = await fetchNews(projectId)

  return (
    <section id="tin-tuc" className="scroll-mt-28">
      <h2 className="text-xl font-bold text-[#0D1B3D] mb-4">Tin tức & Khảo luận</h2>

      {articles.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E2E8F0] p-6 text-center">
          <div className="text-4xl mb-3">📰</div>
          <div className="text-sm font-medium text-[#0D1B3D] mb-1">
            Tin tức về {projectName}
          </div>
          <p className="text-sm text-[#94A3B8]">
            Cập nhật tin tức và phân tích thị trường sẽ xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((a) => (
            <Link
              key={a.id}
              href={`/khao-luan/${a.slug}`}
              className="flex gap-4 bg-white rounded-xl border border-[#E2E8F0] p-4 hover:shadow-md transition-shadow group"
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
      )}
    </section>
  )
}
