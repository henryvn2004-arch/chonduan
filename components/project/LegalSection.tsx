import type { ProjectDetail } from '@/types/project'

const RED_BOOK: Record<string, { label: string; color: string }> = {
  da_co: { label: 'Đã có sổ đỏ', color: 'text-green-600 bg-green-50' },
  dang_cho: { label: 'Đang chờ cấp', color: 'text-yellow-600 bg-yellow-50' },
  chua_ro: { label: 'Chưa rõ', color: 'text-gray-500 bg-gray-50' },
  co_van_de: { label: 'Có vấn đề', color: 'text-red-600 bg-red-50' },
}

function ScoreDots({ score, max = 10 }: { score: number; max?: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-2 h-2 rounded-full ${i < score ? 'bg-[#1565FF]' : 'bg-[#E2E8F0]'}`}
        />
      ))}
      <span className="text-sm font-bold text-[#0D1B3D] ml-2">{score}/{max}</span>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-3 py-2.5 border-b border-[#F1F5F9] last:border-0">
      <span className="text-[#64748B] text-sm w-40 shrink-0">{label}</span>
      <span className="text-sm text-[#0D1B3D] font-medium flex-1">{value}</span>
    </div>
  )
}

export default function LegalSection({ project }: { project: ProjectDetail }) {
  const rb = project.red_book_status ? RED_BOOK[project.red_book_status] : null

  return (
    <section id="phap-ly" className="scroll-mt-28">
      <h2 className="text-xl font-bold text-[#0D1B3D] mb-4">Pháp lý</h2>

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5">
        {/* Legal score */}
        {project.legal_score != null && (
          <div className="flex items-center justify-between mb-4 pb-4 border-b border-[#F1F5F9]">
            <div>
              <div className="text-sm font-medium text-[#0D1B3D] mb-2">Điểm pháp lý tổng hợp</div>
              <ScoreDots score={project.legal_score} />
            </div>
            {rb && (
              <span className={`text-sm font-medium px-3 py-1.5 rounded-full ${rb.color}`}>
                {rb.label}
              </span>
            )}
          </div>
        )}

        <Row label="Nguồn gốc đất" value={project.land_origin_type} />
        <Row label="Thời hạn sở hữu" value={project.ownership_term} />
        <Row label="Số GPXD" value={project.construction_permit_no} />
        <Row label="Số QĐ chủ trương" value={project.investment_approval_no} />
        {project.legal_last_verified && (
          <Row label="Xác minh lần cuối" value={new Date(project.legal_last_verified).toLocaleDateString('vi-VN')} />
        )}

        {project.legal_issues_text && (
          <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
            <div className="text-sm font-medium text-red-700 mb-1">Lưu ý pháp lý</div>
            <p className="text-sm text-red-600">{project.legal_issues_text}</p>
          </div>
        )}

        {!project.legal_score && !project.red_book_status && !project.land_origin_type && (
          <p className="text-sm text-[#94A3B8] text-center py-4">Chưa có thông tin pháp lý.</p>
        )}
      </div>
    </section>
  )
}
