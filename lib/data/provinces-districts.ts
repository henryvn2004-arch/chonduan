export interface ProvinceData {
  name: string
  lat: number
  lng: number
  districts: string[]
}

// 63 tỉnh/thành — tên khớp với giá trị lưu trong DB (projects.province)
// Sắp xếp: HN + HCM đầu, còn lại theo vùng địa lý Bắc → Trung → Nam
export const PROVINCES_DATA: ProvinceData[] = [
  // ── Hai đô thị lớn ────────────────────────────────────────────────────────
  {
    name: 'Hà Nội', lat: 21.0285, lng: 105.8542,
    districts: [
      'Ba Đình', 'Hoàn Kiếm', 'Tây Hồ', 'Long Biên', 'Cầu Giấy',
      'Đống Đa', 'Hai Bà Trưng', 'Hoàng Mai', 'Thanh Xuân',
      'Nam Từ Liêm', 'Bắc Từ Liêm', 'Hà Đông',
      'Sơn Tây', 'Ba Vì', 'Chương Mỹ', 'Đan Phượng', 'Đông Anh',
      'Gia Lâm', 'Hoài Đức', 'Mê Linh', 'Mỹ Đức', 'Phú Xuyên',
      'Phúc Thọ', 'Quốc Oai', 'Sóc Sơn', 'Thạch Thất',
      'Thanh Oai', 'Thanh Trì', 'Thường Tín', 'Ứng Hòa',
    ],
  },
  {
    name: 'TP. Hồ Chí Minh', lat: 10.7769, lng: 106.7009,
    districts: [
      'Quận 1', 'Quận 2', 'Quận 3', 'Quận 4', 'Quận 5', 'Quận 6',
      'Quận 7', 'Quận 8', 'Quận 9', 'Quận 10', 'Quận 11', 'Quận 12',
      'TP. Thủ Đức', 'Bình Thạnh', 'Gò Vấp', 'Phú Nhuận',
      'Tân Bình', 'Tân Phú', 'Bình Tân',
      'Bình Chánh', 'Hóc Môn', 'Củ Chi', 'Nhà Bè', 'Cần Giờ',
    ],
  },

  // ── Đông Nam Bộ ───────────────────────────────────────────────────────────
  {
    name: 'Bình Dương', lat: 11.3254, lng: 106.4770,
    districts: [
      'TP. Thủ Dầu Một', 'TP. Dĩ An', 'TP. Thuận An', 'TP. Bến Cát',
      'TX. Tân Uyên', 'Bắc Tân Uyên', 'Bàu Bàng', 'Dầu Tiếng', 'Phú Giáo',
    ],
  },
  {
    name: 'Đồng Nai', lat: 11.0686, lng: 107.1676,
    districts: [
      'TP. Biên Hòa', 'TP. Long Khánh', 'Long Thành', 'Nhơn Trạch',
      'Trảng Bom', 'Vĩnh Cửu', 'Xuân Lộc', 'Định Quán',
      'Thống Nhất', 'Tân Phú', 'Cẩm Mỹ',
    ],
  },
  {
    name: 'Bà Rịa - Vũng Tàu', lat: 10.5417, lng: 107.2429,
    districts: [
      'TP. Vũng Tàu', 'TP. Bà Rịa', 'TX. Phú Mỹ',
      'Châu Đức', 'Đất Đỏ', 'Long Điền', 'Xuyên Mộc', 'Côn Đảo',
    ],
  },
  {
    name: 'Tây Ninh', lat: 11.3600, lng: 106.1100,
    districts: [
      'TP. Tây Ninh', 'Bến Cầu', 'Châu Thành', 'Dương Minh Châu',
      'Gò Dầu', 'Hòa Thành', 'Tân Biên', 'Tân Châu', 'Trảng Bàng',
    ],
  },
  {
    name: 'Bình Phước', lat: 11.7512, lng: 106.9021,
    districts: [
      'TP. Đồng Xoài', 'TX. Bình Long', 'TX. Phước Long',
      'Bù Đăng', 'Bù Đốp', 'Bù Gia Mập', 'Chơn Thành',
      'Đồng Phú', 'Hớn Quản', 'Lộc Ninh', 'Phú Riềng',
    ],
  },

  // ── Đồng bằng sông Cửu Long ───────────────────────────────────────────────
  {
    name: 'Long An', lat: 10.6957, lng: 106.2431,
    districts: [
      'TP. Tân An', 'TX. Kiến Tường', 'Bến Lức', 'Cần Đước', 'Cần Giuộc',
      'Châu Thành', 'Đức Hòa', 'Đức Huệ', 'Mộc Hóa', 'Tân Hưng',
      'Tân Thạnh', 'Tân Trụ', 'Thạnh Hóa', 'Thủ Thừa', 'Vĩnh Hưng',
    ],
  },
  {
    name: 'Tiền Giang', lat: 10.3600, lng: 106.3594,
    districts: [
      'TP. Mỹ Tho', 'TX. Cai Lậy', 'TX. Gò Công',
      'Cai Lậy', 'Cái Bè', 'Châu Thành', 'Chợ Gạo',
      'Gò Công Đông', 'Gò Công Tây', 'Tân Phú Đông', 'Tân Phước',
    ],
  },
  {
    name: 'Bến Tre', lat: 10.2433, lng: 106.3756,
    districts: [
      'TP. Bến Tre', 'Ba Tri', 'Bình Đại', 'Châu Thành',
      'Chợ Lách', 'Giồng Trôm', 'Mỏ Cày Bắc', 'Mỏ Cày Nam', 'Thạnh Phú',
    ],
  },
  {
    name: 'Vĩnh Long', lat: 10.2397, lng: 105.9572,
    districts: [
      'TP. Vĩnh Long', 'TX. Bình Minh', 'Bình Tân',
      'Long Hồ', 'Mang Thít', 'Tam Bình', 'Trà Ôn', 'Vũng Liêm',
    ],
  },
  {
    name: 'Đồng Tháp', lat: 10.4938, lng: 105.6882,
    districts: [
      'TP. Cao Lãnh', 'TP. Sa Đéc', 'TX. Hồng Ngự',
      'Cao Lãnh', 'Châu Thành', 'Hồng Ngự', 'Lai Vung',
      'Lấp Vò', 'Tam Nông', 'Tân Hồng', 'Tháp Mười', 'Thanh Bình',
    ],
  },
  {
    name: 'An Giang', lat: 10.5216, lng: 105.1259,
    districts: [
      'TP. Long Xuyên', 'TP. Châu Đốc', 'TX. Tân Châu',
      'An Phú', 'Châu Phú', 'Châu Thành', 'Chợ Mới',
      'Phú Tân', 'Thoại Sơn', 'Tịnh Biên', 'Tri Tôn',
    ],
  },
  {
    name: 'Kiên Giang', lat: 10.0125, lng: 105.0809,
    districts: [
      'TP. Rạch Giá', 'TX. Hà Tiên', 'TP. Phú Quốc',
      'An Biên', 'An Minh', 'Châu Thành', 'Giang Thành', 'Giồng Riềng',
      'Gò Quao', 'Hòn Đất', 'Kiên Hải', 'Kiên Lương',
      'Tân Hiệp', 'U Minh Thượng', 'Vĩnh Thuận',
    ],
  },
  {
    name: 'Cần Thơ', lat: 10.0452, lng: 105.7469,
    districts: [
      'Ninh Kiều', 'Bình Thủy', 'Cái Răng', 'Ô Môn', 'Thốt Nốt',
      'Vĩnh Thạnh', 'Cờ Đỏ', 'Phong Điền', 'Thới Lai',
    ],
  },
  {
    name: 'Hậu Giang', lat: 9.7579, lng: 105.6413,
    districts: [
      'TP. Vị Thanh', 'TP. Ngã Bảy', 'TX. Long Mỹ',
      'Châu Thành', 'Châu Thành A', 'Long Mỹ', 'Phụng Hiệp', 'Vị Thủy',
    ],
  },
  {
    name: 'Trà Vinh', lat: 9.9513, lng: 106.3421,
    districts: [
      'TP. Trà Vinh', 'TX. Duyên Hải',
      'Càng Long', 'Châu Thành', 'Cầu Kè', 'Cầu Ngang',
      'Duyên Hải', 'Tiểu Cần', 'Trà Cú',
    ],
  },
  {
    name: 'Sóc Trăng', lat: 9.6024, lng: 105.9739,
    districts: [
      'TP. Sóc Trăng', 'TX. Ngã Năm', 'TX. Vĩnh Châu',
      'Châu Thành', 'Cù Lao Dung', 'Kế Sách', 'Long Phú',
      'Mỹ Tú', 'Mỹ Xuyên', 'Thạnh Trị', 'Trần Đề',
    ],
  },
  {
    name: 'Bạc Liêu', lat: 9.2853, lng: 105.7278,
    districts: [
      'TP. Bạc Liêu', 'TX. Giá Rai',
      'Đông Hải', 'Giá Rai', 'Hòa Bình', 'Hồng Dân', 'Phước Long', 'Vĩnh Lợi',
    ],
  },
  {
    name: 'Cà Mau', lat: 9.1769, lng: 105.1500,
    districts: [
      'TP. Cà Mau', 'Cái Nước', 'Đầm Dơi', 'Năm Căn',
      'Ngọc Hiển', 'Phú Tân', 'Thới Bình', 'Trần Văn Thời', 'U Minh',
    ],
  },

  // ── Duyên hải Nam Trung Bộ ────────────────────────────────────────────────
  {
    name: 'Đà Nẵng', lat: 16.0544, lng: 108.2022,
    districts: [
      'Hải Châu', 'Thanh Khê', 'Sơn Trà', 'Ngũ Hành Sơn',
      'Liên Chiểu', 'Cẩm Lệ', 'Hòa Vang', 'Hoàng Sa',
    ],
  },
  {
    name: 'Quảng Nam', lat: 15.5394, lng: 108.0191,
    districts: [
      'TP. Tam Kỳ', 'TP. Hội An', 'TX. Điện Bàn',
      'Bắc Trà My', 'Đại Lộc', 'Đông Giang', 'Duy Xuyên',
      'Hiệp Đức', 'Nam Giang', 'Nam Trà My', 'Nông Sơn',
      'Núi Thành', 'Phú Ninh', 'Phước Sơn', 'Quế Sơn',
      'Tây Giang', 'Thăng Bình', 'Tiên Phước',
    ],
  },
  {
    name: 'Quảng Ngãi', lat: 15.1203, lng: 108.7922,
    districts: [
      'TP. Quảng Ngãi', 'TX. Đức Phổ',
      'Ba Tơ', 'Bình Sơn', 'Lý Sơn', 'Minh Long', 'Mộ Đức',
      'Nghĩa Hành', 'Sơn Hà', 'Sơn Tây', 'Sơn Tịnh',
      'Tây Trà', 'Trà Bồng', 'Tư Nghĩa',
    ],
  },
  {
    name: 'Bình Định', lat: 13.7765, lng: 109.2237,
    districts: [
      'TP. Quy Nhơn', 'TX. An Nhơn', 'TX. Hoài Nhơn',
      'An Lão', 'Hoài Ân', 'Phù Cát', 'Phù Mỹ',
      'Tây Sơn', 'Tuy Phước', 'Vân Canh', 'Vĩnh Thạnh',
    ],
  },
  {
    name: 'Phú Yên', lat: 13.0882, lng: 109.0929,
    districts: [
      'TP. Tuy Hòa', 'TX. Đông Hòa', 'TX. Sông Cầu',
      'Đồng Xuân', 'Phú Hòa', 'Sơn Hòa', 'Sông Hinh', 'Tây Hòa', 'Tuy An',
    ],
  },
  {
    name: 'Khánh Hòa', lat: 12.2585, lng: 109.0526,
    districts: [
      'TP. Nha Trang', 'TP. Cam Ranh', 'TX. Ninh Hòa',
      'Cam Lâm', 'Diên Khánh', 'Khánh Sơn', 'Khánh Vĩnh', 'Trường Sa', 'Vạn Ninh',
    ],
  },
  {
    name: 'Ninh Thuận', lat: 11.5638, lng: 108.9882,
    districts: [
      'TP. Phan Rang-Tháp Chàm',
      'Bác Ái', 'Ninh Hải', 'Ninh Phước', 'Ninh Sơn', 'Thuận Bắc', 'Thuận Nam',
    ],
  },
  {
    name: 'Bình Thuận', lat: 11.0904, lng: 108.0720,
    districts: [
      'TP. Phan Thiết', 'TX. La Gi',
      'Bắc Bình', 'Đức Linh', 'Hàm Tân', 'Hàm Thuận Bắc',
      'Hàm Thuận Nam', 'Phú Quý', 'Tuy Phong',
    ],
  },

  // ── Bắc Trung Bộ ──────────────────────────────────────────────────────────
  {
    name: 'Thừa Thiên Huế', lat: 16.4637, lng: 107.5909,
    districts: [
      'TP. Huế', 'TX. Hương Thủy', 'TX. Hương Trà',
      'A Lưới', 'Nam Đông', 'Phong Điền', 'Phú Lộc', 'Phú Vang', 'Quảng Điền',
    ],
  },
  {
    name: 'Quảng Trị', lat: 16.7453, lng: 107.1854,
    districts: [
      'TP. Đông Hà', 'TX. Quảng Trị',
      'Cam Lộ', 'Đakrông', 'Gio Linh', 'Hải Lăng',
      'Hướng Hóa', 'Triệu Phong', 'Vĩnh Linh',
    ],
  },
  {
    name: 'Quảng Bình', lat: 17.4689, lng: 106.5986,
    districts: [
      'TP. Đồng Hới', 'TX. Ba Đồn',
      'Bố Trạch', 'Lệ Thủy', 'Minh Hóa', 'Quảng Ninh', 'Quảng Trạch', 'Tuyên Hóa',
    ],
  },
  {
    name: 'Hà Tĩnh', lat: 18.3559, lng: 105.8877,
    districts: [
      'TP. Hà Tĩnh', 'TX. Hồng Lĩnh', 'TX. Kỳ Anh',
      'Cẩm Xuyên', 'Can Lộc', 'Đức Thọ', 'Hương Khê',
      'Hương Sơn', 'Kỳ Anh', 'Lộc Hà', 'Nghi Xuân', 'Thạch Hà', 'Vũ Quang',
    ],
  },
  {
    name: 'Nghệ An', lat: 18.6733, lng: 105.6922,
    districts: [
      'TP. Vinh', 'TX. Cửa Lò', 'TX. Hoàng Mai', 'TX. Thái Hòa',
      'Anh Sơn', 'Con Cuông', 'Diễn Châu', 'Đô Lương',
      'Hưng Nguyên', 'Kỳ Sơn', 'Nam Đàn', 'Nghi Lộc',
      'Nghĩa Đàn', 'Quế Phong', 'Quỳ Châu', 'Quỳ Hợp',
      'Quỳnh Lưu', 'Tân Kỳ', 'Thanh Chương', 'Tương Dương', 'Yên Thành',
    ],
  },
  {
    name: 'Thanh Hóa', lat: 19.8067, lng: 105.7851,
    districts: [
      'TP. Thanh Hóa', 'TX. Bỉm Sơn', 'TX. Sầm Sơn',
      'Bá Thước', 'Cẩm Thủy', 'Đông Sơn', 'Hà Trung', 'Hậu Lộc',
      'Hoằng Hóa', 'Lang Chánh', 'Mường Lát', 'Nga Sơn', 'Ngọc Lặc',
      'Như Thanh', 'Như Xuân', 'Nông Cống', 'Quan Hóa', 'Quan Sơn',
      'Quảng Xương', 'Thạch Thành', 'Thiệu Hóa', 'Thọ Xuân',
      'Thường Xuân', 'Tĩnh Gia', 'Triệu Sơn', 'Vĩnh Lộc', 'Yên Định',
    ],
  },

  // ── Tây Nguyên ────────────────────────────────────────────────────────────
  {
    name: 'Lâm Đồng', lat: 11.9405, lng: 108.4419,
    districts: [
      'TP. Đà Lạt', 'TP. Bảo Lộc',
      'Bảo Lâm', 'Cát Tiên', 'Đạ Huoai', 'Đạ Tẻh',
      'Đam Rông', 'Di Linh', 'Đơn Dương', 'Đức Trọng', 'Lạc Dương', 'Lâm Hà',
    ],
  },
  {
    name: 'Đắk Lắk', lat: 12.7100, lng: 108.2378,
    districts: [
      'TP. Buôn Ma Thuột', 'TX. Buôn Hồ',
      'Buôn Đôn', 'Cư Kuin', 'Cư M\'gar', 'Ea H\'leo', 'Ea Kar', 'Ea Súp',
      'Krông Ana', 'Krông Bông', 'Krông Búk', 'Krông Năng',
      'Krông Pắc', 'Lắk', 'M\'Drắk',
    ],
  },
  {
    name: 'Đắk Nông', lat: 12.0000, lng: 107.6900,
    districts: [
      'TP. Gia Nghĩa',
      'Cư Jút', 'Đắk Glong', 'Đắk Mil', 'Đắk R\'Lấp',
      'Đắk Song', 'Krông Nô', 'Tuy Đức',
    ],
  },
  {
    name: 'Gia Lai', lat: 13.9810, lng: 108.0000,
    districts: [
      'TP. Pleiku', 'TX. An Khê', 'TX. Ayun Pa',
      'Chư Păh', 'Chư Prông', 'Chư Pưh', 'Chư Sê', 'Đắk Đoa', 'Đắk Pơ',
      'Đức Cơ', 'Ia Grai', 'Ia Pa', 'K\'Bang', 'Kong Chro',
      'Krông Pa', 'Mang Yang', 'Phú Thiện',
    ],
  },
  {
    name: 'Kon Tum', lat: 14.3497, lng: 107.9990,
    districts: [
      'TP. Kon Tum',
      'Đắk Glei', 'Đắk Hà', 'Đắk Tô', 'Ia H\'Drai',
      'Kon Plông', 'Kon Rẫy', 'Ngọc Hồi', 'Sa Thầy', 'Tu Mơ Rông',
    ],
  },

  // ── Đồng bằng Bắc Bộ ─────────────────────────────────────────────────────
  {
    name: 'Hải Phòng', lat: 20.8449, lng: 106.6881,
    districts: [
      'Hồng Bàng', 'Lê Chân', 'Ngô Quyền', 'Kiến An', 'Hải An',
      'Đồ Sơn', 'Dương Kinh',
      'An Dương', 'An Lão', 'Bạch Long Vĩ', 'Cát Hải',
      'Kiến Thụy', 'Thủy Nguyên', 'Tiên Lãng', 'Vĩnh Bảo',
    ],
  },
  {
    name: 'Hưng Yên', lat: 20.6464, lng: 106.0511,
    districts: [
      'TP. Hưng Yên',
      'Ân Thi', 'Khoái Châu', 'Kim Động', 'Mỹ Hào',
      'Phù Cừ', 'Tiên Lữ', 'Văn Giang', 'Văn Lâm', 'Yên Mỹ',
    ],
  },
  {
    name: 'Thái Bình', lat: 20.4463, lng: 106.3365,
    districts: [
      'TP. Thái Bình',
      'Đông Hưng', 'Hưng Hà', 'Kiến Xương', 'Quỳnh Phụ',
      'Thái Thụy', 'Tiền Hải', 'Vũ Thư',
    ],
  },
  {
    name: 'Hà Nam', lat: 20.5836, lng: 105.9230,
    districts: [
      'TP. Phủ Lý', 'TX. Duy Tiên',
      'Bình Lục', 'Kim Bảng', 'Lý Nhân', 'Thanh Liêm',
    ],
  },
  {
    name: 'Nam Định', lat: 20.4388, lng: 106.1621,
    districts: [
      'TP. Nam Định',
      'Giao Thủy', 'Hải Hậu', 'Mỹ Lộc', 'Nam Trực', 'Nghĩa Hưng',
      'Trực Ninh', 'Vụ Bản', 'Xuân Trường', 'Ý Yên',
    ],
  },
  {
    name: 'Ninh Bình', lat: 20.2506, lng: 105.9745,
    districts: [
      'TP. Ninh Bình', 'TX. Tam Điệp',
      'Gia Viễn', 'Hoa Lư', 'Kim Sơn', 'Nho Quan', 'Yên Khánh', 'Yên Mô',
    ],
  },
  {
    name: 'Hải Dương', lat: 20.9373, lng: 106.3144,
    districts: [
      'TP. Hải Dương', 'TX. Chí Linh',
      'Bình Giang', 'Cẩm Giàng', 'Gia Lộc', 'Kim Thành', 'Kinh Môn',
      'Nam Sách', 'Ninh Giang', 'Tứ Kỳ', 'Thanh Hà', 'Thanh Miện',
    ],
  },
  {
    name: 'Bắc Ninh', lat: 21.1861, lng: 106.0763,
    districts: [
      'TP. Bắc Ninh', 'TX. Từ Sơn',
      'Gia Bình', 'Lương Tài', 'Quế Võ', 'Thuận Thành', 'Tiên Du', 'Yên Phong',
    ],
  },
  {
    name: 'Vĩnh Phúc', lat: 21.3609, lng: 105.5474,
    districts: [
      'TP. Vĩnh Yên', 'TX. Phúc Yên',
      'Bình Xuyên', 'Lập Thạch', 'Sông Lô', 'Tam Đảo', 'Tam Dương', 'Vĩnh Tường', 'Yên Lạc',
    ],
  },
  {
    name: 'Phú Thọ', lat: 21.3415, lng: 105.2346,
    districts: [
      'TP. Việt Trì', 'TX. Phú Thọ',
      'Cẩm Khê', 'Đoan Hùng', 'Hạ Hòa', 'Lâm Thao', 'Phù Ninh',
      'Tam Nông', 'Tân Sơn', 'Thanh Ba', 'Thanh Sơn', 'Thanh Thủy', 'Yên Lập',
    ],
  },
  {
    name: 'Thái Nguyên', lat: 21.5942, lng: 105.8412,
    districts: [
      'TP. Thái Nguyên', 'TP. Sông Công', 'TX. Phổ Yên',
      'Định Hóa', 'Đại Từ', 'Đồng Hỷ', 'Phú Bình', 'Phú Lương', 'Võ Nhai',
    ],
  },
  {
    name: 'Bắc Giang', lat: 21.2820, lng: 106.1977,
    districts: [
      'TP. Bắc Giang',
      'Hiệp Hòa', 'Lạng Giang', 'Lục Nam', 'Lục Ngạn',
      'Sơn Động', 'Tân Yên', 'Việt Yên', 'Yên Dũng', 'Yên Thế',
    ],
  },
  {
    name: 'Quảng Ninh', lat: 21.0064, lng: 107.2925,
    districts: [
      'TP. Hạ Long', 'TP. Móng Cái', 'TX. Đông Triều', 'TX. Quảng Yên', 'TX. Uông Bí',
      'Ba Chẽ', 'Bình Liêu', 'Cô Tô', 'Đầm Hà', 'Hải Hà',
      'Tiên Yên', 'Vân Đồn',
    ],
  },

  // ── Trung du và miền núi Bắc Bộ ──────────────────────────────────────────
  {
    name: 'Lạng Sơn', lat: 21.8537, lng: 106.7615,
    districts: [
      'TP. Lạng Sơn',
      'Bắc Sơn', 'Bình Gia', 'Cao Lộc', 'Chi Lăng', 'Đình Lập',
      'Hữu Lũng', 'Lộc Bình', 'Tràng Định', 'Văn Lãng', 'Văn Quan',
    ],
  },
  {
    name: 'Cao Bằng', lat: 22.6657, lng: 106.2522,
    districts: [
      'TP. Cao Bằng',
      'Bảo Lâm', 'Bảo Lạc', 'Hà Quảng', 'Hòa An', 'Nguyên Bình',
      'Quảng Hòa', 'Thạch An', 'Thông Nông', 'Trùng Khánh',
    ],
  },
  {
    name: 'Hà Giang', lat: 22.8025, lng: 104.9784,
    districts: [
      'TP. Hà Giang',
      'Bắc Mê', 'Bắc Quang', 'Đồng Văn', 'Hoàng Su Phì',
      'Mèo Vạc', 'Quản Bạ', 'Quang Bình', 'Vị Xuyên', 'Xín Mần', 'Yên Minh',
    ],
  },
  {
    name: 'Bắc Kạn', lat: 22.1472, lng: 105.8348,
    districts: [
      'TP. Bắc Kạn',
      'Ba Bể', 'Bạch Thông', 'Chợ Đồn', 'Chợ Mới', 'Na Rì', 'Ngân Sơn', 'Pác Nặm',
    ],
  },
  {
    name: 'Tuyên Quang', lat: 21.8230, lng: 105.2141,
    districts: [
      'TP. Tuyên Quang',
      'Chiêm Hóa', 'Hàm Yên', 'Lâm Bình', 'Na Hang', 'Sơn Dương', 'Yên Sơn',
    ],
  },
  {
    name: 'Lào Cai', lat: 22.4803, lng: 103.9754,
    districts: [
      'TP. Lào Cai',
      'Bảo Thắng', 'Bảo Yên', 'Bát Xát', 'Mường Khương',
      'Sa Pa', 'Si Ma Cai', 'Văn Bàn',
    ],
  },
  {
    name: 'Yên Bái', lat: 21.7051, lng: 104.8754,
    districts: [
      'TP. Yên Bái', 'TX. Nghĩa Lộ',
      'Lục Yên', 'Mù Cang Chải', 'Trấn Yên', 'Trạm Tấu',
      'Văn Chấn', 'Văn Yên', 'Yên Bình',
    ],
  },
  {
    name: 'Hòa Bình', lat: 20.8131, lng: 105.3388,
    districts: [
      'TP. Hòa Bình',
      'Cao Phong', 'Đà Bắc', 'Kim Bôi', 'Kỳ Sơn', 'Lạc Sơn',
      'Lạc Thủy', 'Lương Sơn', 'Mai Châu', 'Tân Lạc', 'Yên Thủy',
    ],
  },
  {
    name: 'Sơn La', lat: 21.3256, lng: 103.9188,
    districts: [
      'TP. Sơn La',
      'Bắc Yên', 'Mai Sơn', 'Mộc Châu', 'Mường La', 'Phù Yên',
      'Quỳnh Nhai', 'Sốp Cộp', 'Thuận Châu', 'Vân Hồ', 'Yên Châu',
    ],
  },
  {
    name: 'Điện Biên', lat: 21.3860, lng: 103.0169,
    districts: [
      'TP. Điện Biên Phủ', 'TX. Mường Lay',
      'Điện Biên', 'Điện Biên Đông', 'Mường Ảng', 'Mường Chà',
      'Mường Nhé', 'Nậm Pồ', 'Tủa Chùa', 'Tuần Giáo',
    ],
  },
  {
    name: 'Lai Châu', lat: 22.3964, lng: 103.4584,
    districts: [
      'TP. Lai Châu',
      'Mường Tè', 'Nậm Nhùn', 'Phong Thổ', 'Sìn Hồ',
      'Tam Đường', 'Tân Uyên', 'Than Uyên',
    ],
  },
]

// Lookup map: tên tỉnh → ProvinceData
export const PROVINCE_MAP: Record<string, ProvinceData> = Object.fromEntries(
  PROVINCES_DATA.map(p => [p.name, p])
)

// Chỉ tên tỉnh (để render select options)
export const PROVINCE_NAMES = PROVINCES_DATA.map(p => p.name)
