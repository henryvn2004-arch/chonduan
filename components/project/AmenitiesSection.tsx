import type { ProjectDetail } from '@/types/project'

const AMENITIES: { key: keyof ProjectDetail; label: string; icon: string }[] = [
  { key: 'has_pool', label: 'Hồ bơi', icon: '🏊' },
  { key: 'has_gym', label: 'Gym', icon: '💪' },
  { key: 'has_tennis_court', label: 'Tennis', icon: '🎾' },
  { key: 'has_basketball_court', label: 'Bóng rổ', icon: '🏀' },
  { key: 'has_kids_playground', label: 'Sân trẻ em', icon: '🛝' },
  { key: 'has_bbq_area', label: 'BBQ', icon: '🔥' },
  { key: 'has_spa', label: 'Spa', icon: '💆' },
  { key: 'has_sauna', label: 'Sauna', icon: '🧖' },
  { key: 'has_coworking', label: 'Co-working', icon: '💻' },
  { key: 'has_sky_garden', label: 'Sky Garden', icon: '🌿' },
  { key: 'has_rooftop', label: 'Rooftop', icon: '🏙️' },
  { key: 'has_supermarket', label: 'Siêu thị', icon: '🛒' },
  { key: 'has_restaurant', label: 'Nhà hàng', icon: '🍽️' },
  { key: 'has_cafe', label: 'Cafe', icon: '☕' },
  { key: 'has_clinic', label: 'Phòng khám', icon: '🏥' },
  { key: 'has_kindergarten', label: 'Trường mầm non', icon: '👶' },
  { key: 'has_shopping_mall', label: 'Trung tâm TM', icon: '🏬' },
  { key: 'has_ev_charging', label: 'Sạc xe điện', icon: '⚡' },
  { key: 'has_smart_home', label: 'Smart Home', icon: '🏠' },
  { key: 'has_concierge', label: 'Concierge 24/7', icon: '🛎️' },
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
                <div key={a.key} className="flex flex-col items-center gap-1 p-3 bg-[#F0F6FF] rounded-xl">
                  <span className="text-2xl">{a.icon}</span>
                  <span className="text-xs text-[#0D1B3D] text-center font-medium">{a.label}</span>
                </div>
              ))}
            </div>
          </>
        )}

        {unavailable.length > 0 && (
          <>
            <div className="text-xs font-medium text-[#94A3B8] uppercase tracking-wide mb-3">
              Không có
            </div>
            <div className="flex flex-wrap gap-2">
              {unavailable.map((a) => (
                <span key={a.key} className="text-xs text-[#94A3B8] bg-[#F8FAFC] px-2 py-1 rounded-lg">
                  {a.icon} {a.label}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  )
}
