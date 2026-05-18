// Nguồn dữ liệu duy nhất cho property_type — import vào mọi chỗ cần
export const PROPERTY_TYPES = [
  // ── Nhà ở ──────────────────────────────────────────────
  { value: 'chung_cu',       label: 'Chung cư' },
  { value: 'biet_thu',       label: 'Biệt thự' },
  { value: 'lien_ke',        label: 'Liền kề' },
  { value: 'shophouse',      label: 'Shophouse' },
  { value: 'dat_nen',        label: 'Đất nền' },
  { value: 'nha_o_xa_hoi',   label: 'Nhà ở xã hội' },
  // ── Mixed-use ──────────────────────────────────────────
  { value: 'officetel',      label: 'Officetel' },
  { value: 'condotel',       label: 'Condotel' },
  { value: 'khu_nghi_duong', label: 'Khu nghỉ dưỡng' },
  // ── Thương mại / Văn phòng ─────────────────────────────
  { value: 'van_phong',      label: 'Văn phòng' },
  // ── Công nghiệp ────────────────────────────────────────
  { value: 'nha_xuong_cn',   label: 'Nhà xưởng CN' },
  { value: 'khu_cong_nghiep', label: 'Khu công nghiệp' },
  // ── Đất ───────────────────────────────────────────────
  { value: 'dat_nong_nghiep', label: 'Đất nông nghiệp' },
  { value: 'dat_rung',        label: 'Đất rừng' },
] as const

export type PropertyTypeValue = typeof PROPERTY_TYPES[number]['value']

// Lookup label nhanh
export const PROPERTY_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  PROPERTY_TYPES.map(t => [t.value, t.label])
)
