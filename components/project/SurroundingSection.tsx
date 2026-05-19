import type { ProjectDetail } from '@/types/project'
import { TrainFront, Cross, Globe, School, Building2, ShoppingCart, Building, PlaneTakeoff, MapPin, ExternalLink } from 'lucide-react'

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
  const hasCoords = project.lat != null && project.lng != null
  const mapQuery = hasCoords
    ? `${project.lat},${project.lng}`
    : encodeURIComponent(`${project.name_official} ${project.district ?? ''} ${project.province}`.trim())
  const mapsEmbedUrl = `https://maps.google.com/maps?q=${mapQuery}&z=15&hl=vi&output=embed`
  const mapsOpenUrl = hasCoords
    ? `https://www.google.com/maps/search/?api=1&query=${project.lat},${project.lng}`
    : `https://www.google.com/maps/search/?api=1&query=${mapQuery}`

  return (
    <section id="quy-hoach" className="scroll-mt-28">
      <h2 className="text-xl font-bold text-[#0D1B3D] mb-4">Quy hoạch & Vị trí</h2>

      {/* Google Maps embed */}
      <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden mb-3">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2 text-sm text-[#0D1B3D] min-w-0">
            <MapPin className="w-4 h-4 text-[#1565FF] shrink-0" strokeWidth={2} />
            <span className="truncate font-medium">
              {project.address_full ?? `${project.district ?? ''} ${project.province}`.trim()}
            </span>
          </div>
          <a
            href={mapsOpenUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 inline-flex items-center gap-1 text-xs font-medium text-[#1565FF] hover:underline"
          >
            Mở Google Maps <ExternalLink className="w-3 h-3" strokeWidth={2.25} />
          </a>
        </div>
        <iframe
          src={mapsEmbedUrl}
          title={`Bản đồ ${project.name_official}`}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          className="w-full h-[320px] sm:h-[400px] border-0 block"
          allowFullScreen
        />
      </div>

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
