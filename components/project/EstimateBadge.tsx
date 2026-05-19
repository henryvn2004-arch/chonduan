// Badge hiển thị "Ước tính" cho field được AI suy đoán hoặc proxy fallback.
// Dùng kèm số liệu giá / năm bàn giao / amenity v.v.
//
// Usage:
//   <span className="inline-flex items-center gap-1">
//     {fmtPrice(value)}
//     <EstimateBadge kind={kind} field="price_primary_per_m2_min" />
//   </span>
//
// CSS-only tooltip (group-hover) — không phụ thuộc Radix/Headless. Khi mobile
// (no hover), user có thể tap vào icon để open tooltip native title attribute.

import { Info } from 'lucide-react'
import { explainEstimateKind, type EstimateKind } from '@/lib/enrich/field-source'

interface Props {
  /** Kind từ helper getEstimateKind(field_sources, field). */
  kind: EstimateKind
  /** Optional: field name để debug + accessible label. */
  field?: string
  /** Hide entirely cho field 'grounded' (mặc định ẩn cả 'unknown'). */
  hideWhen?: EstimateKind[]
  /** Custom label thay vì "Ước tính". */
  label?: string
}

const KIND_STYLES: Record<EstimateKind, string> = {
  grounded:  'bg-green-50 text-green-700 border-green-200',
  estimated: 'bg-amber-50 text-amber-800 border-amber-200',
  proxy:     'bg-orange-50 text-orange-800 border-orange-200',
  unknown:   'hidden',
}

const KIND_LABEL: Record<EstimateKind, string> = {
  grounded:  'Đã xác minh',
  estimated: 'Ước tính',
  proxy:     'Ước tính',
  unknown:   '',
}

export default function EstimateBadge({
  kind,
  field,
  hideWhen = ['grounded', 'unknown'],
  label,
}: Props) {
  if (hideWhen.includes(kind)) return null
  const tooltip = explainEstimateKind(kind)
  const text = label ?? KIND_LABEL[kind]

  return (
    <span
      className={`group/badge relative inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border text-[10px] font-medium leading-none whitespace-nowrap ${KIND_STYLES[kind]}`}
      title={tooltip}
      aria-label={field ? `${text}: ${tooltip} (${field})` : `${text}: ${tooltip}`}
    >
      <Info className="w-2.5 h-2.5" strokeWidth={2.5} aria-hidden="true" />
      <span>{text}</span>
      {/* CSS hover tooltip — desktop. Mobile dùng native title attr. */}
      <span
        role="tooltip"
        className="pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 z-10 hidden group-hover/badge:block w-56 p-2 rounded-lg bg-[#0D1B3D] text-white text-xs font-normal leading-snug shadow-lg"
      >
        {tooltip}
      </span>
    </span>
  )
}
