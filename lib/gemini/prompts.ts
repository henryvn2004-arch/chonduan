import type { ProjectClaim } from './types'

/**
 * Build the enrichment prompt for a batch of projects.
 * Returns a single string. Gemini is asked to use Google Search grounding,
 * but to clearly distinguish FACT (grounded) from ESTIMATE (inferred).
 *
 * Important contract:
 * - If the model cannot find the project at all, return found=false, no fabricated data.
 * - Fields the model could not ground but inferred from comparable projects/area
 *   MUST appear in `estimates: string[]` and confidence_level should be 'low' or 'estimated'.
 * - All prices are in VND integers (not millions).
 * - amenities is a closed enum list.
 */
export function buildEnrichPrompt(claims: ProjectClaim[]): string {
  const projectsBlock = claims
    .map((p, i) => {
      const loc = [p.ward, p.district, p.province].filter(Boolean).join(', ')
      const latN = p.lat == null ? null : Number(p.lat)
      const lngN = p.lng == null ? null : Number(p.lng)
      const coord =
        latN != null && lngN != null && !Number.isNaN(latN) && !Number.isNaN(lngN)
          ? `(${latN.toFixed(5)}, ${lngN.toFixed(5)})`
          : ''
      return `[${i + 1}] id="${p.id}" name="${p.name_official ?? '(unknown)'}" loc="${loc}" coord="${coord}" type="${p.property_type ?? ''}" tier="${p.tier ?? ''}"`
    })
    .join('\n')

  return `Bạn là chuyên gia data bất động sản dự án Việt Nam. Nhiệm vụ: tìm thông tin thực tế cho ${claims.length} dự án dưới đây từ Google Search, sau đó trả về JSON đúng schema.

DANH SÁCH DỰ ÁN:
${projectsBlock}

YÊU CẦU TÌM KIẾM:
1. Dùng Google Search để xác minh từng dự án.
2. Ưu tiên nguồn: trang chủ chủ đầu tư, cafef.vn, batdongsan.com.vn, vnexpress, dantri, tuoitre, các báo BĐS uy tín.
3. KHÔNG bịa đặt. Nếu không chắc một field, hãy bỏ trống hoặc liệt vào "estimates".
4. Nếu hoàn toàn không tìm thấy dự án trên web → "found": false, "data": {}.

QUY TẮC ĐỂ "estimates":
- Khi không có fact rõ ràng nhưng có thể suy đoán hợp lý từ vị trí/tier/dự án tương đồng → cho giá trị nhưng PHẢI thêm tên field vào mảng "estimates".
- Ví dụ: không tìm được giá Vinhomes X cụ thể, nhưng biết khu vực Q.7 + tier "high-end" thường 60-90tr/m² → ghi range, mark estimates.

OUTPUT SCHEMA (trả về JSON đúng theo cấu trúc này, không thêm markdown fence):
{
  "projects": [
    {
      "id": "<uuid khớp với input>",
      "found": true | false,
      "confidence_level": "high" | "medium" | "low" | "estimated",
      "data": {
        "description_short": "1 câu 80-150 ký tự, không sáo rỗng",
        "description_long": "3-5 câu, 400-800 ký tự, mô tả vị trí + tiện ích nổi bật + đối tượng phù hợp",
        "developer": "Tên chủ đầu tư chính",
        "year_start": 2018,
        "year_handover": 2022,
        "total_towers": 5,
        "total_units": 2400,
        "total_land_ha": 12.5,
        "building_density_pct": 35,
        "green_density_pct": 55,
        "status": "sap_mo_ban" | "dang_mo_ban" | "dang_xay" | "da_ban_giao" | "da_ban_giao_lau" | "unknown",
        "legal_status": "free text mô tả pháp lý (vd: 'Đã có sổ đỏ, pháp lý đầy đủ')",
        "ownership_term": "lau_dai" | "nam_50" | "nam_70" | "khac",
        "red_book_status": "da_cap" | "chua_cap" | "dang_lam" | "vuong_mac",
        "amenities": ["pool","gym","kindergarten","park_garden","24h_security"],
        "price_primary_per_m2_min": 45000000,
        "price_primary_per_m2_max": 65000000,
        "price_secondary_per_m2_avg": 55000000,
        "rent_2br_avg_monthly_vnd": 18000000,
        "rent_per_m2_avg": 250000,
        "distance_to_cbd_km": 8.5,
        "nearest_metro_name": "Tuyến số 1 - Bến Thành",
        "nearest_metro_m": 600,
        "address_full": "Số X đường Y, P. Z, Q. W, TP..."
      },
      "estimates": ["price_primary_per_m2_min","price_primary_per_m2_max"],
      "sources": ["https://...","https://..."],
      "not_found_reason": null
    }
  ]
}

AMENITIES CLOSED LIST (chỉ dùng các giá trị này, không tự nghĩ):
pool, gym, tennis_court, basketball_court, kid_playground, kindergarten, school_primary, school_secondary, school_international, mall_internal, supermarket_internal, cafe_restaurant, bbq_area, clubhouse, library, park_garden, 24h_security, smart_home, ev_charging

STATUS ENUM VALUES (chỉ dùng đúng các giá trị này — DB enum):
- sap_mo_ban     = sắp mở bán (chưa launch)
- dang_mo_ban    = đang mở bán (đang bán primary)
- dang_xay       = đang xây dựng (đã launch, chưa bàn giao)
- da_ban_giao    = đã bàn giao (handover xong, dưới 5 năm)
- da_ban_giao_lau = đã bàn giao lâu (handover > 5 năm)
- unknown        = không xác định

OWNERSHIP_TERM ENUM VALUES:
- lau_dai  = sở hữu lâu dài (sổ đỏ vĩnh viễn)
- nam_50   = 50 năm
- nam_70   = 70 năm
- khac     = khác (timeshare, lease, ...)

RED_BOOK_STATUS ENUM VALUES (sổ đỏ):
- da_cap     = đã cấp sổ
- chua_cap   = chưa cấp
- dang_lam   = đang làm/đang chờ
- vuong_mac  = đang vướng pháp lý

ĐƠN VỊ:
- Giá: VND (integer, KHÔNG triệu). Ví dụ 45tr/m² = 45000000.
- Diện tích đất: hecta (ha), số thực.
- Khoảng cách CBD: km, số thực.
- Khoảng cách metro: mét, integer.

QUAN TRỌNG:
- LUÔN giữ "id" giống hệt input.
- Trả về EXACTLY ${claims.length} item trong "projects".
- Không wrap markdown fence, không comment, chỉ JSON.`
}

/** Map amenity enum → projects table boolean column name. */
export const AMENITY_TO_COLUMN: Record<string, string> = {
  pool: 'has_pool',
  gym: 'has_gym',
  tennis_court: 'has_tennis_court',
  basketball_court: 'has_basketball_court',
  kid_playground: 'has_kid_playground',
  kindergarten: 'has_kindergarten',
  school_primary: 'has_school_primary',
  school_secondary: 'has_school_secondary',
  school_international: 'has_school_international',
  mall_internal: 'has_mall_internal',
  supermarket_internal: 'has_supermarket_internal',
  cafe_restaurant: 'has_cafe_restaurant',
  bbq_area: 'has_bbq_area',
  clubhouse: 'has_clubhouse',
  library: 'has_library',
  park_garden: 'has_park_garden',
  '24h_security': 'has_24h_security',
  smart_home: 'has_smart_home',
  ev_charging: 'has_ev_charging',
}
