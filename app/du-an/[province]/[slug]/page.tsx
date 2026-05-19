import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ProjectDetail } from '@/types/project'
import ProjectHero from '@/components/project/ProjectHero'
import StickyTabs from '@/components/project/StickyTabs'
import OverviewSection from '@/components/project/OverviewSection'
import PriceSection from '@/components/project/PriceSection'
import LegalSection from '@/components/project/LegalSection'
import AmenitiesSection from '@/components/project/AmenitiesSection'
import SurroundingSection from '@/components/project/SurroundingSection'
import RiskSection from '@/components/project/RiskSection'
import OutlookSection from '@/components/project/OutlookSection'
import NewsSection from '@/components/project/NewsSection'
import FAQSection from '@/components/project/FAQSection'
import AgentsSection from '@/components/project/AgentsSection'
import SimilarSection from '@/components/project/SimilarSection'
import Link from 'next/link'
import Image from 'next/image'

interface Props {
  params: Promise<{ province: string; slug: string }>
  searchParams: Promise<{ mode?: string }>
}

async function fetchProject(province: string, slug: string): Promise<ProjectDetail | null> {
  const supabase = await createClient()

  // NOTE: select only columns that actually exist in the DB schema.
  // DB amenity columns differ from the ProjectDetail type — see remap block below.
  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      id, slug, name_official, name_aliases, province, district, ward, address_full, lat, lng,
      developer_id,
      property_type, tier, status, year_start, year_handover,
      total_land_ha, building_density_pct, total_towers, total_units,
      description_short, description_long,
      price_primary_per_m2_min, price_primary_per_m2_max, price_secondary_per_m2_avg,
      price_trend, price_trend_pct_6m, rental_yield_pct,
      rent_studio_avg_monthly_vnd, rent_1br_avg_monthly_vnd, rent_2br_avg_monthly_vnd,
      rent_3br_avg_monthly_vnd, rent_4br_plus_avg_monthly_vnd,
      rent_furnished_premium_pct, rent_demand_score, rent_trend,
      rent_avg_lease_term_months, short_term_avg_per_night_vnd, short_term_occupancy_pct,
      is_expat_friendly, expat_concentration_score,
      land_origin_type, red_book_status, ownership_term,
      construction_permit_no, investment_approval_no, legal_issues_text, legal_score, legal_last_verified,
      has_pool, has_gym, has_tennis_court, has_basketball_court,
      has_kid_playground, has_bbq_area, has_kindergarten,
      has_mall_internal, has_supermarket_internal, has_cafe_restaurant,
      has_clubhouse, has_library, has_park_garden,
      has_24h_security, has_ev_charging, has_smart_home,
      nearest_metro_m, nearest_metro_name, nearest_public_school_m, nearest_international_school_m,
      nearest_hospital_m, nearest_mall_m, nearest_supermarket_m, distance_to_cbd_km, distance_to_airport_km,
      service_fee_per_m2_vnd, parking_motorbike_monthly, parking_car_monthly,
      flood_risk_level, tide_risk_level, air_pollution_score, noise_level,
      investment_score, outlook_text,
      logo_url, banner_url, gallery_urls, video_tour_url,
      gmaps_photo_url, gmaps_photo_attribution,
      main_direction, compatible_can_chi, incompatible_can_chi, fengshui_notes,
      review_count, review_avg_rating, review_pros_summary, review_cons_summary,
      ai_faq, ai_overview, ai_pros_cons, ai_audio_url,
      data_quality, field_sources,
      developers ( id, slug, name, short_name, logo_url, website, founded_year, ranking_tier )
    `)
    .eq('slug', slug)
    .single()

  if (error || !project) return null

  const [{ data: priceHistory }, { data: rentalHistory }] = await Promise.all([
    supabase
      .from('project_prices_history')
      .select('date, price_per_m2_avg, price_per_m2_min, price_per_m2_max, listing_count')
      .eq('project_id', project.id)
      .order('date', { ascending: true })
      .limit(24),
    supabase
      .from('project_rental_history')
      .select('date, rent_studio_avg, rent_1br_avg, rent_2br_avg, rent_3br_avg, rent_per_m2_avg, listings_count, short_term_avg_per_night')
      .eq('project_id', project.id)
      .order('date', { ascending: true })
      .limit(12),
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const raw = project as any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dev = raw.developers

  // Remap DB column names → ProjectDetail type names (kept for backward compat with components)
  return {
    ...(project as unknown as ProjectDetail),
    developer: dev ?? null,
    price_history: priceHistory ?? [],
    rental_history: rentalHistory ?? [],
    // amenity remaps
    has_kids_playground:  raw.has_kid_playground    ?? null,
    has_supermarket:      raw.has_supermarket_internal ?? null,
    has_restaurant:       raw.has_cafe_restaurant   ?? null,
    has_cafe:             raw.has_cafe_restaurant   ?? null,
    has_shopping_mall:    raw.has_mall_internal     ?? null,
    // columns not in DB → null (AmenitiesSection handles null gracefully)
    has_spa:      null,
    has_sauna:    null,
    has_coworking: null,
    has_sky_garden: null,
    has_rooftop:  null,
    has_clinic:   null,
    has_concierge: null,
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { province, slug } = await params
  const project = await fetchProject(province, slug)
  if (!project) return { title: 'Dự án không tồn tại' }

  const title = `${project.name_official} | PhaplyDuan`
  const description = project.description_short ?? `Dự án ${project.name_official} tại ${project.province}.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: project.banner_url ? [project.banner_url] : [],
    },
  }
}

export default async function ProjectHubPage({ params, searchParams }: Props) {
  const { province, slug } = await params
  const { mode } = await searchParams
  const initialMode = mode === 'rent_long' ? 'rent_long' : 'sale'

  const project = await fetchProject(province, slug)
  if (!project) notFound()

  const schemaOrg = {
    '@context': 'https://schema.org',
    '@type': 'RealEstateListing',
    name: project.name_official,
    description: project.description_short ?? undefined,
    url: `https://phaplyduan.vn/du-an/${encodeURIComponent(province)}/${slug}`,
    image: project.banner_url ?? project.logo_url ?? undefined,
    address: {
      '@type': 'PostalAddress',
      addressLocality: project.district ?? project.province,
      addressRegion: project.province,
      addressCountry: 'VN',
    },
    ...(project.price_primary_per_m2_min && {
      offers: {
        '@type': 'Offer',
        priceCurrency: 'VND',
        price: project.price_primary_per_m2_min,
      },
    }),
    ...(project.developer && {
      seller: {
        '@type': 'Organization',
        name: project.developer.name,
        url: project.developer.website ?? undefined,
      },
    }),
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0D1B3D]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }}
      />
      {/* Minimal nav */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-[#E2E8F0] h-14 flex items-center px-4 gap-3">
        <Link href="/" className="shrink-0">
          <Image src="/logo.png" alt="PhaplyDuan" width={120} height={34} className="h-8 w-auto hidden sm:block" priority />
          <Image src="/favicon.png" alt="PhaplyDuan" width={32} height={32} className="h-8 w-auto sm:hidden" priority />
        </Link>
        <nav className="text-sm text-[#64748B] flex items-center gap-1 ml-2">
          <Link href="/" className="hover:text-[#1565FF]">Trang chủ</Link>
          <span>/</span>
          <span className="text-[#0D1B3D] font-medium truncate max-w-[200px]">{project.name_official}</span>
        </nav>
      </header>

      <main className="pt-14">
        <ProjectHero project={project} />
        <StickyTabs />

        <div className="max-w-5xl mx-auto px-4 py-6 space-y-10">
          <OverviewSection project={project} />
          <PriceSection project={project} initialMode={initialMode as 'sale' | 'rent_long'} />
          <LegalSection project={project} />
          <AmenitiesSection project={project} />
          <SurroundingSection project={project} />
          <RiskSection project={project} />
          <OutlookSection project={project} />
          <NewsSection projectId={project.id} projectName={project.name_official} province={project.province} />
          <FAQSection project={project} />
          <AgentsSection projectId={project.id} projectName={project.name_official} province={project.province} />
          <SimilarSection province={project.province} currentId={project.id} lat={project.lat} lng={project.lng} />
        </div>
      </main>
    </div>
  )
}
