import type { DamageReportStatus } from "../types/damage-report.types";
import { DAMAGE_STATUS_LABEL } from "../constants/damage-report-ui.constants";

const cls: Record<DamageReportStatus, string> = {
  Pending: "bg-amber-100 text-amber-800 border border-amber-200",
  Approved: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  Rejected: "bg-rose-100 text-rose-800 border border-rose-200",
};

export function DamageReportStatusBadge({ status }: { status: DamageReportStatus }) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls[status]}`}
    >
      {DAMAGE_STATUS_LABEL[status]}
    </span>
  );
}
