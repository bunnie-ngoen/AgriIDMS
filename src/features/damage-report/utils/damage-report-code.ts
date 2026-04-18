/** Hiển thị mã phiếu thống nhất (backend dùng số Id). */
export function formatDamageReportCode(id: number): string {
  return `BH-${String(id).padStart(6, "0")}`;
}
