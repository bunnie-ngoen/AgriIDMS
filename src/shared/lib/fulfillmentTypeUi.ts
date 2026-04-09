/** Fulfillment (nhận hàng) — labels + pill colors. */

export function fulfillmentTypeLabel(ft?: string | null): string {
  if (ft === "Delivery") return "Giao hàng tận nơi";
  if (ft === "TakeAway") return "Nhận tại quầy";
  return ft?.trim() ? ft : "—";
}

export function fulfillmentTypeTone(ft?: string | null): string {
  if (ft === "Delivery") return "bg-amber-100 text-amber-900 border-amber-200";
  if (ft === "TakeAway") return "bg-teal-100 text-teal-800 border-teal-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}
