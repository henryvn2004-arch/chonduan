import type { ProjectDetail } from '@/types/project'

const RISK_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  thap: { label: 'Thấp', color: 'text-green-600', bg: 'bg-green-50' },
  trung_binh: { label: 'Trung bình', color: 'text-yellow-600', bg: 'bg-yellow-50' },
  cao: { label: 'Cao', color: 'text-red-600', bg: 'bg-red-50' },
}

function RiskRow({ label, value, icon }: { label: string; value: string | null; icon: string }) {
  if (!value) return null
  const cfg = RISK_CONFIG[value] ?? { label: value, color: 'text-gray-600', bg: 'bg-gray-50' }
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#F1F5F9] last:border-0">
      <div className="flex items-center gap-2 text-sm text-[#0D1B3D]">
        <span>{icon}</span> {label}
      </div>
      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.color}`}>
        {cfg.label}
      </span>
    </div>
  )
}

export default function RiskSection({ project }: { project: ProjectDetail }) {
  const hasPollution = project.air_pollution_score != null
  const hasAnyRisk =
    project.flood_risk_level ||
    project.tide_risk_level ||
    project.noise_level ||
    hasPollution

  return (
    <section id="rui-ro" className="scroll-mt-28">
      <h2 className="text-xl font-bold text-[#0D1B3D] mb-4">Chỉ số rủi ro</h2>

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        {hasAnyRisk ? (
          <>
            <RiskRow label="Nguy cơ ngập lụt" value={project.flood_risk_level} icon="🌊" />
            <RiskRow label="Nguy cơ triều cường" value={project.tide_risk_level} icon="🌊" />
            <RiskRow label="Tiếng ồn" value={project.noise_level} icon="🔊" />
            {hasPollution && (
              <div className="flex items-center justify-between py-3">
                <div className="flex items-center gap-2 text-sm text-[#0D1B3D]">
                  <span>💨</span> Ô nhiễm không khí
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-green-400 via-yellow-400 to-red-500"
                      style={{ width: `${Math.min((project.air_pollution_score! / 10) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-[#0D1B3D] w-8 text-right">
                    {project.air_pollution_score}/10
                  </span>
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-[#94A3B8] text-center py-4">Chưa có dữ liệu rủi ro.</p>
        )}
      </div>
    </section>
  )
}
