/** Khớp enum BoxType backend (ToString PascalCase). */
export function boxTypeLabel(type: string): string {
  if (type === "Unknown") return "Chưa xác định";
  if (type === "StyrofoamBox") return "Thùng xốp";
  if (type === "Carton") return "Thùng carton";
  if (type === "MeshBag") return "Bao lưới";
  return type;
}
