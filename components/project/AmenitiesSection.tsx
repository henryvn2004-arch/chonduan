import type { ProjectDetail } from '@/types/project'
import {
  Waves, Dumbbell, Circle, Flame, Sparkles, Thermometer,
  Laptop, Leaf, Building, ShoppingCart, UtensilsCrossed,
  Coffee, Cross, Baby, Building2, Zap, Home, BellRing,
} from 'lucide-react'

const AMENITIES: { key: keyof ProjectDetail; label: string; Icon: React.ElementType }[] = [
  { key: 'has_pool', label: 'Hồ bơi', Icon: Waves },
  { key: 'has_gym', label: 'Gym', Icon: Dumbbell },
  { key: 'has_tennis_court', label: 'Tennis', Icon: Circle },
  { key: 'has_basketball_court', label: 'Bóng rổ', Icon: Circle },
  { key: 'has_kids_playground', label: 'Sân trẻ em', Icon: Baby },
  { key: 'has_bbq_area', label: 'BBQ', Icon: Flame },
  { key: 'has_spa', label: 'Spa', Icon: Sparkles },
  { key: 'has_sauna', label: 'Sauna', Icon: Thermometer },
  { key: 'has_coworking', label: 'Co-working', Icon: Laptop },
  { key: 'has_sky_garden', label: 'Sky Garden', Icon: Leaf },
  { key: 'has_rooftop', label: 'Rooftop', Icon: Building },
  { key: 'has_supermarket', label: 'Siêu thị', Icon: ShoppingCart },
  { key: 'has_restaurant', label: 'Nhà hàng', Icon: UtensilsCrossed },
  { key: 'has_cafe', label: 'Cafe', Icon: Coffee },
  { key: 'has_clinic', label: 'Phòng khám', Icon: Cross },
  { key: 'has_kindergarten', label: 'Trường mầm non', Icon: Baby },
  { key: 'has_shopping_mall', label: 'Trung tâm TM', Icon: Building2 },
  { key: 'has_ev_charging', label: 'Sạc xe điện', Icon: Zap },
  { key: 'has_smart_home', label: 'Smart Home', Icon: Home },
  { key: 'has_concierge', label: 'Concierge 24/7', Icon: BellRing },
]

export default function AmenitiesSection({ project }: { project: ProjectDetail }) {
  const available = AMENITIES.filter((a) => project[a.key] === true)
  const unavailable = AMENITIES.filter((a) => project[a.key] === false)

  if (available.length === 0 && unavailable.length === 0) {
    return (
      <section id="tien-ich" className="scroll-mt-28">
        <h2 className="text-xl font-bold text-[#0D1B3D] mb-4">Tiện ích nội khu</h2>
        <div className="text-sm text-[#94A3B8] bg-white rounded-xl border border-[#E2E8F0] p-6 text-center">
          Chưa có thông tin tiện ích.
        </div>
      </section>
    )
  }

  return (
    <section id="tien-ich" className="scroll-mt-28">
      <h2 className="text-xl font-bold text-[#0D1B3D] mb-4">Tiện ích nội khu</h2>

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        {available.length > 0 && (
          <>
            <div className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-3">
              Có ({available.length})
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
              {available.map((a) => (
                <div key={a.key} className="flex flex-col items-center gap-1.5 p-3 bg-[#F0F6FF] rounded-xl">
                  <a.Icon className="w-5 h-5 text-[#1565FF]" strokeWidth={1.75} />
                  <span className="text-xs text-[#0D1B3D] text-center font-medium leading-tight">{a.label}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {unavailable.length > 0 && (
          <>
            <div className="text-xs font-medium text-[#64748B] uppercase tracking-wide mb-3">
              Không có ({unavailable.length})
            </div>
            <div className="flex flex-wrap gap-2">
              {unavailable.map((a) => (
                <span key={a.key} className="inline-flex items-center gap-1 text-xs text-[#94A3B8] px-2.5 py-1.5 bg-[#F8FAFC] rounded-lg">
                  <a.Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {a.label}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
