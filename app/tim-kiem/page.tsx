import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { searchProjects } from '@/lib/search'
import SearchClient from './SearchClient'
import Nav from '@/components/nav/Nav'
import type { FilterState, Mode, ProjectPin } from '@/types/maps'
import { projectPath } from '@/lib/utils/slug'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tìm kiếm dự án bất động sản',
}

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Phù hợp nhất' },
  { value: 'price_asc', label: 'Giá tăng dần' },
  { value: 'price_desc', label: 'Giá giảm dần' },
  { value: 'investment', label: 'Điểm đầu tư' },
]

const TIER_LABEL: Record<string, string> = {
  binh_dan: 'Bình dân',
  trung_cap: 'Trung cấp',
  cao_cap: 'Cao cấp',
  hang_sang: 'Hạng sang',
}

const TIER_COLOR: Record<string, string> = {
  binh_dan: 'bg-green-100 text-green-700',
  trung_cap: 'bg-yellow-100 text-yellow-700',
  cao_cap: 'bg-orange-100 text-orange-700',
  hang_sang: 'bg-red-100 text-red-700',
}

function ProjectCard({ p, mode }: { p: ProjectPin; mode: Mode }) {
  const priceText = mode === 'rent_long'
    ? p.rent_2br_avg_monthly_vnd
      ? `Từ ${(p.rent_2br_avg_monthly_vnd / 1_000_000).toFixed(0)} tr/tháng`
      : null
    : p.price_primary_per_m2_min
      ? `Từ ${(p.price_primary_per_m2_min / 1_000_000).toFixed(0)} tr/m²`
      : null

  return (
    <Link
      href={projectPath(p.province, p.district, p.slug)}
      className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden hover:shadow-md transition-shadow group"
    >
      <div className="relative h-44 bg-[#F1F5F9]">
        {p.banner_url ? (
          <Image src={p.banner_url} alt={p.name_official} fill className="object-cover group-hover:scale-[1.02] transition-transform duration-300" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1565FF]/20 to-[#0D1B3D]/10" />
        )}
        {p.tier && (
          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-semibold ${TIER_COLOR[p.tier] ?? 'bg-gray-100 text-gray-700'}`}>
            {TIER_LABEL[p.tier] ?? p.tier}
          </span>
        )}
      </div>
      <div className="p-4">
        <div className="text-sm font-semibold text-[#0D1B3D] leading-snug mb-1 line-clamp-2">{p.name_official}</div>
        <div className="text-xs text-[#64748B] mb-2">{p.district ? `${p.district}, ` : ''}{p.province}</div>
        {priceText && (
          <div className="text-sm font-bold text-[#1565FF]">{priceText}</div>
        )}
        {p.description_short && (
          <p className="text-xs text-[#94A3B8] mt-2 line-clamp-2">{p.description_short}</p>
        )}
      </div>
    </Link>
  )
}

function Pagination({ page, total, pageSize, q, mode, params }: {
  page: number; total: number; pageSize: number; q: string; mode: string
  params: URLSearchParams
}) {
  const totalPages = Math.ceil(total / pageSize)
  if (totalPages <= 1) return null

  function pageUrl(p: number) {
    const next = new URLSearchParams(params.toString())
    next.set('page', String(p))
    return `/tim-kiem?${next}`
  }

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {page > 0 && (
        <Link href={pageUrl(page - 1)} className="px-4 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#0D1B3D] hover:bg-[#F8FAFC]">
          Trước
        </Link>
      )}
      <span className="text-sm text-[#64748B]">Trang {page + 1} / {totalPages}</span>
      {page < totalPages - 1 && (
        <Link href={pageUrl(page + 1)} className="px-4 py-2 rounded-lg border border-[#E2E8F0] text-sm text-[#0D1B3D] hover:bg-[#F8FAFC]">
          Sau
        </Link>
      )}
    </div>
  )
}

export default async function TimKiemPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>
}) {
  const sp = await searchParams
  const q = sp.q?.trim() ?? ''
  const mode = (sp.mode === 'rent_long' ? 'rent_long' : 'sale') as Mode
  const page = parseInt(sp.page ?? '0')
  const sort = sp.sort ?? 'relevance'

  const filters: FilterState = {
    property_type: sp.property_type ?? '',
    price_min: parseInt(sp.price_min ?? '0'),
    price_max: parseInt(sp.price_max ?? (mode === 'rent_long' ? '200' : '100')),
    province: sp.province ?? '',
    district: sp.district ?? '',
    status: sp.status ?? '',
    amenities: sp.amenities?.split(',').filter(Boolean) ?? [],
    investment_score_min: parseInt(sp.investment_score_min ?? '0'),
    bedrooms: sp.bedrooms ?? '',
  }

  const { results, total, pageSize } = await searchProjects({
    q,
    mode,
    ...filters,
    page,
    sort,
  })

  const urlParams = new URLSearchParams(sp as Record<string, string>)

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Nav mode={mode} />

      <main className="flex flex-1 overflow-hidden pt-14">
        {/* Filter sidebar — desktop */}
        <div className="hidden md:flex">
          <Suspense>
            <SearchClient mode={mode} filters={filters} total={total} q={q} />
          </Suspense>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto bg-[#F5F7FA]">
          <div className="max-w-5xl mx-auto px-4 py-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h1 className="text-lg font-bold text-[#0D1B3D]">
                  {q ? `Kết quả cho "${q}"` : 'Tất cả dự án'}
                </h1>
                <p className="text-sm text-[#64748B]">{total} dự án phù hợp</p>
              </div>

              {/* Sort */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#64748B]">Sắp xếp:</span>
                <div className="flex gap-1">
                  {SORT_OPTIONS.map(s => {
                    const next = new URLSearchParams(urlParams.toString())
                    next.set('sort', s.value)
                    next.delete('page')
                    return (
                      <Link
                        key={s.value}
                        href={`/tim-kiem?${next}`}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                          sort === s.value
                            ? 'bg-[#1565FF] text-white border-[#1565FF]'
                            : 'bg-white text-[#64748B] border-[#E2E8F0] hover:border-[#1565FF]'
                        }`}
                      >
                        {s.label}
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Results grid */}
            {results.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-5xl mb-4">🔍</div>
                <p className="text-[#0D1B3D] font-semibold mb-2">Không tìm thấy dự án phù hợp</p>
                <p className="text-sm text-[#94A3B8]">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                <Link href="/tim-kiem" className="mt-4 inline-block text-sm text-[#1565FF] hover:underline">
                  Xóa bộ lọc
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {results.map(p => (
                  <ProjectCard key={p.id} p={p} mode={mode} />
                ))}
              </div>
            )}

            <Pagination page={page} total={total} pageSize={pageSize} q={q} mode={mode} params={urlParams} />
          </div>
        </div>
      </main>
    </div>
  )
}
