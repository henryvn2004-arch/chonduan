import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { projectPath } from '@/lib/utils/slug'
import type { Metadata } from 'next'

interface Params {
  province: string
  district: string
  slug: string
}

const PROPERTY_TYPE_LABEL: Record<string, string> = {
  chung_cu: 'Chung cư',
  biet_thu: 'Biệt thự',
  lien_ke: 'Liền kề',
  shophouse: 'Shophouse',
  dat_nen: 'Đất nền',
  officetel: 'Officetel',
  condotel: 'Condotel',
}

const TIER_LABEL: Record<string, string> = {
  binh_dan: 'Bình dân',
  trung_cap: 'Trung cấp',
  cao_cap: 'Cao cấp',
  hang_sang: 'Hạng sang',
}

const STATUS_LABEL: Record<string, string> = {
  sap_mo_ban: 'Sắp mở bán',
  dang_mo_ban: 'Đang mở bán',
  dang_xay: 'Đang xây dựng',
  da_ban_giao: 'Đã bàn giao',
  da_ban_giao_lau: 'Đã bàn giao lâu',
}

const OWNERSHIP_LABEL: Record<string, string> = {
  lau_dai: 'Sổ hồng lâu dài',
  nam_50: '50 năm',
  nam_70: '70 năm',
  khac: 'Khác',
}

function fmt(n: number | null | undefined, unit: string): string | null {
  if (!n) return null
  return `${n.toLocaleString('vi-VN')} ${unit}`
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchProject(slug: string): Promise<Record<string, any> | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('projects')
    .select(
      'id, slug, name_official, province, district, ward, address_full, ' +
      'property_type, tier, status, year_start, year_handover, ' +
      'total_land_ha, total_towers, total_units, building_density_pct, ' +
      'price_primary_per_m2_min, price_primary_per_m2_max, ' +
      'price_secondary_per_m2_avg, price_trend, price_trend_pct_6m, ' +
      'rent_1br_avg_monthly_vnd, rent_2br_avg_monthly_vnd, rent_3br_avg_monthly_vnd, ' +
      'rent_demand_score, rental_yield_pct, ' +
      'description_short, description_long, ai_overview, ai_pros_cons, ai_faq, ' +
      'has_pool, has_gym, has_tennis_court, has_basketball_court, ' +
      'has_kindergarten, has_school_international, has_mall_internal, ' +
      'has_supermarket_internal, has_bbq_area, has_clubhouse, ' +
      'has_smart_home, has_ev_charging, has_24h_security, ' +
      'service_fee_per_m2_vnd, parking_car_monthly, parking_motorbike_monthly, ' +
      'land_origin_type, red_book_status, ownership_term, ' +
      'nearest_metro_m, nearest_metro_name, nearest_hospital_m, nearest_mall_m, ' +
      'distance_to_cbd_km, distance_to_airport_km, ' +
      'income_bracket, noise_level, is_expat_friendly, ' +
      'banner_url, lat, lng, data_quality, ' +
      'developer_id, developers(name, slug, logo_url)'
    )
    .eq('slug', slug)
    .eq('published', true)
    .single()

  if (error) {
    console.error('[fetchProject] supabase error:', JSON.stringify(error))
    return null
  }
  if (!data) {
    console.error('[fetchProject] no data for slug:', slug)
    return null
  }
  return data as Record<string, any>
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params
  const project = await fetchProject(slug)
  if (!project) return { title: 'Dự án không tồn tại' }

  const typeLabel = PROPERTY_TYPE_LABEL[project.property_type] ?? project.property_type
  const desc = project.description_short ?? `${typeLabel} tại ${project.province}`

  return {
    title: `${project.name_official} | ${typeLabel} ${project.district ?? ''} ${project.province}`,
    description: desc,
    openGraph: {
      title: project.name_official,
      description: desc,
      images: project.banner_url ? [project.banner_url] : [],
    },
  }
}

export default async function ProjectPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params
  const project = await fetchProject(slug)
  if (!project) notFound()

  const p = project as any
  const dev = Array.isArray(p.developers) ? p.developers[0] : p.developers
  const typeLabel = PROPERTY_TYPE_LABEL[p.property_type] ?? p.property_type
  const tierLabel = p.tier ? TIER_LABEL[p.tier] : null
  const statusLabel = p.status ? STATUS_LABEL[p.status] : null

  const amenities = [
    { key: 'has_pool', label: 'Hồ bơi' },
    { key: 'has_gym', label: 'Phòng gym' },
    { key: 'has_tennis_court', label: 'Sân tennis' },
    { key: 'has_basketball_court', label: 'Sân bóng rổ' },
    { key: 'has_kindergarten', label: 'Mầm non nội khu' },
    { key: 'has_school_international', label: 'Trường quốc tế' },
    { key: 'has_mall_internal', label: 'TTTM nội khu' },
    { key: 'has_supermarket_internal', label: 'Siêu thị nội khu' },
    { key: 'has_bbq_area', label: 'Khu BBQ' },
    { key: 'has_clubhouse', label: 'Clubhouse' },
    { key: 'has_smart_home', label: 'Smart home' },
    { key: 'has_ev_charging', label: 'Sạc xe điện' },
    { key: 'has_24h_security', label: 'Bảo vệ 24/7' },
  ].filter(a => p[a.key] === true)

  const faq: Array<{ q: string; a: string; category: string }> = Array.isArray(p.ai_faq) ? p.ai_faq : []
  const pros: string[] = p.ai_pros_cons?.pros ?? []
  const cons: string[] = p.ai_pros_cons?.cons ?? []

  const breadcrumbs = [
    { label: 'Trang chủ', href: '/' },
    { label: p.province, href: `/du-an?tinh=${encodeURIComponent(p.province)}` },
    ...(p.district ? [{ label: p.district, href: `/du-an?tinh=${encodeURIComponent(p.province)}&quan=${encodeURIComponent(p.district)}` }] : []),
    { label: p.name_official, href: projectPath(p.province, p.district, p.slug) },
  ]

  return (
    <main className="min-h-screen bg-[#F5F7FA]">
      {/* Breadcrumb */}
      <div className="bg-white border-b border-[#E2E8F0] px-4 py-2">
        <div className="max-w-5xl mx-auto flex items-center gap-1.5 text-xs text-[#64748B] overflow-x-auto whitespace-nowrap">
          {breadcrumbs.map((b, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span>/</span>}
              {i === breadcrumbs.length - 1 ? (
                <span className="text-[#0D1B3D] font-medium">{b.label}</span>
              ) : (
                <Link href={b.href} className="hover:text-[#1565FF] transition-colors">{b.label}</Link>
              )}
            </span>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Hero */}
        <section className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[#E2E8F0]">
          {p.banner_url && (
            <div className="h-56 md:h-72 overflow-hidden">
              <img src={p.banner_url} alt={p.name_official} className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-5 md:p-6">
            <div className="flex flex-wrap gap-2 mb-3">
              <span className="text-xs bg-[#EFF6FF] text-[#1565FF] px-2.5 py-1 rounded-full font-medium">{typeLabel}</span>
              {tierLabel && <span className="text-xs bg-[#F8FAFC] text-[#64748B] px-2.5 py-1 rounded-full">{tierLabel}</span>}
              {statusLabel && <span className="text-xs bg-[#F0FDF4] text-[#16A34A] px-2.5 py-1 rounded-full">{statusLabel}</span>}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-[#0D1B3D] mb-1">{p.name_official}</h1>
            <p className="text-[#64748B] text-sm mb-4">
              {[p.address_full, p.district, p.province].filter(Boolean).join(', ')}
            </p>
            {p.description_short && (
              <p className="text-[#334155] leading-relaxed">{p.description_short}</p>
            )}
          </div>
        </section>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">

            {/* AI Overview */}
            {p.ai_overview && (
              <section className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2E8F0]">
                <h2 className="font-semibold text-[#0D1B3D] mb-3">Tổng quan</h2>
                <p className="text-[#334155] leading-relaxed text-sm">{p.ai_overview}</p>
              </section>
            )}

            {/* Description long */}
            {p.description_long && (
              <section className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2E8F0]">
                <h2 className="font-semibold text-[#0D1B3D] mb-3">Giới thiệu chi tiết</h2>
                <div className="text-[#334155] leading-relaxed text-sm whitespace-pre-line">{p.description_long}</div>
              </section>
            )}

            {/* Pros/Cons */}
            {(pros.length > 0 || cons.length > 0) && (
              <section className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2E8F0]">
                <h2 className="font-semibold text-[#0D1B3D] mb-4">Ưu & nhược điểm</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                  {pros.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-[#16A34A] uppercase tracking-wide mb-2">Ưu điểm</div>
                      <ul className="space-y-2">
                        {pros.map((pro, i) => (
                          <li key={i} className="flex gap-2 text-sm text-[#334155]">
                            <span className="text-[#16A34A] shrink-0 mt-0.5">✓</span>
                            {pro}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {cons.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold text-[#DC2626] uppercase tracking-wide mb-2">Nhược điểm</div>
                      <ul className="space-y-2">
                        {cons.map((con, i) => (
                          <li key={i} className="flex gap-2 text-sm text-[#334155]">
                            <span className="text-[#DC2626] shrink-0 mt-0.5">✗</span>
                            {con}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Amenities */}
            {amenities.length > 0 && (
              <section className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2E8F0]">
                <h2 className="font-semibold text-[#0D1B3D] mb-4">Tiện ích nội khu</h2>
                <div className="flex flex-wrap gap-2">
                  {amenities.map(a => (
                    <span key={a.key} className="text-sm bg-[#F0FDF4] text-[#16A34A] px-3 py-1.5 rounded-full border border-[#BBF7D0]">
                      {a.label}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* FAQ */}
            {faq.length > 0 && (
              <section className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2E8F0]">
                <h2 className="font-semibold text-[#0D1B3D] mb-4">Câu hỏi thường gặp</h2>
                <div className="space-y-4">
                  {faq.map((item, i) => (
                    <div key={i} className="border-b border-[#F1F5F9] pb-4 last:border-0 last:pb-0">
                      <div className="font-medium text-[#0D1B3D] text-sm mb-1">{item.q}</div>
                      <div className="text-[#64748B] text-sm">{item.a}</div>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* Sidebar */}
          <div className="space-y-5">

            {/* Key Stats */}
            <section className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2E8F0]">
              <h2 className="font-semibold text-[#0D1B3D] mb-4 text-sm">Thông tin dự án</h2>
              <dl className="space-y-3 text-sm">
                {p.year_handover && (
                  <Row label="Bàn giao" value={`${p.year_handover}`} />
                )}
                {p.year_start && (
                  <Row label="Khởi công" value={`${p.year_start}`} />
                )}
                {p.total_towers && (
                  <Row label="Số tòa" value={`${p.total_towers} tòa`} />
                )}
                {p.total_units && (
                  <Row label="Số căn" value={`${p.total_units.toLocaleString('vi-VN')} căn`} />
                )}
                {p.total_land_ha && (
                  <Row label="Diện tích" value={`${p.total_land_ha} ha`} />
                )}
                {dev && (
                  <Row label="Chủ đầu tư" value={dev.name} />
                )}
              </dl>
            </section>

            {/* Sale Price */}
            {(p.price_primary_per_m2_min || p.price_secondary_per_m2_avg) && (
              <section className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2E8F0]">
                <h2 className="font-semibold text-[#0D1B3D] mb-4 text-sm">Giá bán</h2>
                <dl className="space-y-3 text-sm">
                  {p.price_primary_per_m2_min && p.price_primary_per_m2_max && (
                    <Row
                      label="Giá sơ cấp"
                      value={`${Math.round(p.price_primary_per_m2_min / 1e6)}–${Math.round(p.price_primary_per_m2_max / 1e6)} tr/m²`}
                      highlight
                    />
                  )}
                  {p.price_primary_per_m2_min && !p.price_primary_per_m2_max && (
                    <Row label="Giá từ" value={`${Math.round(p.price_primary_per_m2_min / 1e6)} tr/m²`} highlight />
                  )}
                  {p.price_secondary_per_m2_avg && (
                    <Row label="Giá thứ cấp" value={`${Math.round(p.price_secondary_per_m2_avg / 1e6)} tr/m²`} />
                  )}
                  {p.price_trend_pct_6m && (
                    <Row
                      label="Tăng trưởng 6T"
                      value={`${p.price_trend_pct_6m > 0 ? '+' : ''}${p.price_trend_pct_6m}%`}
                    />
                  )}
                </dl>
              </section>
            )}

            {/* Rental */}
            {(p.rent_2br_avg_monthly_vnd || p.rent_1br_avg_monthly_vnd) && (
              <section className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2E8F0]">
                <h2 className="font-semibold text-[#0D1B3D] mb-4 text-sm">Giá thuê (dài hạn)</h2>
                <dl className="space-y-3 text-sm">
                  {p.rent_1br_avg_monthly_vnd && (
                    <Row label="1 phòng ngủ" value={`${Math.round(p.rent_1br_avg_monthly_vnd / 1e6)} tr/tháng`} />
                  )}
                  {p.rent_2br_avg_monthly_vnd && (
                    <Row label="2 phòng ngủ" value={`${Math.round(p.rent_2br_avg_monthly_vnd / 1e6)} tr/tháng`} highlight />
                  )}
                  {p.rent_3br_avg_monthly_vnd && (
                    <Row label="3 phòng ngủ" value={`${Math.round(p.rent_3br_avg_monthly_vnd / 1e6)} tr/tháng`} />
                  )}
                  {p.rental_yield_pct && (
                    <Row label="Yield" value={`${p.rental_yield_pct}%/năm`} />
                  )}
                  {p.rent_demand_score && (
                    <Row label="Nhu cầu thuê" value={`${p.rent_demand_score}/10`} />
                  )}
                </dl>
              </section>
            )}

            {/* Legal */}
            {(p.ownership_term || p.red_book_status) && (
              <section className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2E8F0]">
                <h2 className="font-semibold text-[#0D1B3D] mb-4 text-sm">Pháp lý</h2>
                <dl className="space-y-3 text-sm">
                  {p.ownership_term && (
                    <Row label="Sở hữu" value={OWNERSHIP_LABEL[p.ownership_term] ?? p.ownership_term} />
                  )}
                  {p.red_book_status === 'da_cap' && <Row label="Sổ hồng" value="Đã cấp" />}
                  {p.red_book_status === 'chua_cap' && <Row label="Sổ hồng" value="Chưa cấp" />}
                  {p.red_book_status === 'dang_lam' && <Row label="Sổ hồng" value="Đang làm" />}
                </dl>
              </section>
            )}

            {/* Fees */}
            {(p.service_fee_per_m2_vnd || p.parking_car_monthly) && (
              <section className="bg-white rounded-2xl p-5 shadow-sm border border-[#E2E8F0]">
                <h2 className="font-semibold text-[#0D1B3D] mb-4 text-sm">Phí dịch vụ</h2>
                <dl className="space-y-3 text-sm">
                  {p.service_fee_per_m2_vnd && (
                    <Row label="Phí quản lý" value={`${p.service_fee_per_m2_vnd.toLocaleString('vi-VN')} đ/m²/tháng`} />
                  )}
                  {p.parking_car_monthly && (
                    <Row label="Đỗ xe ô tô" value={`${Math.round(p.parking_car_monthly / 1000)}k/tháng`} />
                  )}
                  {p.parking_motorbike_monthly && (
                    <Row label="Đỗ xe máy" value={`${Math.round(p.parking_motorbike_monthly / 1000)}k/tháng`} />
                  )}
                </dl>
              </section>
            )}

            {/* CTA */}
            <section className="bg-[#1565FF] rounded-2xl p-5 text-white">
              <p className="font-semibold mb-1">Quan tâm dự án này?</p>
              <p className="text-sm text-white/80 mb-4">Kết nối với môi giới chuyên dự án này.</p>
              <button className="w-full bg-white text-[#1565FF] font-semibold rounded-xl py-2.5 text-sm hover:bg-blue-50 transition-colors">
                Liên hệ môi giới
              </button>
            </section>

          </div>
        </div>
      </div>
    </main>
  )
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-[#94A3B8] shrink-0">{label}</dt>
      <dd className={`text-right font-medium ${highlight ? 'text-[#1565FF]' : 'text-[#0D1B3D]'}`}>{value}</dd>
    </div>
  )
}
