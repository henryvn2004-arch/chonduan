import Image from 'next/image'
import type { ProjectDetail } from '@/types/project'

const TIER_LABEL: Record<string, string> = {
  binh_dan: 'Bình dân',
  trung_cap: 'Trung cấp',
  cao_cap: 'Cao cấp',
  hang_sang: 'Hạng sang',
}
const STATUS_LABEL: Record<string, string> = {
  sap_mo_ban: 'Sắp mở bán',
  dang_mo_ban: 'Đang mở bán',
  dang_xay: 'Đang xây',
  da_ban_giao: 'Đã bàn giao',
  da_ban_giao_lau: 'Đã bàn giao lâu',
}
const STATUS_COLOR: Record<string, string> = {
  sap_mo_ban: 'bg-blue-100 text-blue-700',
  dang_mo_ban: 'bg-green-100 text-green-700',
  dang_xay: 'bg-yellow-100 text-yellow-700',
  da_ban_giao: 'bg-gray-100 text-gray-600',
  da_ban_giao_lau: 'bg-gray-100 text-gray-500',
}

export default function ProjectHero({ project }: { project: ProjectDetail }) {
  const hasBanner = !!project.banner_url
  const gallery = project.gallery_urls ?? []

  return (
    <div className="relative bg-[#0D1B3D]">
      {/* Banner */}
      <div className="relative h-64 sm:h-80 overflow-hidden">
        {hasBanner ? (
          <Image
            src={project.banner_url!}
            alt={project.name_official}
            fill
            className="object-cover opacity-70"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1565FF]/30 to-[#0D1B3D]" />
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D1B3D] via-transparent to-transparent" />

        {/* Thumbnail strip */}
        {gallery.length > 0 && (
          <div className="absolute bottom-3 right-3 flex gap-1.5">
            {gallery.slice(0, 4).map((url, i) => (
              <div key={i} className="w-14 h-10 rounded overflow-hidden border border-white/20">
                <Image src={url} alt="" fill className="object-cover" />
              </div>
            ))}
            {gallery.length > 4 && (
              <div className="w-14 h-10 rounded bg-black/50 border border-white/20 flex items-center justify-center text-white text-xs font-medium">
                +{gallery.length - 4}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Info bar */}
      <div className="px-4 py-4 max-w-5xl mx-auto">
        <div className="flex flex-wrap gap-2 mb-2">
          {project.status && (
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLOR[project.status] ?? 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABEL[project.status] ?? project.status}
            </span>
          )}
          {project.tier && (
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-[#1565FF]/20 text-[#3D8BFF]">
              {TIER_LABEL[project.tier] ?? project.tier}
            </span>
          )}
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/10 text-white/70">
            {project.property_type}
          </span>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white leading-tight">
          {project.name_official}
        </h1>

        <p className="text-sm text-white/60 mt-1">
          {[project.ward, project.district, project.province].filter(Boolean).join(', ')}
        </p>

        {project.description_short && (
          <p className="text-sm text-white/70 mt-3 max-w-2xl leading-relaxed">
            {project.description_short}
          </p>
        )}
      </div>
    </div>
  )
}
