/** Purchase channel (order.source) — labels + pill colors for sales UI. */

export function orderSourceLabel(source: string): string {
  if (source === "Online") return "Mua online";
  if (source === "POS") return "Mua tại quầy";
  return source;
}

export function orderSourceTone(source: string): string {
  if (source === "Online") return "bg-sky-100 text-sky-800 border-sky-200";
  if (source === "POS") return "bg-violet-100 text-violet-800 border-violet-200";
  return "bg-slate-100 text-slate-700 border-slate-200";
}
