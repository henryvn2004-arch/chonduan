import Image from 'next/image'
import type { ProjectDetail } from '@/types/project'
import EstimateBadge from './EstimateBadge'
import { getEstimateKind, type EstimateKind } from '@/lib/enrich/field-source'

function Stat({
  label,
  value,
  estimateKind = 'unknown',
  field,
}: {
  label: string
  value: string | null
  estimateKind?: EstimateKind
  field?: string
}) {
  return (
    <div className="text-center p-4 bg-[#F8FAFC] rounded-xl">
      <div className="text-lg font-bold text-[#0D1B3D]">{value ?? '—'}</div>
      <div className="flex items-center justify-center gap-1.5 mt-0.5">
        <span className="text-xs text-[#64748B]">{label}</span>
        {value !== null && <EstimateBadge kind={estimateKind} field={field} />}
      </div>
    </div>
  )
}

export default function OverviewSection({ project }: { project: ProjectDetail }) {
  const dev = project.developer
  const fs = project.field_sources

  return (
    <section id="tong-quan" className="scroll-mt-28">
      <h2 className="text-xl font-bold text-[#0D1B3D] mb-4">Tổng quan dự án</h2>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <Stat label="Năm khởi công" value={project.year_start?.toString() ?? null}
              estimateKind={getEstimateKind(fs, 'year_start')} field="year_start" />
        <Stat label="Năm bàn giao" value={project.year_handover?.toString() ?? null}
              estimateKind={getEstimateKind(fs, 'year_handover')} field="year_handover" />
        <Stat label="Số tháp" value={project.total_towers?.toString() ?? null}
              estimateKind={getEstimateKind(fs, 'total_towers')} field="total_towers" />
        <Stat label="Tổng căn hộ" value={project.total_units ? project.total_units.toLocaleString('vi-VN') : null}
              estimateKind={getEstimateKind(fs, 'total_units')} field="total_units" />
        <Stat label="Diện tích đất" value={project.total_land_ha ? `${project.total_land_ha} ha` : null}
              estimateKind={getEstimateKind(fs, 'total_land_ha')} field="total_land_ha" />
        <Stat label="Mật độ XD" value={project.building_density_pct ? `${project.building_density_pct}%` : null}
              estimateKind={getEstimateKind(fs, 'building_density_pct')} field="building_density_pct" />
        <Stat label="Hướng chính" value={project.main_direction} />
        <Stat label="Phí quản lý" value={project.service_fee_per_m2_vnd ? `${(project.service_fee_per_m2_vnd / 1000).toFixed(0)}k/m²` : null} />
      </div>

      {/* Developer */}
      {dev && (
        <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#E2E8F0]">
          {dev.logo_url ? (
            <div className="relative w-14 h-14 shrink-0">
              <Image src={dev.logo_url} alt={dev.name} fill className="object-contain rounded-lg" />
            </div>
          ) : (
            <div className="w-14 h-14 shrink-0 rounded-lg bg-[#F1F5F9] flex items-center justify-center text-xl font-bold text-[#1565FF]">
              {dev.name[0]}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-xs text-[#64748B] mb-0.5">Chủ đầu tư</div>
            <div className="font-semibold text-[#0D1B3D]">{dev.name}</div>
            {dev.founded_year && (
              <div className="text-xs text-[#64748B] mt-0.5">Thành lập {dev.founded_year}</div>
            )}
          </div>
          {dev.website && (
            <a
              href={dev.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-[#1565FF] hover:underline shrink-0"
            >
              Website →
            </a>
          )}
        </div>
      )}

      {/* Long description */}
      {project.description_long && (
        <div className="mt-4 prose prose-sm max-w-none text-[#475569] leading-relaxed">
          <p>{project.description_long}</p>
        </div>
      )}
    </section>
  )
}
