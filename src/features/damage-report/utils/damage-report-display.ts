import type { DamageReportDto } from "../types/damage-report.types";

/** Khối lượng còn tốt (hiển thị): pending dùng snapshot lúc báo; đã duyệt partial dùng snapshot lúc duyệt. */
export function getDisplayGoodRemainingKg(d: DamageReportDto): number | null {
  if (d.requestedProcessingOutcome !== "PartialDamaged") return null;
  if (d.status === "Approved") {
    const snap = d.boxWeightSnapshotKg;
    const dam = d.approvedDamagedWeightKg;
    if (snap == null || dam == null) return null;
    return Math.max(0, snap - dam);
  }
  const at = d.boxWeightAtReportKg;
  const dam = d.requestedDamagedWeightKg;
  if (at == null || dam == null) return null;
  return Math.max(0, at - dam);
}

export function getDisplayDamagedKg(d: DamageReportDto): number | null {
  if (d.status === "Approved") return d.approvedDamagedWeightKg;
  if (d.requestedProcessingOutcome === "CompleteDamaged") return d.boxWeightAtReportKg;
  return d.requestedDamagedWeightKg;
}
