-- ============================================================
-- Migration: cleanup non-VN projects + expand enrichment priority tiers
-- Applied: 2026-05-19 via Supabase MCP apply_migration
-- ============================================================

-- 1. Xoá dự án nước ngoài (Thái Lan, Cambodia bị lọt từ OSM scraper)
-- Match Thai script range U+0E00–U+0E7F + Khmer U+1780–U+17F9 + tên thủ đô
DELETE FROM projects
WHERE province ~ '[฀-๿]'         -- Thai script
   OR province ~ '[ក-៹]'          -- Khmer script
   OR province IN (
     'Phnom Penh', 'Vientiane', 'Bangkok', 'Khon Kaen',
     'พระนครศรีอยุธยา', 'Siem Reap'
   );

-- 2. Tier priority cho Gemini enrichment cron (FOR UPDATE SKIP LOCKED claim
--    order by enrichment_priority DESC).
--    Tier reflects thị trường BĐS VN — top cities first.
UPDATE projects SET enrichment_priority = CASE
  -- Tier 10: top 2 đại đô thị
  WHEN province IN ('Hà Nội', 'TP. Hồ Chí Minh') THEN 10
  -- Tier 9: Đà Nẵng (đô thị TW + du lịch hot)
  WHEN province = 'Đà Nẵng' THEN 9
  -- Tier 8: đô thị trực thuộc TW khác
  WHEN province IN ('Hải Phòng', 'Cần Thơ') THEN 8
  -- Tier 7: vệ tinh HN/HCM + công nghiệp
  WHEN province IN ('Bình Dương', 'Đồng Nai', 'Bắc Ninh', 'Hưng Yên', 'Long An') THEN 7
  -- Tier 6: du lịch / coastal hot
  WHEN province IN ('Khánh Hòa', 'Bà Rịa - Vũng Tàu', 'Quảng Ninh', 'Phú Quốc', 'Lâm Đồng') THEN 6
  -- Tier 5: mid-tier
  WHEN province IN ('Quảng Nam', 'Bình Định', 'Phú Yên', 'Thanh Hóa', 'Nghệ An', 'Hà Tĩnh',
                    'Tây Ninh', 'An Giang', 'Tiền Giang', 'Hải Dương') THEN 5
  -- Tier 4: published others
  WHEN published = true THEN 4
  -- Tier 0: unpublished or unmatched
  ELSE 0
END;
