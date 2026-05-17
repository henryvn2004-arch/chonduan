import type { ProjectDetail } from '@/types/project'
import { ThumbsUp, AlertTriangle } from 'lucide-react'

function ScoreBar({ score, max = 10 }: { score: number; max?: number }) {
  const pct = (score / max) * 100
  const color = pct >= 70 ? 'from-green-400 to-green-600' : pct >= 40 ? 'from-yellow-400 to-yellow-600' : 'from-red-400 to-red-600'
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-3 bg-[#F1F5F9] rounded-full overflow-hidden">
        <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xl font-bold text-[#0D1B3D] w-12 text-right">{score}/{max}</span>
    </div>
  )
}

export default function OutlookSection({ project }: { project: ProjectDetail }) {
  return (
    <section id="trien-vong" className="scroll-mt-28">
      <h2 className="text-xl font-bold text-[#0D1B3D] mb-4">Triển vọng đầu tư</h2>

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-4">
        {project.investment_score != null && (
          <div>
            <div className="text-sm font-medium text-[#0D1B3D] mb-2">Điểm đầu tư</div>
            <ScoreBar score={project.investment_score} />
          </div>
        )}

        {project.outlook_text && (
          <p className="text-sm text-[#475569] leading-relaxed border-t border-[#F1F5F9] pt-4">
            {project.outlook_text}
          </p>
        )}

        {/* AI pros/cons */}
        {project.ai_pros_cons && (
          <div className="grid sm:grid-cols-2 gap-4 border-t border-[#F1F5F9] pt-4">
            <div>
              <div className="flex items-center gap-1 text-xs font-medium text-green-700 mb-2"><ThumbsUp className="w-3.5 h-3.5" strokeWidth={2} /> Điểm cộng</div>
              <ul className="space-y-1.5">
                {project.ai_pros_cons.pros.map((p, i) => (
                  <li key={i} className="text-sm text-[#475569] flex gap-2">
                    <span className="text-green-500 shrink-0">+</span>{p}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-1 text-xs font-medium text-red-600 mb-2"><AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} /> Điểm trừ</div>
              <ul className="space-y-1.5">
                {project.ai_pros_cons.cons.map((c, i) => (
                  <li key={i} className="text-sm text-[#475569] flex gap-2">
                    <span className="text-red-400 shrink-0">−</span>{c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {project.investment_score == null && !project.outlook_text && !project.ai_pros_cons && (
          <p className="text-sm text-[#94A3B8] text-center py-4">Chưa có dữ liệu triển vọng.</p>
        )}
      </div>
    </section>
  )
}
