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

/** Tailwind classes for pill-style payment status (match order status badges). */
export function paymentStatusTone(status?: string | null): string {
  if (!status) return "bg-slate-100 text-slate-600 border-slate-200";
  if (status === "Pending") return "bg-amber-100 text-amber-800 border-amber-200";
  if (status === "Processing") return "bg-sky-100 text-sky-800 border-sky-200";
  if (status === "Success" || status === "Paid")
    return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (status === "Cancelled") return "bg-rose-100 text-rose-800 border-rose-200";
  if (status === "Failed") return "bg-red-100 text-red-800 border-red-200";
  if (status === "Refunded") return "bg-violet-100 text-violet-800 border-violet-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}

