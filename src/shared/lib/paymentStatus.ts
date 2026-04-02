export function isPaymentSettled(status?: string | null) {
  return status === "Success" || status === "Paid";
}

export function isPaymentActive(status?: string | null) {
  return status === "Pending" || status === "Processing";
}

export function paymentStatusLabelVietnam(status?: string | null) {
  if (!status) return "Chưa có";
  if (status === "Pending") return "Chờ xử lý";
  if (status === "Processing") return "Đang xử lý";
  if (status === "Success" || status === "Paid") return "Đã thanh toán";
  if (status === "Cancelled") return "Đã hủy";
  if (status === "Failed") return "Thất bại";
  if (status === "Refunded") return "Đã hoàn tiền";
  return status;
}

