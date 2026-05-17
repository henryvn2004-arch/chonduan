import type { ProjectDetail } from '@/types/project'
import { TrainFront, Cross, Globe, School, Building2, ShoppingCart, Building, PlaneTakeoff } from 'lucide-react'

function fmtDist(m: number | null): string {
  if (!m) return '—'
  if (m >= 1000) return `${(m / 1000).toFixed(1)} km`
  return `${m} m`
}

const ITEMS: { key: keyof ProjectDetail; label: string; Icon: React.ElementType }[] = [
  { key: 'nearest_metro_m', label: 'Metro gần nhất', Icon: TrainFront },
  { key: 'nearest_hospital_m', label: 'Bệnh viện', Icon: Cross },
  { key: 'nearest_international_school_m', label: 'Trường QT', Icon: Globe },
  { key: 'nearest_public_school_m', label: 'Trường công', Icon: School },
  { key: 'nearest_mall_m', label: 'Trung tâm TM', Icon: Building2 },
  { key: 'nearest_supermarket_m', label: 'Siêu thị', Icon: ShoppingCart },
  { key: 'distance_to_cbd_km', label: 'Trung tâm TP', Icon: Building },
  { key: 'distance_to_airport_km', label: 'Sân bay', Icon: PlaneTakeoff },
]

export default function SurroundingSection({ project }: { project: ProjectDetail }) {
  const hasData = ITEMS.some((i) => project[i.key] != null)

  return (
    <section id="quy-hoach" className="scroll-mt-28">
      <h2 className="text-xl font-bold text-[#0D1B3D] mb-4">Quy hoạch & Vị trí</h2>

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        {hasData ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {ITEMS.map((item) => {
              const raw = project[item.key] as number | null
              const key = item.key as string
              const isKm = key.includes('_km')
              const display = isKm
                ? (raw ? `${raw} km` : '—')
                : fmtDist(raw)

              return (
                <div key={String(item.key)} className="text-center p-4 bg-[#F8FAFC] rounded-xl">
                  <div className="flex justify-center mb-2">
                    <item.Icon className="w-6 h-6 text-[#1565FF]" strokeWidth={1.75} />
                  </div>
                  <div className="text-base font-bold text-[#0D1B3D]">{display}</div>
                  <div className="text-xs text-[#64748B] mt-0.5">{item.label}</div>
                  {item.key === 'nearest_metro_m' && project.nearest_metro_name && (
                    <div className="text-xs text-[#1565FF] mt-0.5 truncate">{project.nearest_metro_name}</div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-[#94A3B8] text-center py-4">Chưa có dữ liệu vị trí xung quanh.</p>
        )}
      </div>

      {/* Parking info */}
      {(project.parking_motorbike_monthly || project.parking_car_monthly) && (
        <div className="mt-3 flex gap-3">
          {project.parking_motorbike_monthly && (
            <div className="flex-1 p-3 bg-white rounded-xl border border-[#E2E8F0] text-sm">
              <span className="text-[#64748B]">Xe máy: </span>
              <span className="font-semibold">{(project.parking_motorbike_monthly / 1000).toFixed(0)}k/tháng</span>
            </div>
          )}
          {project.parking_car_monthly && (
            <div className="flex-1 p-3 bg-white rounded-xl border border-[#E2E8F0] text-sm">
              <span className="text-[#64748B]">Ô tô: </span>
              <span className="font-semibold">{(project.parking_car_monthly / 1000).toFixed(0)}k/tháng</span>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
