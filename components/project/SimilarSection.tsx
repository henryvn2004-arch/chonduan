import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'

async function fetchSimilar(province: string, currentId: string) {
  const supabase = await createClient()
  const { data } = await supabase
    .from('projects')
    .select('id, slug, name_official, province, district, banner_url, price_primary_per_m2_min, tier')
    .eq('province', province)
    .neq('id', currentId)
    .not('published', 'eq', false)
    .limit(4)
  return data ?? []
}

const TIER_LABEL: Record<string, string> = {
  binh_dan: 'Bình dân',
  trung_cap: 'Trung cấp',
  cao_cap: 'Cao cấp',
  hang_sang: 'Hạng sang',
}

export default async function SimilarSection({
  province,
  currentId,
}: {
  province: string
  currentId: string
}) {
  const projects = await fetchSimilar(province, currentId)

  if (projects.length === 0) return null

  return (
    <section className="scroll-mt-28">
      <h2 className="text-xl font-bold text-[#0D1B3D] mb-4">Dự án tương tự tại {province}</h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/du-an/${p.province}/${p.slug}`}
            className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden hover:shadow-md transition-shadow"
          >
            <div className="relative h-28 bg-[#F1F5F9]">
              {p.banner_url ? (
                <Image src={p.banner_url} alt={p.name_official} fill className="object-cover" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-[#1565FF]/20 to-[#0D1B3D]/10" />
              )}
            </div>
            <div className="p-3">
              <div className="text-xs font-semibold text-[#0D1B3D] leading-snug mb-1 line-clamp-2">
                {p.name_official}
              </div>
              <div className="text-xs text-[#64748B]">{p.district ?? p.province}</div>
              {p.price_primary_per_m2_min && (
                <div className="text-xs font-bold text-[#1565FF] mt-1">
                  Từ {(p.price_primary_per_m2_min / 1_000_000).toFixed(0)} tr/m²
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
