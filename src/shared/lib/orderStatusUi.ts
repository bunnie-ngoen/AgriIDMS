/** Order lifecycle status — Vietnamese labels + Tailwind pill classes (sales / staff tables). */

export function orderStatusTone(status: string): string {
  if (status === "PendingSaleConfirmation") {
    return "bg-sky-100 text-sky-700 border-sky-200";
  }
  if (status === "AwaitingAllocation") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
  if (status === "PartiallyAllocated") {
    return "bg-amber-100 text-amber-700 border-amber-200";
  }
  if (status === "PendingWarehouseConfirm") {
    return "bg-indigo-100 text-indigo-700 border-indigo-200";
  }
  if (status === "BackorderWaiting") {
    return "bg-violet-100 text-violet-700 border-violet-200";
  }
  if (status === "Confirmed") {
    return "bg-teal-100 text-teal-700 border-teal-200";
  }
  if (status === "ApprovedExport") {
    return "bg-cyan-100 text-cyan-700 border-cyan-200";
  }
  if (status === "Delivered") {
    return "bg-green-100 text-green-700 border-green-200";
  }
  if (status === "FailedDelivery") {
    return "bg-orange-100 text-orange-700 border-orange-200";
  }
  if (status === "Returned") {
    return "bg-slate-200 text-slate-700 border-slate-300";
  }
  if (status === "Completed") {
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  }
  if (status === "Cancelled") {
    return "bg-rose-100 text-rose-700 border-rose-200";
  }
  return "bg-slate-100 text-slate-700 border-slate-200";
}

export function orderStatusLabel(status: string): string {
  if (status === "PendingSaleConfirmation") return "Chờ xác nhận bán";
  if (status === "AwaitingAllocation") return "Chờ giữ hàng";
  if (status === "PendingWarehouseConfirm") return "Chờ kho xác nhận";
  if (status === "PartiallyAllocated") return "Giữ hàng một phần";
  if (status === "BackorderWaiting") return "Chờ backorder";
  if (status === "Confirmed") return "Đã xác nhận";
  if (status === "ApprovedExport") return "Đã duyệt xuất";
  if (status === "Delivered") return "Đã giao hàng";
  if (status === "FailedDelivery") return "Giao thất bại";
  if (status === "Returned") return "Hoàn hàng";
  if (status === "Completed") return "Hoàn thành";
  if (status === "Cancelled") return "Đã hủy";
  return status;
}
