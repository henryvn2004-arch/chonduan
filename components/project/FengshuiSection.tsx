'use client'

import { useState } from 'react'
import type { ProjectDetail } from '@/types/project'

const CAN = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý']
const CHI = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi']

function getCanChi(year: number): string {
  const can = CAN[(year - 4 + 400) % 10]
  const chi = CHI[(year - 4 + 480) % 12]
  return `${can} ${chi}`
}

const DIRECTION_LABEL: Record<string, string> = {
  bac: 'Bắc', nam: 'Nam', dong: 'Đông', tay: 'Tây',
  dong_bac: 'Đông Bắc', dong_nam: 'Đông Nam',
  tay_bac: 'Tây Bắc', tay_nam: 'Tây Nam',
}

export default function FengshuiSection({ project }: { project: ProjectDetail }) {
  const [birthYear, setBirthYear] = useState('')
  const [result, setResult] = useState<null | 'hop' | 'khong_hop' | 'trung_tinh'>(null)
  const [userCanChi, setUserCanChi] = useState('')

  function check() {
    const year = parseInt(birthYear)
    if (!year || year < 1920 || year > 2010) return
    const cc = getCanChi(year)
    setUserCanChi(cc)

    const compatible = project.compatible_can_chi ?? []
    const incompatible = project.incompatible_can_chi ?? []

    if (compatible.some((c) => c.toLowerCase().includes(cc.toLowerCase()) || cc.toLowerCase().includes(c.toLowerCase()))) {
      setResult('hop')
    } else if (incompatible.some((c) => c.toLowerCase().includes(cc.toLowerCase()) || cc.toLowerCase().includes(c.toLowerCase()))) {
      setResult('khong_hop')
    } else {
      setResult('trung_tinh')
    }
  }

  const hasData = project.main_direction || (project.compatible_can_chi?.length ?? 0) > 0

  return (
    <section id="phong-thuy" className="scroll-mt-28">
      <h2 className="text-xl font-bold text-[#0D1B3D] mb-4">Phong thủy</h2>

      <div className="bg-white rounded-xl border border-[#E2E8F0] p-5 space-y-4">
        {/* Direction */}
        {project.main_direction && (
          <div className="flex items-center gap-3 p-3 bg-[#F8FAFC] rounded-xl">
            <span className="text-2xl">🧭</span>
            <div>
              <div className="text-xs text-[#64748B]">Hướng chính tòa nhà</div>
              <div className="font-semibold text-[#0D1B3D]">
                {DIRECTION_LABEL[project.main_direction] ?? project.main_direction}
              </div>
            </div>
          </div>
        )}

        {/* Compatible can chi */}
        {(project.compatible_can_chi?.length ?? 0) > 0 && (
          <div>
            <div className="text-xs font-medium text-green-700 mb-2">✓ Can chi hợp</div>
            <div className="flex flex-wrap gap-2">
              {project.compatible_can_chi!.map((cc) => (
                <span key={cc} className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-lg">
                  {cc}
                </span>
              ))}
            </div>
          </div>
        )}

        {(project.incompatible_can_chi?.length ?? 0) > 0 && (
          <div>
            <div className="text-xs font-medium text-red-600 mb-2">✗ Can chi không hợp</div>
            <div className="flex flex-wrap gap-2">
              {project.incompatible_can_chi!.map((cc) => (
                <span key={cc} className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-1 rounded-lg">
                  {cc}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Fengshui notes */}
        {project.fengshui_notes && (
          <p className="text-sm text-[#475569] leading-relaxed border-t border-[#F1F5F9] pt-3">
            {project.fengshui_notes}
          </p>
        )}

        {/* Input năm sinh */}
        <div className="border-t border-[#F1F5F9] pt-4">
          <div className="text-sm font-medium text-[#0D1B3D] mb-3">Kiểm tra năm sinh của bạn</div>
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Ví dụ: 1990"
              value={birthYear}
              onChange={(e) => { setBirthYear(e.target.value); setResult(null) }}
              min={1920}
              max={2010}
              className="flex-1 border border-[#E2E8F0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565FF]/30 focus:border-[#1565FF]"
            />
            <button
              onClick={check}
              className="px-4 py-2 bg-[#1565FF] text-white text-sm font-medium rounded-lg hover:bg-[#0D4FCC] transition-colors"
            >
              Kiểm tra
            </button>
          </div>

          {result && (
            <div className={`mt-3 p-3 rounded-xl text-sm font-medium ${
              result === 'hop' ? 'bg-green-50 text-green-700' :
              result === 'khong_hop' ? 'bg-red-50 text-red-600' :
              'bg-gray-50 text-gray-600'
            }`}>
              {result === 'hop' && `✅ Tuổi ${userCanChi} hợp phong thủy với dự án này`}
              {result === 'khong_hop' && `⚠️ Tuổi ${userCanChi} không hợp phong thủy với dự án này`}
              {result === 'trung_tinh' && `ℹ️ Tuổi ${userCanChi} — Trung tính, không có thông tin cụ thể cho dự án này`}
            </div>
          )}
        </div>

        {!hasData && !project.fengshui_notes && (
          <p className="text-sm text-[#94A3B8] text-center py-2">Chưa có dữ liệu phong thủy cho dự án này.</p>
        )}
      </div>
    </section>
  )
}
