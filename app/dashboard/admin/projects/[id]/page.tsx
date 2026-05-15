import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import ProjectEditForm from './ProjectEditForm'

export default async function AdminProjectEditPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: project, error } = await supabase
    .from('projects')
    .select(`
      id, name_official, slug, province,
      land_origin_type, red_book_status, ownership_term,
      construction_permit_no, investment_approval_no,
      legal_issues_text, legal_score, legal_last_verified,
      flood_risk_level, tide_risk_level, air_pollution_score,
      noise_level, drama_history,
      upcoming_infrastructure, investment_score, outlook_text,
      logo_url, banner_url, gallery_urls, video_tour_url,
      floor_plan_url, master_plan_url,
      main_direction, compatible_can_chi, incompatible_can_chi, fengshui_notes,
      data_quality, published
    `)
    .eq('id', id)
    .single()

  if (error || !project) notFound()

  return (
    <div className="min-h-screen bg-[#F5F7FA]">
      <header className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-4">
        <Link href="/dashboard/admin" className="text-[#8A94A6] hover:text-[#0D1B3D] text-sm">
          ← Danh sách
        </Link>
        <div>
          <h1 className="text-xl font-bold text-[#0D1B3D]">{project.name_official}</h1>
          <p className="text-xs text-[#8A94A6]">{project.province} · {project.slug}</p>
        </div>
      </header>

      <div className="p-6 max-w-4xl mx-auto">
        <ProjectEditForm project={project} />
      </div>
    </div>
  )
}
