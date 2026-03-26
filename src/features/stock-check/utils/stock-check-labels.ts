export function toVietnameseStockCheckStatus(status?: string | null): string {
  switch (status) {
    case "Draft":
      return "Nháp";
    case "InProgress":
      return "Đang đếm";
    case "Counted":
      return "Chờ duyệt";
    case "Approved":
      return "Đã duyệt";
    case "Rejected":
      return "Đã từ chối";
    default:
      return status ?? "—";
  }
}

export function toVietnameseStockCheckType(checkType?: string | null): string {
  switch (checkType) {
    case "Full":
      return "Toàn phần";
    case "Cycle":
      return "Theo chu kỳ";
    case "Spot":
      return "Đột xuất";
    default:
      return checkType ?? "—";
  }
}

export function toVietnameseVarianceType(type?: string | null): string {
  switch (type) {
    case "Match":
      return "Khớp";
    case "Shortage":
      return "Thiếu";
    case "Excess":
      return "Dư";
    default:
      return type ?? "—";
  }
}

export function toVietnameseVarianceReason(reason?: string | null): string {
  switch (reason) {
    case "Damaged":
      return "Hỏng";
    case "Loss":
      return "Mất";
    case "MeasurementError":
      return "Sai số cân";
    default:
      return reason ?? "—";
  }
}
