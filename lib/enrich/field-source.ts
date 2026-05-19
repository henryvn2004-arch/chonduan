// Helpers cho field-level provenance.
//
// `projects.field_sources` JSONB được Gemini enrich cron ghi vào, format:
//   {
//     "<column_name>": { "source": "gemini_grounded" | "gemini_estimated" | "proxy_median_peers",
//                        "confidence": 0..1,
//                        "ts": "ISO timestamp" },
//     "__grounding": { "source": "url1 | url2 | ...", "confidence": 1, "ts": "..." }
//   }
//
// UI dùng các helper này để render badge "Ước tính" khi field không phải fact grounded.

export type FieldSourceKind =
  | 'gemini_grounded'    // fact từ Google Search grounding
  | 'gemini_estimated'   // Gemini infer/suy đoán, không ground
  | 'proxy_median_peers' // fallback từ median của dự án cùng khu vực
  | 'admin_verified'     // admin verify manual (future)
  | 'developer'          // chủ đầu tư confirm (future)
  | string               // forward-compat

export interface FieldSourceEntry {
  source: FieldSourceKind
  confidence: number
  ts: string
}

export type FieldSources = Record<string, FieldSourceEntry>

/** Lấy entry cho 1 field. Trả null nếu không có. */
export function getFieldSource(
  fieldSources: FieldSources | null | undefined,
  field: string,
): FieldSourceEntry | null {
  if (!fieldSources) return null
  const v = fieldSources[field]
  if (!v || typeof v !== 'object') return null
  return v as FieldSourceEntry
}

/** True nếu field là ước tính (không phải fact grounded). */
export function isEstimated(
  fieldSources: FieldSources | null | undefined,
  field: string,
): boolean {
  const src = getFieldSource(fieldSources, field)?.source
  return src === 'gemini_estimated' || src === 'proxy_median_peers'
}

/** Trả về kind đơn giản cho UI rendering. */
export type EstimateKind = 'grounded' | 'estimated' | 'proxy' | 'unknown'

export function getEstimateKind(
  fieldSources: FieldSources | null | undefined,
  field: string,
): EstimateKind {
  const src = getFieldSource(fieldSources, field)?.source
  if (src === 'gemini_grounded' || src === 'admin_verified' || src === 'developer') return 'grounded'
  if (src === 'gemini_estimated') return 'estimated'
  if (src === 'proxy_median_peers') return 'proxy'
  return 'unknown'
}

/** Tooltip text tiếng Việt cho từng kind. */
export function explainEstimateKind(kind: EstimateKind): string {
  switch (kind) {
    case 'grounded':
      return 'Dữ liệu xác minh từ nguồn công khai'
    case 'estimated':
      return 'AI ước tính từ thông tin gián tiếp, chưa xác minh trực tiếp'
    case 'proxy':
      return 'Ước tính từ giá trung bình các dự án tương đồng cùng khu vực'
    case 'unknown':
      return ''
  }
}
