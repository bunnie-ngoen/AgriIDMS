/** Nhãn tiếng Việt cho trạng thái box (BoxStatus từ API, thường là PascalCase). */
export function boxStatusLabelVietnam(status: string | null | undefined): string {
  if (status === null || status === undefined || status === "") return "—";
  const s = String(status).trim();
  const key = s.replace(/\s/g, "").toLowerCase();
  switch (key) {
    case "stored":
      return "Đang lưu kho";
    case "reserved":
      return "Đang giữ";
    case "picking":
      return "Đang lấy hàng";
    case "exported":
      return "Đã xuất kho";
    case "damaged":
      return "Hư hỏng";
    case "expired":
      return "Hết hạn";
    case "disposed":
      return "Đã tiêu hủy";
    case "sold":
      return "Đã xuất bán";
    case "blocked":
      return "Tạm khóa";
    default:
      return s;
  }
}
