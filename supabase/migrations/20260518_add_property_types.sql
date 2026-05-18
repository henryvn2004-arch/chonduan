-- Thêm các loại hình bất động sản mới vào enum property_type
-- ALTER TYPE ... ADD VALUE phải chạy ngoài transaction, Supabase tự xử lý

ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'van_phong';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'nha_xuong_cn';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'khu_cong_nghiep';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'dat_nong_nghiep';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'dat_rung';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'khu_nghi_duong';
ALTER TYPE property_type ADD VALUE IF NOT EXISTS 'nha_o_xa_hoi';
