export const provinces = [
  "Vĩnh Phúc",
  "Hà Nội",
  "TP Hồ Chí Minh",
  "Đà Nẵng",
] as const;

export type Province = (typeof provinces)[number];

export const districtOptions: Record<Province, string[]> = {
  "Vĩnh Phúc": ["Vĩnh Tường"],
  "Hà Nội": ["Ba Đình", "Hoàn Kiếm", "Cầu Giấy"],
  "TP Hồ Chí Minh": ["Quận 1", "Quận 3", "Gò Vấp"],
  "Đà Nẵng": ["Hải Châu", "Thanh Khê", "Sơn Trà"],
};

// Ward options are kept small (UI convenience). If you need exact administrative wards,
// consider integrating a real address dataset/API.
export const wardOptions: Record<string, string[]> = {
  "Vĩnh Tường": [
    "Thị trấn Thổ Tang",
    "Thị trấn Tứ Trưng",
    "Thị trấn Vĩnh Tường",
    "An Tường",
    "Bình Dương",
    "Bồ Sao",
    "Cao Đại",
    "Chấn Hưng",
    "Đại Đồng",
    "Kim Xá",
    "Lũng Hòa",
    "Lý Nhân",
    "Nghĩa Hưng",
    "Ngũ Kiên",
    "Phú Đa",
    "Tam Phúc",
    "Tân Phú",
    "Tân Tiến",
    "Thượng Trưng",
    "Tuân Chính",
    "Vân Xuân",
    "Việt Xuân",
    "Vĩnh Ninh",
    "Vĩnh Sơn",
    "Vĩnh Thịnh",
    "Vũ Di",
    "Yên Bình",
    "Yên Lập",
  ],
  "Ba Đình": ["Phường 1", "Phường 2", "Phường 3"],
  "Hoàn Kiếm": ["Phường 1", "Phường 2", "Phường 3"],
  "Cầu Giấy": ["Phường 1", "Phường 2", "Phường 3"],
  "Quận 1": ["Phường 1", "Phường 2", "Phường 3"],
  "Quận 3": ["Phường 1", "Phường 2", "Phường 3"],
  "Gò Vấp": ["Phường 1", "Phường 2", "Phường 3"],
  "Hải Châu": ["Phường 1", "Phường 2", "Phường 3"],
  "Thanh Khê": ["Phường 1", "Phường 2", "Phường 3"],
  "Sơn Trà": ["Phường 1", "Phường 2", "Phường 3"],
};

