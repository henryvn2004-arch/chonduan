'use client'

import { useState } from 'react'
import { Home, Key } from 'lucide-react'
import type { ProjectDetail } from '@/types/project'
import SparkLine from './SparkLine'
import EstimateBadge from './EstimateBadge'
import { getEstimateKind } from '@/lib/enrich/field-source'

function fmt(n: number | null, suffix = '') {
  if (!n) return '—'
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)} tỷ${suffix}`
  if (n >= 1_000) return `${Math.round(n / 1000)}k${suffix}`
  return `${n}${suffix}`
}
function fmtM2(n: number | null) {
  if (!n) return '—'
  return `${(n / 1_000_000).toFixed(0)} tr/m²`
}
function fmtMonth(n: number | null) {
  if (!n) return '—'
  return `${(n / 1_000_000).toFixed(1)} tr/tháng`
}

const TREND_ICON: Record<string, string> = { tang: '↑', giam: '↓', on_dinh: '→' }
const TREND_COLOR: Record<string, string> = { tang: 'text-green-600', giam: 'text-red-500', on_dinh: 'text-gray-500' }

interface Props {
  project: ProjectDetail
  initialMode: 'sale' | 'rent_long'
}

export default function PriceSection({ project, initialMode }: Props) {
  const [mode, setMode] = useState<'sale' | 'rent_long'>(initialMode)

  const salePriceHistory = project.price_history.map((h) => h.price_per_m2_avg)
  const rentHistory = project.rental_history.map((h) => h.rent_2br_avg ?? h.rent_1br_avg ?? 0).filter(Boolean)

  // Provenance per price/rent field — render badge if not grounded fact.
  const fs = project.field_sources
  const kind = {
    price_primary_per_m2_min:    getEstimateKind(fs, 'price_primary_per_m2_min'),
    price_primary_per_m2_max:    getEstimateKind(fs, 'price_primary_per_m2_max'),
    price_secondary_per_m2_avg:  getEstimateKind(fs, 'price_secondary_per_m2_avg'),
    rent_studio_avg_monthly_vnd: getEstimateKind(fs, 'rent_studio_avg_monthly_vnd'),
    rent_1br_avg_monthly_vnd:    getEstimateKind(fs, 'rent_1br_avg_monthly_vnd'),
    rent_2br_avg_monthly_vnd:    getEstimateKind(fs, 'rent_2br_avg_monthly_vnd'),
    rent_3br_avg_monthly_vnd:    getEstimateKind(fs, 'rent_3br_avg_monthly_vnd'),
    rent_4br_plus_avg_monthly_vnd: getEstimateKind(fs, 'rent_4br_plus_avg_monthly_vnd'),
  } as const

  return (
    <section id="gia" className="scroll-mt-28">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-[#0D1B3D]">Giá</h2>
        {/* Toggle */}
        <div className="flex rounded-full border border-[#E2E8F0] bg-white p-0.5 gap-0.5 text-sm">
          <button
            onClick={() => setMode('sale')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${mode === 'sale' ? 'bg-[#1565FF] text-white shadow-sm' : 'text-[#64748B] hover:bg-[#F8FAFC]'}`}
          >
            <Home className="w-3.5 h-3.5" strokeWidth={2} />
            Mua/Bán
          </button>
          <button
            onClick={() => setMode('rent_long')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-medium transition-all ${mode === 'rent_long' ? 'bg-[#1565FF] text-white shadow-sm' : 'text-[#64748B] hover:bg-[#F8FAFC]'}`}
          >
            <Key className="w-3.5 h-3.5" strokeWidth={2} />
            Cho thuê
          </button>
        </div>
      </div>

      {mode === 'sale' ? (
        <div className="space-y-4">
          {/* Price cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white rounded-xl border border-[#E2E8F0]">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs text-[#64748B]">Sơ cấp từ</span>
                <EstimateBadge kind={kind.price_primary_per_m2_min} field="price_primary_per_m2_min" />
              </div>
              <div className="text-xl font-bold text-[#0D1B3D]">{fmtM2(project.price_primary_per_m2_min)}</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-[#E2E8F0]">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs text-[#64748B]">Sơ cấp đến</span>
                <EstimateBadge kind={kind.price_primary_per_m2_max} field="price_primary_per_m2_max" />
              </div>
              <div className="text-xl font-bold text-[#0D1B3D]">{fmtM2(project.price_primary_per_m2_max)}</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-[#E2E8F0]">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="text-xs text-[#64748B]">Thứ cấp TB</span>
                <EstimateBadge kind={kind.price_secondary_per_m2_avg} field="price_secondary_per_m2_avg" />
              </div>
              <div className="text-xl font-bold text-[#0D1B3D]">{fmtM2(project.price_secondary_per_m2_avg)}</div>
              {project.price_trend && (
                <div className={`text-xs font-medium mt-1 ${TREND_COLOR[project.price_trend]}`}>
                  {TREND_ICON[project.price_trend]}
                  {project.price_trend_pct_6m ? ` ${Math.abs(project.price_trend_pct_6m)}% / 6 tháng` : ' Xu hướng'}
                </div>
              )}
            </div>
          </div>

          {/* Chart */}
          {salePriceHistory.length >= 2 && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
              <div className="text-sm font-medium text-[#0D1B3D] mb-3">Lịch sử giá 24 tháng (tr/m²)</div>
              <div className="h-24">
                <SparkLine values={salePriceHistory.map(v => v / 1_000_000)} />
              </div>
              <div className="flex justify-between text-xs text-[#64748B] mt-1">
                <span>{project.price_history[0]?.date?.slice(0, 7)}</span>
                <span>{project.price_history[project.price_history.length - 1]?.date?.slice(0, 7)}</span>
              </div>
            </div>
          )}

          {project.rental_yield_pct && (
            <div className="flex items-center gap-2 text-sm text-[#64748B] bg-green-50 px-4 py-3 rounded-xl">
              <span className="text-green-600 font-bold">{project.rental_yield_pct}%</span>
              <span>lợi suất cho thuê ước tính / năm</span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bedroom breakdown */}
          <div className="bg-white rounded-xl border border-[#E2E8F0] overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#F8FAFC]">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-[#64748B]">Loại</th>
                  <th className="text-right px-4 py-3 font-medium text-[#64748B]">Giá TB / tháng</th>
                </tr>
              </thead>
              <tbody>
                {([
                  ['Studio',       'rent_studio_avg_monthly_vnd',    project.rent_studio_avg_monthly_vnd],
                  ['1 phòng ngủ',  'rent_1br_avg_monthly_vnd',       project.rent_1br_avg_monthly_vnd],
                  ['2 phòng ngủ',  'rent_2br_avg_monthly_vnd',       project.rent_2br_avg_monthly_vnd],
                  ['3 phòng ngủ',  'rent_3br_avg_monthly_vnd',       project.rent_3br_avg_monthly_vnd],
                  ['4 PN+',        'rent_4br_plus_avg_monthly_vnd',  project.rent_4br_plus_avg_monthly_vnd],
                ] as const).map(([label, fieldKey, val]) => (val ? (
                  <tr key={fieldKey} className="border-t border-[#F1F5F9]">
                    <td className="px-4 py-3 text-[#0D1B3D]">
                      <span className="inline-flex items-center gap-1.5">
                        {label}
                        <EstimateBadge kind={kind[fieldKey as keyof typeof kind]} field={fieldKey} />
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-[#0D1B3D]">{fmtMonth(val)}</td>
                  </tr>
                ) : null))}
              </tbody>
            </table>
          </div>

          {/* Demand score */}
          {project.rent_demand_score != null && (
            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-[#E2E8F0]">
              <div className="text-sm text-[#64748B]">Chỉ số nhu cầu thuê</div>
              <div className="flex-1 h-2 bg-[#F1F5F9] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#1565FF] to-[#3D8BFF]"
                  style={{ width: `${Math.min(project.rent_demand_score * 10, 100)}%` }}
                />
              </div>
              <div className="text-sm font-bold text-[#1565FF] w-8 text-right">{project.rent_demand_score}/10</div>
            </div>
          )}

          {/* Rent history chart */}
          {rentHistory.length >= 2 && (
            <div className="bg-white rounded-xl border border-[#E2E8F0] p-4">
              <div className="text-sm font-medium text-[#0D1B3D] mb-3">Lịch sử thuê 12 tháng (tr/tháng)</div>
              <div className="h-24">
                <SparkLine values={rentHistory.map(v => v / 1_000_000)} color="#0D4FCC" />
              </div>
              <div className="flex justify-between text-xs text-[#64748B] mt-1">
                <span>{project.rental_history[0]?.date?.slice(0, 7)}</span>
                <span>{project.rental_history[project.rental_history.length - 1]?.date?.slice(0, 7)}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-sm">
            {project.rent_avg_lease_term_months && (
              <div className="p-3 bg-[#F8FAFC] rounded-xl">
                <div className="text-[#64748B] text-xs mb-1">Thời hạn TB</div>
                <div className="font-semibold">{project.rent_avg_lease_term_months} tháng</div>
              </div>
            )}
            {project.rent_furnished_premium_pct && (
              <div className="p-3 bg-[#F8FAFC] rounded-xl">
                <div className="text-[#64748B] text-xs mb-1">Premium full nội thất</div>
                <div className="font-semibold">+{project.rent_furnished_premium_pct}%</div>
              </div>
            )}
            {project.is_expat_friendly && (
              <div className="p-3 bg-[#F8FAFC] rounded-xl col-span-2">
                <span className="text-green-600 font-medium">✓ Thân thiện người nước ngoài</span>
                {project.expat_concentration_score && (
                  <span className="text-[#64748B] ml-2">({project.expat_concentration_score}/10 Expat score)</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  )
}
